import React, { useState, useEffect } from 'react';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { Bell, BellOff, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useRole } from '../../contexts/RoleContext';

export const ClientNotificationSettings = () => {
    const { currentUser } = useRole();
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState({
        is_subscribed_tg: true,
        is_subscribed_wa: true
    });
    const [isUpdating, setIsUpdating] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!currentUser?.telegram_id) {
                setIsLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('clients')
                    .select('is_subscribed_tg, is_subscribed_wa')
                    .eq('telegram_id', currentUser.telegram_id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Ошибка загрузки настроек уведомлений:', error);
                } else if (data) {
                    setSettings({
                        is_subscribed_tg: data.is_subscribed_tg ?? true,
                        is_subscribed_wa: data.is_subscribed_wa ?? true
                    });
                }
            } catch (err) {
                console.error("Поймана ошибка:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, [currentUser?.telegram_id]);

    const toggleSubscription = async (channel, currentValue) => {
        if (!currentUser?.telegram_id) return;
        setIsUpdating(channel);

        try {
            const newValue = !currentValue;
            const updateData = channel === 'tg'
                ? { is_subscribed_tg: newValue }
                : { is_subscribed_wa: newValue };

            const { error } = await supabase
                .from('clients')
                .update(updateData)
                .eq('telegram_id', currentUser.telegram_id);

            if (error) throw error;

            setSettings(prev => ({
                ...prev,
                [`is_subscribed_${channel}`]: newValue
            }));
        } catch (err) {
            console.error(`Ошибка обновления подписки ${channel}:`, err);
            alert('Не удалось обновить настройки. Пожалуйста, попробуйте позже.');
        } finally {
            setIsUpdating(null);
        }
    };

    if (isLoading) {
        return (
            <Card className="flex flex-col gap-4 animate-pulse">
                <div className="h-6 bg-zinc-200 rounded w-1/3 mb-2"></div>
                <div className="h-16 bg-zinc-100 rounded-xl w-full"></div>
                <div className="h-16 bg-zinc-100 rounded-xl w-full"></div>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <Bell size={20} />
                </div>
                <div>
                    <Heading level={3}>Уведомления</Heading>
                    <Text className="text-zinc-500 text-sm">Управление рассылками</Text>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl transition-colors hover:border-zinc-200">
                    <div className="flex items-center gap-3">
                        <MessageCircle size={20} className="text-[#0088cc]" />
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm text-zinc-800">
                                Telegram
                            </span>
                            <span className="text-xs text-zinc-500 mt-1">
                                Напоминания и акции в Telegram
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => toggleSubscription('tg', settings.is_subscribed_tg)}
                        disabled={isUpdating === 'tg'}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${settings.is_subscribed_tg ? 'bg-primary' : 'bg-zinc-200'
                            } ${isUpdating === 'tg' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.is_subscribed_tg ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl transition-colors hover:border-zinc-200">
                    <div className="flex items-center gap-3">
                        <MessageCircle size={20} className="text-[#25D366]" />
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm text-zinc-800">
                                WhatsApp
                            </span>
                            <span className="text-xs text-zinc-500 mt-1">
                                Напоминания и акции в WhatsApp
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => toggleSubscription('wa', settings.is_subscribed_wa)}
                        disabled={isUpdating === 'wa'}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${settings.is_subscribed_wa ? 'bg-[#25D366]' : 'bg-zinc-200'
                            } ${isUpdating === 'wa' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.is_subscribed_wa ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {(!settings.is_subscribed_tg && !settings.is_subscribed_wa) && (
                <div className="mt-2 flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600">
                    <BellOff size={16} className="mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-medium leading-tight">
                        Внимание: Отключение всех уведомлений может привести к пропуску важных напоминаний о записи.
                    </span>
                </div>
            )}
        </Card>
    );
};
