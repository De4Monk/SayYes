import React from 'react';
import { Heading, Text } from '../atoms/Typography';
import { DigitalMenuGrid } from '../organisms/DigitalMenuGrid';
import { ClientProfile } from '../organisms/ClientProfile';
import { BookingCard } from '../molecules/BookingCard';

export const ClientView = () => {
    return (
        <div className="space-y-8 pb-safe">
            <div className="mb-2">
                <Heading level={1}>My Experience</Heading>
                <Text>Welcome back, Jane</Text>
            </div>

            <BookingCard />

            <DigitalMenuGrid />

            <ClientProfile />

            {/* Additional spacing for bottom nav */}
            <div className="h-4" />
        </div>
    );
};
