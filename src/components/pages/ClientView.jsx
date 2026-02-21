import React from 'react';
import { Heading, Text } from '../atoms/Typography';
import { DigitalMenuGrid } from '../organisms/DigitalMenuGrid';
import { ClientProfile } from '../organisms/ClientProfile';
import { BookingCard } from '../molecules/BookingCard';
import { ClientNotificationSettings } from '../organisms/ClientNotificationSettings';
import { PhoneSyncWidget } from '../organisms/PhoneSyncWidget';

export const ClientView = () => {
    return (
        <div className="space-y-8 pb-safe">
            <div className="mb-2">
                <Heading level={1}>Мой профиль</Heading>
                <Text>С возвращением, Джейн</Text>
            </div>

            <PhoneSyncWidget />

            <BookingCard />

            <DigitalMenuGrid />

            <ClientProfile />

            <ClientNotificationSettings />

            {/* Additional spacing for bottom nav */}
            <div className="h-4" />
        </div>
    );
};
