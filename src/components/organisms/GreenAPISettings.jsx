import React, { useState } from 'react';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { Button } from '../atoms/Button';
import { MessageCircle, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useRole } from '../../contexts/RoleContext';

export const GreenAPISettings = () => {
    const { currentUser } = useRole();
    const [instanceId, setInstanceId] = useState('');
    const [apiToken, setApiToken] = useState('');

    const handleSave = async () => {
        if (!currentUser?.id) {
            console.error("No user id available to save settings.");
            return;
        }

        const { data, error } = await supabase
            .from('salon_integrations')
            .upsert({
                owner_profile_id: currentUser.id,
                green_api_id_instance: instanceId,
                green_api_token: apiToken,
                updated_at: new Date().toISOString()
            }, { onConflict: 'owner_profile_id' });

        if (error) {
            console.error('Ошибка сохранения интеграции:', error);
            alert("Ошибка сохранения: " + error.message);
        } else {
            alert("Настройки Green-API успешно сохранены");
        }
    };

    return (
        <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-success/10 rounded-lg text-success">
                    <MessageCircle size={20} />
                </div>
                <div>
                    <Heading level={3}>Green-API Integration</Heading>
                    <Text>WhatsApp notifications configuration</Text>
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Instance ID</label>
                    <input
                        type="text"
                        value={instanceId}
                        onChange={(e) => setInstanceId(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-mono text-sm focus:border-primary outline-none transition-colors"
                        placeholder="1101000001"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">API Token</label>
                    <input
                        type="password"
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-mono text-sm focus:border-primary outline-none transition-colors"
                        placeholder="••••••••••••••••"
                    />
                </div>

                <Button onClick={handleSave} icon={Save} className="mt-2">
                    Save Configuration
                </Button>
            </div>
        </Card>
    );
};
