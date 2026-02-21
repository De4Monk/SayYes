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
        // 1. Ищем профиль пользователя в таблице profiles (Мастера, Админы)
        let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('telegram_id', String(user.id))
            .single();

        let authRole = null;
        let authSub = null;
        let tenantId = null;

        if (profile) {
            authRole = profile.role || 'authenticated';
            authSub = profile.id;
            tenantId = profile.tenant_id;
        } else {
            // 2. Если в profiles нет, ищем в clients
            const { data: client, error: clientError } = await supabase
                .from('clients')
                .select('*')
                .eq('telegram_id', String(user.id))
                .single();

            if (client) {
                authRole = 'client';
                authSub = client.id;
                tenantId = client.tenant_id;
                profile = client; // Возвращаем профиль клиента
            } else {
                console.log(`[AUTH] User not found in profiles/clients. Starting auto-registration for telegram_id: ${user.id}`);
                // АВТО-РЕГИСТРАЦИЯ: Если юзер зашел впервые, создаем профиль клиента
                const { data: newClient, error: insertError } = await supabase
                    .from('clients')
                    .insert({
                        telegram_id: String(user.id),
                        name: user.first_name + (user.last_name ? ' ' + user.last_name : ''),
                        is_subscribed_tg: true
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('[AUTH] Auto-registration error:', insertError);
                    return res.status(500).json({ error: 'Failed to create new user' });
                }

                console.log(`[AUTH] Auto-registration successful for new client ID: ${newClient.id}`);
                authRole = 'client';
                authSub = newClient.id;
                tenantId = null;
                profile = { ...newClient, role: 'client' };
            }
        }

        // Генерируем Custom JWT с зашитым tenant_id
        const payload = {
            aud: 'authenticated',
            role: 'authenticated', // Supabase требует строку 'authenticated' для доступа к RLS
            sub: authSub,
            email: `${user.id}@telegram.local`,
            app_metadata: { provider: 'telegram' },
            user_metadata: {
                tenant_id: tenantId,
                role: authRole // Наша кастомная роль для Frontend (admin, master, client)
            }
        };

        const token = jwt.sign(payload, process.env.SUPABASE_JWT_SECRET, { expiresIn: '24h' });

        // Отдаем токен и профиль на фронтенд
        res.json({ token, profile: { ...profile, role: authRole } });
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
            success = await sendWhatsAppMessage(task);
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
    // 1. Достаем TG ID клиента и проверяем Opt-out
    const { data: client, error: clientErr } = await supabase
        .from('clients')
        .select('telegram_id, is_subscribed_tg, name')
        .eq('id', task.client_id)
        .single();
    if (clientErr || !client?.telegram_id || !client.is_subscribed_tg) {
        throw new Error('Client unsubscribed or missing TG ID');
    }
    // 2. Получаем шаблон из БД
    const { data: template } = await supabase
        .from('notification_templates')
        .select('message_text')
        .eq('type', task.template_type)
        .single();
    if (!template) throw new Error(`Template not found for type: ${task.template_type}`);
    let messageText = template.message_text;
    // 3. Парсинг переменных
    messageText = messageText.replace(/{{client_name}}/g, client.name || 'Гость');
    messageText = messageText.replace(/{{salon_name}}/g, 'SayYes');
    if (task.appointment_id) {
        const { data: appt } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', task.appointment_id)
            .single();
        if (appt) {
            let masterName = 'вашего мастера';
            if (appt.master_id) {
                const { data: master } = await supabase.from('profiles').select('full_name').eq('dikidi_master_id', appt.master_id).single();
                if (master?.full_name) masterName = master.full_name;
            }

            // Форматируем время в часовой пояс Тбилиси (или нужный локальный)
            const timeStr = new Date(appt.start_time).toLocaleTimeString('ru-RU', { timeZone: 'Asia/Tbilisi', hour: '2-digit', minute: '2-digit' });
            messageText = messageText
                .replace(/{{time}}/g, timeStr)
                .replace(/{{service}}/g, appt.service_name || 'услугу')
                .replace(/{{master_name}}/g, masterName);
        }
    }
    // 4. Формируем клавиатуру (Кнопки)
    let replyMarkup = undefined;
    if (task.template_type === 'reminder_24h') {
        replyMarkup = {
            inline_keyboard: [
                [{ text: "✅ Подтвердить визит", callback_data: `confirm_${task.appointment_id}` }],
                [{ text: "❌ Отменить запись", url: "https://t.me/evgenii_sayyes" }] // Пока кидаем на админа для ручной отмены
            ]
        };
    } else if (task.template_type === 'feedback_request') {
        replyMarkup = {
            inline_keyboard: [[
                { text: "1 ⭐️", callback_data: `nps_1_${task.appointment_id}` },
                { text: "2 ⭐️", callback_data: `nps_2_${task.appointment_id}` },
                { text: "3 ⭐️", callback_data: `nps_3_${task.appointment_id}` },
                { text: "4 ⭐️", callback_data: `nps_4_${task.appointment_id}` },
                { text: "5 ⭐️", callback_data: `nps_5_${task.appointment_id}` }
            ]]
        };
    } else if (task.template_type === 'lost_client') {
        replyMarkup = {
            inline_keyboard: [
                [{ text: "📅 Записаться онлайн", url: "https://dikidi.net/ru" }]
            ]
        };
    }
    // 5. Отправка в Telegram
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: client.telegram_id,
            text: messageText,
            reply_markup: replyMarkup
        })
    });
    if (!response.ok) throw new Error(`TG API Error: ${response.statusText}`);
    return true;
}

