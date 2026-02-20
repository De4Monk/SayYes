import React from 'react';
import { Heading, Text } from '../atoms/Typography';
import { LivePLDashboard } from '../organisms/LivePLDashboard';
import { TrustCoefManager } from '../organisms/TrustCoefManager';
import { StatCard } from '../molecules/StatCard';

export const OwnerView = () => {
    return (
        <div className="space-y-6 pb-safe">
            <div className="mb-2">
                <Heading level={1}>Пульс бизнеса</Heading>
                <Text>Метрики в реальном времени</Text>
            </div>

            <LivePLDashboard />

            <div className="grid grid-cols-2 gap-3">
                <StatCard title="Новые клиенты" value="124" trend="up" trendValue="+12%" />
                <StatCard title="Возвратность" value="84%" trend="up" trendValue="+2%" />
            </div>

            <TrustCoefManager />

            {/* Additional spacing for bottom nav */}
            <div className="h-4" />
        </div>
    );
};
