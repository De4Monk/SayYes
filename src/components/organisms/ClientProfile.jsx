import React, { useState, useEffect } from 'react';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { Star, Clock, Bell, BellOff, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useRole } from '../../contexts/RoleContext';

export const ClientProfile = ({ clientTelegramId }) => {
    const { currentRole } = useRole();
    const [settings, setSettings] = useState({
        is_subscribed_tg: true,
        is_subscribed_wa: true
    });
    const [isUpdating, setIsUpdating] = useState(null);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    // Mock Data
    const loyaltyPoints = 850;
    const nextTier = 1000;
    const history = [
        { id: 1, date: 'Oct 12', service: 'Balayage & Cut', master: 'Sarah A.' },
        { id: 2, date: 'Aug 24', service: 'Root Touch Up', master: 'Jessica L.' },
    ];

    const progress = (loyaltyPoints / nextTier) * 100;

    const isStaff = ['owner', 'admin', 'master'].includes(currentRole);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!clientTelegramId || !isStaff) {
                setIsLoadingSettings(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('clients')
                    .select('is_subscribed_tg, is_subscribed_wa')
                    .eq('telegram_id', clientTelegramId)
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
                console.error("Fetch settings error:", err);
            } finally {
                setIsLoadingSettings(false);
            }
        };

        fetchSettings();
    }, [clientTelegramId, isStaff]);

    const toggleSubscription = async (channel, currentValue) => {
        if (!clientTelegramId) return;
        setIsUpdating(channel);

        try {
            const newValue = !currentValue;
            const updateData = channel === 'tg'
                ? { is_subscribed_tg: newValue }
                : { is_subscribed_wa: newValue };

            const { error } = await supabase
                .from('clients')
                .update(updateData)
                .eq('telegram_id', clientTelegramId);

            if (error) throw error;

            setSettings(prev => ({
                ...prev,
                [`is_subscribed_${channel}`]: newValue
            }));
        } catch (err) {
            console.error(`Ошибка обновления подписки ${channel}:`, err);
            alert('Ошибка при обновлении подписки. Попробуйте позже.');
        } finally {
            setIsUpdating(null);
        }
    };

    return (
        <Card className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-display font-bold text-xl shadow-lg shadow-primary/30">
                    JD
                </div>
                <div>
                    <Heading level={2}>Jane Doe</Heading>
                    <Text>Platinum Member</Text>
                </div>
            </div>

            {/* Loyalty Progress */}
            <div>
                <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-1 text-primary font-bold">
                        <Star size={16} fill="currentColor" />
                        <span>{loyaltyPoints} pts</span>
                    </div>
                    <Text variant="caption">{nextTier - loyaltyPoints} to Black Tier</Text>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* History - Privacy First (No formulas) */}
            <div className="space-y-3 pt-2">
                <Text variant="caption" className="ml-1">Recent Visits</Text>
                {history.map((visit) => (
                    <div key={visit.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-zinc-400">
                                <Clock size={16} />
                            </div>
                            <div>
                                <div className="font-bold text-sm text-zinc-800">{visit.service}</div>
                                <Text variant="caption">{visit.master}</Text>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold text-zinc-500">{visit.date}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Notification Opt-Out Logic for Staff */}
            {isStaff && (
                <div className="pt-4 border-t border-zinc-100 space-y-3">
                    <Text variant="caption" className="ml-1 mb-2">Настройки уведомлений (Opt-Out)</Text>

                    {isLoadingSettings ? (
                        <div className="animate-pulse space-y-2">
                            <div className="h-12 bg-zinc-100 rounded-xl w-full"></div>
                            <div className="h-12 bg-zinc-100 rounded-xl w-full"></div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <MessageCircle size={18} className="text-[#0088cc]" />
                                    <span className="font-medium text-sm text-zinc-800">Telegram</span>
                                </div>

                                <button
                                    onClick={() => toggleSubscription('tg', settings.is_subscribed_tg)}
                                    disabled={isUpdating === 'tg'}
                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${settings.is_subscribed_tg ? 'bg-primary' : 'bg-zinc-200'
                                        } ${isUpdating === 'tg' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <span
                                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settings.is_subscribed_tg ? 'translate-x-5' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <MessageCircle size={18} className="text-[#25D366]" />
                                    <span className="font-medium text-sm text-zinc-800">WhatsApp</span>
                                </div>

                                <button
                                    onClick={() => toggleSubscription('wa', settings.is_subscribed_wa)}
                                    disabled={isUpdating === 'wa'}
                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${settings.is_subscribed_wa ? 'bg-[#25D366]' : 'bg-zinc-200'
                                        } ${isUpdating === 'wa' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <span
                                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settings.is_subscribed_wa ? 'translate-x-5' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </Card>
    );
};
