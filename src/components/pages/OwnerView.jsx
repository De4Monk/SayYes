import React, { useEffect, useState } from 'react';
import { Heading, Text } from '../atoms/Typography';
import { LivePLDashboard } from '../organisms/LivePLDashboard';
import { TrustCoefManager } from '../organisms/TrustCoefManager';
import { StatCard } from '../molecules/StatCard';
import { supabase } from '../../lib/supabase';
import { getCurrentMonthBounds } from '../../lib/dateUtils';

export const OwnerView = () => {
    const [newClients, setNewClients] = useState(null); // null = loading
    const [returnRate, setReturnRate] = useState(null);

    useEffect(() => {
        fetchOwnerStats();
    }, []);

    const fetchOwnerStats = async () => {
        try {
            const { startOfMonth, endOfMonth } = getCurrentMonthBounds();

            // 1. New clients this month
            const { count: newCount, error: newErr } = await supabase
                .from('clients')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', startOfMonth)
                .lte('created_at', endOfMonth);

            if (newErr) throw newErr;
            setNewClients(newCount || 0);

            // 2. Return rate (clients with 2+ appointments this month / total unique clients this month)
            const { data: monthAppts, error: apptErr } = await supabase
                .from('appointments')
                .select('client_id')
                .gte('start_time', startOfMonth)
                .lte('start_time', endOfMonth)
                .not('client_id', 'is', null);

            if (apptErr) throw apptErr;

            if (monthAppts && monthAppts.length > 0) {
                // Count visits per client
                const visitCounts = {};
                monthAppts.forEach(a => {
                    visitCounts[a.client_id] = (visitCounts[a.client_id] || 0) + 1;
                });

                const totalUniqueClients = Object.keys(visitCounts).length;
                const returningClients = Object.values(visitCounts).filter(count => count >= 2).length;

                const rate = totalUniqueClients > 0
                    ? Math.round((returningClients / totalUniqueClients) * 100)
                    : 0;
                setReturnRate(rate);
            } else {
                setReturnRate(0);
            }
        } catch (err) {
            console.error('Ошибка загрузки метрик владельца:', err);
            setNewClients(0);
            setReturnRate(0);
        }
    };

    return (
        <div className="space-y-6 pb-safe">
            <div className="mb-2">
                <Heading level={1}>Пульс бизнеса</Heading>
                <Text>Метрики в реальном времени</Text>
            </div>

            <LivePLDashboard />

            <div className="grid grid-cols-2 gap-3">
                <StatCard
                    title="Новые клиенты"
                    value={newClients !== null ? String(newClients) : '...'}
                    trend={newClients !== null && newClients > 0 ? 'up' : 'neutral'}
                    trendValue="за месяц"
                />
                <StatCard
                    title="Возвратность"
                    value={returnRate !== null ? `${returnRate}%` : '...'}
                    trend={returnRate !== null && returnRate >= 50 ? 'up' : 'down'}
                    trendValue="за месяц"
                />
            </div>

            <TrustCoefManager />

            {/* Additional spacing for bottom nav */}
            <div className="h-4" />
        </div>
    );
};
