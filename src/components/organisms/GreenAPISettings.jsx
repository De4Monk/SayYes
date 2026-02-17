import React, { useState } from 'react';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { Button } from '../atoms/Button';
import { MessageCircle, Save } from 'lucide-react';

export const GreenAPISettings = () => {
    const [instanceId, setInstanceId] = useState('');
    const [apiToken, setApiToken] = useState('');

    const handleSave = () => {
        console.log('Saving Green API settings:', { instanceId, apiToken });
        // TODO: Save to RxDB/Supabase
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
