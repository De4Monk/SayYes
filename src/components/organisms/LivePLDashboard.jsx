import React, { useEffect, useState } from 'react';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { supabase } from '../../lib/supabase';
import { getCurrentMonthBounds } from '../../lib/dateUtils';

export const LivePLDashboard = () => {
    const [revenue, setRevenue] = useState(0);
    const [overhead, setOverhead] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMonthlyData();
    }, []);

    const fetchMonthlyData = async () => {
        try {
            const { startOfMonth, endOfMonth } = getCurrentMonthBounds();

            // Fetch monthly revenue from paid appointments
            const { data: revenueData, error: revError } = await supabase
                .from('appointments')
                .select('service_price')
                .eq('status', 'paid')
                .gte('start_time', startOfMonth)
                .lte('start_time', endOfMonth);

            if (revError) throw revError;

            const totalRevenue = (revenueData || []).reduce((sum, a) => sum + (a.service_price || 0), 0);
            setRevenue(totalRevenue);

            // Fetch monthly overhead from usage_logs (material costs)
            const { data: usageData, error: usageError } = await supabase
                .from('usage_logs')
                .select('grams_used')
                .gte('logged_at', startOfMonth)
                .lte('logged_at', endOfMonth);

            if (usageError) throw usageError;

            // Standard cost: 0.50 ₾/gram
            const totalOverhead = (usageData || []).reduce((sum, log) => sum + (log.grams_used * 0.50), 0);
            setOverhead(totalOverhead);

        } catch (err) {
            console.error('Ошибка загрузки P&L данных:', err);
        } finally {
            setLoading(false);
        }
    };

    const netProfit = revenue - overhead;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    if (loading) {
        return (
            <Card className="bg-zinc-900 text-white border-zinc-800 animate-pulse">
                <div className="h-8 bg-zinc-700 rounded w-1/3 mb-4"></div>
                <div className="h-12 bg-zinc-700 rounded w-1/2 mb-6"></div>
                <div className="space-y-4">
                    <div className="h-4 bg-zinc-800 rounded w-full"></div>
                    <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="bg-zinc-900 text-white border-zinc-800">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <Text variant="caption" className="text-zinc-400 mb-1">Чистая прибыль за месяц</Text>
                    <div className="text-4xl font-display font-black tracking-tight">{netProfit.toLocaleString('ru-RU')} ₾</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${margin >= 0 ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-400'}`}>
                    {margin.toFixed(1)}% маржа
                </div>
            </div>

            <div className="space-y-4">
                {/* Revenue Bar */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Выручка</span>
                        <span className="font-bold text-white">{revenue.toLocaleString('ru-RU')} ₾</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-success w-full" />
                    </div>
                </div>

                {/* Overhead Bar */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Расходы на материалы</span>
                        <span className="font-bold text-white">{overhead.toLocaleString('ru-RU')} ₾</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-error" style={{ width: `${revenue > 0 ? (overhead / revenue) * 100 : 0}%` }} />
                    </div>
                </div>
            </div>
        </Card>
    );
};
