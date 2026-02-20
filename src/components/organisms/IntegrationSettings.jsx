import React, { useState, useEffect } from 'react';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { Button } from '../atoms/Button';
import { Settings, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useRole } from '../../contexts/RoleContext';

export const IntegrationSettings = () => {
    const { currentUser } = useRole();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // State
    const [botToken, setBotToken] = useState('');
    const [instanceId, setInstanceId] = useState('');
    const [apiToken, setApiToken] = useState('');

    useEffect(() => {
        const loadSettings = async () => {
            if (!currentUser?.id) return;
            try {
                const { data, error } = await supabase
                    .from('salon_integrations')
                    .select('*')
                    .eq('owner_profile_id', currentUser.id)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found", which is fine for first time
                    console.error('Ошибка загрузки настроек:', error);
                } else if (data) {
                    setBotToken(data.telegram_bot_token || '');
                    setInstanceId(data.green_api_id_instance || '');
                    setApiToken(data.green_api_token || '');
                }
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, [currentUser?.id]);

    const handleSave = async () => {
        if (!currentUser?.id) {
            alert("Ошибка: Пользователь не авторизован");
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('salon_integrations')
                .upsert({
                    owner_profile_id: currentUser.id,
                    telegram_bot_token: botToken,
                    green_api_id_instance: instanceId,
                    green_api_token: apiToken,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'owner_profile_id' });

            if (error) {
                console.error('Ошибка сохранения интеграции:', error);
                alert("Ошибка сохранения: " + error.message);
            } else {
                alert("Настройки успешно сохранены");
            }
        } catch (err) {
            alert("Внутренняя ошибка");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <Card className="flex flex-col gap-4 animate-pulse">
                <div className="h-8 bg-zinc-200 rounded-lg w-1/2 mb-4"></div>
                <div className="h-14 bg-zinc-100 rounded-xl w-full"></div>
                <div className="h-14 bg-zinc-100 rounded-xl w-full"></div>
                <div className="h-14 bg-zinc-100 rounded-xl w-full"></div>
                <div className="h-12 bg-zinc-200 rounded-xl w-full mt-2"></div>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Settings size={20} />
                </div>
                <div>
                    <Heading level={3}>Интеграции</Heading>
                    <Text className="text-zinc-500 text-sm">Подключение мессенджеров</Text>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Telegram Bot Token</label>
                    <input
                        type="password"
                        value={botToken}
                        onChange={(e) => setBotToken(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-mono text-sm focus:border-primary focus:bg-white outline-none transition-colors"
                        placeholder="123456789:ABCdef"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Green-API Instance ID</label>
                    <input
                        type="text"
                        value={instanceId}
                        onChange={(e) => setInstanceId(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-mono text-sm focus:border-primary focus:bg-white outline-none transition-colors"
                        placeholder="1101000001"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Green-API Token</label>
                    <input
                        type="password"
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-mono text-sm focus:border-primary focus:bg-white outline-none transition-colors"
                        placeholder="••••••••••••••••"
                    />
                </div>

                <Button
                    onClick={handleSave}
                    icon={Save}
                    className="mt-4 w-full justify-center"
                    disabled={isSaving}
                >
                    {isSaving ? "Сохранение..." : "Сохранить настройки"}
                </Button>
            </div>
        </Card>
    );
};