async function sendWhatsAppMessage(task) {
    const instanceId = process.env.GREEN_API_INSTANCE_ID;
    const apiToken = process.env.GREEN_API_TOKEN;

    if (!instanceId || !apiToken) {
        throw new Error('GREEN_API_INSTANCE_ID or GREEN_API_TOKEN missing in environment');
    }

    // 1. Fetch client's phone number and check Opt-out
    const { data: client, error: clientErr } = await supabase
        .from('clients')
        .select('phone, is_subscribed_wa, name')
        .eq('id', task.client_id)
        .single();

    if (clientErr || !client?.phone || !client.is_subscribed_wa) {
        throw new Error('Client unsubscribed or missing WhatsApp phone');
    }

    // Format phone to WhatsApp format (e.g. 79991234567@c.us)
    // Strip everything except numbers
    let digits = client.phone.replace(/\D/g, '');
    if (!digits) throw new Error(`Invalid phone format: ${client.phone}`);

    // Quick validation format for Russian/Georgian numbers mostly, but keep it generic
    // Ensure we don't start with '+' in the digits string
    const whatsappId = `${digits}@c.us`;

    // 2. Fetch template
    const { data: template } = await supabase
        .from('notification_templates')
        .select('message_text')
        .eq('type', task.template_type)
        .single();

    if (!template) throw new Error(`Template not found for type: ${task.template_type}`);
    let messageText = template.message_text;

    // 3. Parse variables
    messageText = messageText.replace(/{{client_name}}/g, client.name || 'Гость');
    messageText = messageText.replace(/{{salon_name}}/g, 'SayYes');

    if (task.appointment_id) {
        const { data: appt } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', task.appointment_id)
            .single();

        if (appt) {
            let masterName = 'вашего мастера';
            if (appt.master_id) {
                const { data: master } = await supabase.from('profiles').select('full_name').eq('dikidi_master_id', appt.master_id).single();
                if (master?.full_name) masterName = master.full_name;
            }

            const timeStr = new Date(appt.start_time).toLocaleTimeString('ru-RU', { timeZone: 'Asia/Tbilisi', hour: '2-digit', minute: '2-digit' });

            messageText = messageText
                .replace(/{{time}}/g, timeStr)
                .replace(/{{service}}/g, appt.service_name || 'услугу')
                .replace(/{{master_name}}/g, masterName);
        }
    }

    // 4. Adapt Buttons to Text Links
    // WhatsApp doesn't support inline keyboards like TG. We append text instructions/links.
    if (task.template_type === 'reminder_24h') {
        messageText += '\n\n✅ Для подтверждения ответьте "Да"\n❌ Для отмены: свяжитесь с нами https://t.me/evgenii_sayyes';
    } else if (task.template_type === 'feedback_request') {
        const reviewUrl = 'https://taplink.cc/sayyes_ge'; // Fallback or fetch from settings
        messageText += `\n\nОставьте свой отзыв по ссылке:\n${reviewUrl}`;
    } else if (task.template_type === 'lost_client') {
        messageText += `\n\n📅 Записаться онлайн:\nhttps://dikidi.net/ru`;
    }

    // 5. Send payload to Green API
    const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`;
    const payload = {
        chatId: whatsappId,
        message: messageText
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Green API Error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    if (!data.idMessage) {
        throw new Error(`Green API failed to return idMessage: ${JSON.stringify(data)}`);
    }

    return true;
}


// ==========================================
// БЛОК 3: WEBHOOKS (ОБРАТНАЯ СВЯЗЬ И КОМАНДЫ ОТ КЛИЕНТОВ)
// ==========================================

app.post('/webhook/telegram', async (req, res) => {
    const body = req.body;

    // 1. Обработка входящих текстовых сообщений (команда /start)
    if (body.message && body.message.text) {
        const chatId = body.message.chat.id;
        const text = body.message.text;

        if (text === '/start') {
            try {
                await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: "Добро пожаловать в SayYes! 🖤\n\nЭтот бот — ваш личный ассистент.\nЗдесь вы можете:\n☕️ Заказать напитки к визиту\n🎁 Копить бонусы и скидки\n📅 Управлять своими записями\n\nОткройте личный кабинет, чтобы увидеть свои визиты:",
                        reply_markup: {
                            inline_keyboard: [
                                [{
                                    text: "📱 Личный кабинет",
                                    web_app: {
                                        url: "https://sayyes-1028200460308.europe-west1.run.app"
                                    }
                                }],
                                [{
                                    text: "📅 Записаться онлайн",
                                    url: "https://dikidi.net/ru" // Заглушка, Владелец потом вставит свою ссылку
                                }]
                            ]
                        }
                    })
                });
            } catch (err) {
                console.error("Ошибка при отправке приветствия:", err);
            }
        } else {
            // Это обычный текст (не команда). Проверяем, не жалоба ли это?
            try {
                // Ищем клиента по Telegram ID
                const { data: client } = await supabase
                    .from('clients')
                    .select('id')
                    .eq('telegram_id', chatId)
                    .single();

                if (client) {
                    // Ищем недавний негативный отзыв этого клиента (за последние 24 часа), у которого еще нет комментария
                    const { data: recentReview } = await supabase
                        .from('reviews')
                        .select('id')
                        .eq('client_id', client.id)
                        .lt('score', 5)
                        .is('comment', null)
                        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    if (recentReview) {
                        // Обновляем отзыв, добавляя текст жалобы
                        await supabase
                            .from('reviews')
                            .update({ comment: text })
                            .eq('id', recentReview.id);

                        // Подтверждаем получение клиенту
                        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: chatId,
                                text: "Спасибо. Ваше сообщение передано руководителю салона. Мы скоро с вами свяжемся для решения ситуации."
                            })
                        });
                    }
                }
            } catch (err) {
                console.error("Ошибка при обработке текстовой жалобы:", err);
            }
        }
    }

    // 2. Обработка получения контакта (Склейка профилей)
    if (body.message && body.message.contact) {
        const chatId = body.message.chat.id;
        const contact = body.message.contact;

        // Защита: убеждаемся, что контакт принадлежит тому, кто его отправил
        if (contact.user_id !== chatId) {
            return res.status(200).send('OK');
        }

        // Нормализуем телефон: только цифры, начинаем с +
        let phoneStr = contact.phone_number.replace(/\D/g, '');
        if (!phoneStr.startsWith('+')) {
            phoneStr = '+' + phoneStr;
        }

        try {
            // Вызываем нашу SQL-функцию склейки профилей
            const { data: targetId, error: mergeError } = await supabase
                .rpc('merge_client_profiles', {
                    p_telegram_id: chatId,
                    p_phone: phoneStr
                });

            if (mergeError) throw mergeError;

            console.log(`[MERGE] Успешно склеен профиль. Текущий ID: ${targetId}`);

            // Отправляем подтверждение клиенту
            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: "✅ Отлично! Ваш номер подтвержден, история визитов и бонусы синхронизированы.\nПожалуйста, вернитесь в приложение и обновите страницу."
                })
            });

        } catch (err) {
            console.error("[MERGE] Ошибка при склейке контактов:", err);

            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: "⚠️ Произошла ошибка при синхронизации профиля. Пожалуйста, обратитесь к администратору."
                })
            });
        }
    }

    // 3. Обработка нажатий на inline-кнопки (наше подтверждение визитов)
    if (body.callback_query) {
        const callbackQuery = body.callback_query;
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
                console.error("Ошибка обработки вебхука подтверждения:", err);
            }
        }

        // Обработка NPS-оценок (Запрос отзыва)
        if (data.startsWith('nps_')) {
            // Формат: nps_SCORE_appointmentId
            const parts = data.split('_');
            const score = parseInt(parts[1]);
            const appointmentId = parts[2];

            try {
                // 1. Получаем данные о визите для привязки отзыва
                const { data: appt } = await supabase
                    .from('appointments')
                    .select('tenant_id, client_id')
                    .eq('id', appointmentId)
                    .single();

                if (appt) {
                    // 2. Сохраняем оценку в таблицу reviews
                    const { error: reviewError } = await supabase
                        .from('reviews')
                        .insert({
                            appointment_id: appointmentId,
                            tenant_id: appt.tenant_id,
                            client_id: appt.client_id,
                            score: score
                        });

                    if (reviewError) {
                        console.error("[NPS] Ошибка записи отзыва в БД:", reviewError);
                    } else {
                        console.log(`[NPS] Отзыв сохранен. Визит: ${appointmentId}, Оценка: ${score}`);
                    }
                }

                let replyText = "";
                let replyMarkup = undefined;

                if (score === 5) {
                    replyText = "Спасибо за высокую оценку! ❤️\nПомогите нам стать лучше — оставьте отзыв на удобной площадке:";

                    // Достаем настройки ссылок салона
                    const { data: settings } = await supabase
                        .from('salon_settings')
                        .select('review_links')
                        .eq('owner_profile_id', (await supabase.from('profiles').select('id').eq('tenant_id', appt.tenant_id).eq('role', 'owner').single()).data?.id)
                        .single();

                    const buttons = [];

                    if (settings && settings.review_links) {
                        const links = settings.review_links;
                        for (const key in links) {
                            if (links[key].enabled && links[key].url) {
                                buttons.push([{ text: links[key].label, url: links[key].url }]);
                            }
                        }
                    }

                    // Если владелец ничего не настроил, даем фолбэк-кнопку
                    if (buttons.length === 0) {
                        replyText = "Спасибо за высокую оценку! ❤️ Мы очень ценим ваше доверие.";
                        replyMarkup = undefined;
                    } else {
                        replyMarkup = { inline_keyboard: buttons };
                    }
                } else {
                    replyText = "Спасибо за честность. Нам очень жаль, что визит не был идеальным.\nПожалуйста, напишите ответным сообщением, что пошло не так — это сообщение прочитает лично руководитель салона.";
                    // Здесь в будущем можно сделать запись оценки в базу данных
                }

                // Обновляем сообщение, убирая звездочки, чтобы не кликали дважды
                await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        message_id: messageId,
                        text: replyText,
                        reply_markup: replyMarkup
                    })
                });

            } catch (err) {
                console.error("Ошибка обработки NPS:", err);
            }
        }
    }

    res.status(200).send('OK');
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Worker listening on port ${port}`);
});
