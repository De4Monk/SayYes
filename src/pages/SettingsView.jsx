import React from 'react';
import { Heading, Text } from '../components/atoms/Typography';
import { NotificationQueueWidget } from '../components/organisms/NotificationQueueWidget';
import { NotificationTemplatesWidget } from '../components/organisms/NotificationTemplatesWidget';
import { AdminPermissionsWidget } from '../components/organisms/AdminPermissionsWidget';
import { useRole } from '../contexts/RoleContext';

export const SettingsView = () => {
    const { currentRole } = useRole();

    return (
        <div className="flex flex-col gap-6 p-4 pb-24 max-w-lg mx-auto w-full">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <Heading level={1}>Уведомления</Heading>
                    <Text className="text-zinc-500 text-sm">Управление рассылками и правами</Text>
                </div>
            </div>

            {currentRole === 'owner' && <AdminPermissionsWidget />}
            {(currentRole === 'owner' || currentRole === 'admin') && <NotificationTemplatesWidget />}
            <NotificationQueueWidget />
        </div>
    );
};
