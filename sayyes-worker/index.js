import express from 'express';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import cors from 'cors';

dotenv.config({ path: '../.env' });

const app = express();

// Включаем CORS, чтобы React-фронтенд мог делать запросы к нашему API
app.use(cors());
app.use(express.json());

// Инициализация Supabase с админскими правами (Service Role)
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ==========================================
// БЛОК 1: АВТОРИЗАЦИЯ MINI APP (CUSTOM JWT)
// ==========================================

// Утилита для проверки подписи от Telegram
function verifyTelegramWebAppData(telegramInitData, botToken) {
    try {
        const initData = new URLSearchParams(telegramInitData);
        const hash = initData.get('hash');
        initData.delete('hash');
        
        const dataToCheck = [...initData.entries()]
            .map(([key, val]) => `${key}=${val}`)
            .sort()
            .join('\n');
            
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataToCheck).digest('hex');
        
        return calculatedHash === hash;
    } catch (e) {
        return false;
    }
}

// Эндпоинт для выдачи токенов фронтенду
app.post('/auth/telegram', async (req, res) => {
    const { initData, user } = req.body;

    if (!initData || !user) {
        return res.status(400).json({ error: 'Missing initData or user' });
    }

    // Проверяем криптографию
    const isValid = verifyTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN);
    if (!isValid) return res.status(403).json({ error: 'Invalid Telegram Signature' });

    try {
        // Ищем профиль пользователя в нашей БД
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('telegram_id', String(user.id))
            .single();

        if (error || !profile) {
            return res.status(404).json({ error: 'User not found in ERP' });
        }

        // Генерируем Custom JWT с зашитым tenant_id
        const payload = {
            aud: 'authenticated',
            role: 'authenticated',
            sub: profile.id, 
            email: `${profile.telegram_id}@telegram.local`, 
            app_metadata: { provider: 'telegram' },
            user_metadata: {
                tenant_id: profile.tenant_id,
                role: profile.role
            }
        };

        const token = jwt.sign(payload, process.env.SUPABASE_JWT_SECRET, { expiresIn: '24h' });

        // Отдаем токен и профиль на фронтенд
        res.json({ token, profile });
    } catch (err) {
        console.error('Auth logic error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// ==========================================
// БЛОК 2: ОБРАБОТКА ОЧЕРЕДИ УВЕДОМЛЕНИЙ
// ==========================================

// Эндпоинт для планировщика (Cloud Scheduler)
app.post('/internal/process-queue', async (req, res) => {
    try {
        const { data: tasks, error } = await supabase.rpc('pop_notification_queue', { batch_size: 50 });

        if (error) throw error;
        if (!tasks || tasks.length === 0) return res.status(200).send('Queue is empty');

        const tenantIds = [...new Set(tasks.map(t => t.tenant_id))];

        const { data: integrations, error: intError } = await supabase
            .from('salon_integrations')
            .select('tenant_id, telegram_bot_token, green_api_id_instance, green_api_token')
            .in('tenant_id', tenantIds);

        if (intError) throw intError;

        const integrationMap = (integrations || []).reduce((acc, curr) => {
            acc[curr.tenant_id] = curr;
            return acc;
        }, {});

        const results = await Promise.all(tasks.map(task => {
            const tenantIntegrations = integrationMap[task.tenant_id] || {};
            return processTask(task, tenantIntegrations);
        }));

        res.status(200).json({ processed: tasks.length, results });

    } catch (err) {
        console.error('Queue processing error:', err);
        res.status(500).send('Internal Error');
    }
});

async function processTask(task, integrations) {
    try {
        let success = false;

        if (task.channel === 'telegram') {
            if (!integrations.telegram_bot_token) throw new Error('No Telegram token for this tenant');
            success = await sendTelegramMessage(task, integrations.telegram_bot_token);
        } else if (task.channel === 'whatsapp') {
            // success = await sendWhatsAppMessage(task, integrations);
            success = true;
        }

        await supabase
            .from('notification_queue')
            .update({ status: success ? 'sent' : 'failed', sent_at: new Date().toISOString() })
            .eq('id', task.id);

        return { id: task.id, status: success ? 'sent' : 'failed' };
    } catch (error) {
        await supabase
            .from('notification_queue')
            .update({ status: 'failed', error_log: error.message })
            .eq('id', task.id);
        return { id: task.id, status: 'failed', error: error.message };
    }
}

async function sendTelegramMessage(task, botToken) {
    const { data: client, error } = await supabase
        .from('clients')
        .select('telegram_id, is_subscribed_tg')
        .eq('id', task.client_id)
        .single();

    if (error) throw new Error(`Client fetch error: ${error.message}`);
    if (!client?.telegram_id || !client.is_subscribed_tg) throw new Error('Client unsubscribed or missing TG ID');

    const replyMarkup = task.template_type === 'reminder_24h'
        ? {
            inline_keyboard: [
                [{ text: "✅ Подтвердить визит", callback_data: `confirm_${task.appointment_id}` }],
                [{ text: "❌ Отменить / Перенести", callback_data: `cancel_${task.appointment_id}` }]
            ]
        }
        : undefined;

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: client.telegram_id,
            text: task.payload?.text || "Уведомление от салона SayYes",
            reply_markup: replyMarkup
        })
    });

    if (!response.ok) throw new Error(`TG API Error: ${response.statusText}`);
    return true;
}


// ==========================================
// БЛОК 3: WEBHOOKS (ОБРАТНАЯ СВЯЗЬ ОТ КЛИЕНТОВ)
// ==========================================

app.post('/webhook/telegram', async (req, res) => {
    const callbackQuery = req.body.callback_query;

    if (callbackQuery) {
        const data = callbackQuery.data;
        const chatId = callbackQuery.message.chat.id;
        const messageId = callbackQuery.message.message_id;

        if (data.startsWith('confirm_')) {
            const appointmentId = data.replace('confirm_', '');

            try {
                const { data: appt } = await supabase
                    .from('appointments')
                    .select('tenant_id')
                    .eq('id', appointmentId)
                    .single();

                if (appt) {
                    await supabase
                        .from('appointments')
                        .update({ status: 'client_confirmed' })
                        .eq('id', appointmentId);

                    const { data: integration } = await supabase
                        .from('salon_integrations')
                        .select('telegram_bot_token')
                        .eq('tenant_id', appt.tenant_id)
                        .single();

                    if (integration?.telegram_bot_token) {
                        await fetch(`https://api.telegram.org/bot${integration.telegram_bot_token}/editMessageText`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: chatId,
                                message_id: messageId,
                                text: "✅ Спасибо, ваш визит подтвержден! Ждем вас."
                            })
                        });
                    }
                }
            } catch (err) {
                console.error("Webhook processing error:", err);
            }
        }
    }

    res.status(200).send('OK');
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Worker listening on port ${port}`);
});
