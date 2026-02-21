import React, { useEffect, useState } from 'react';
import { Card } from '../atoms/Card';
import { Text } from '../atoms/Typography';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

export const LiveEarningsWidget = ({ currentEarnings = 0, materialCost: initialCost = 0, allowance = 25.00 }) => {
    const [materialCost, setMaterialCost] = useState(initialCost);
    const isOverLimit = materialCost > allowance;

    // Sync with prop when it changes (e.g. on appointment switch)
    useEffect(() => {
        setMaterialCost(initialCost);
    }, [initialCost]);

    useEffect(() => {
        // Subscribe to usage_logs inserts for real-time updates
        const channel = supabase
            .channel('usage-tracking')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'usage_logs' },
                (payload) => {
                    console.log('Новый расход зафиксирован:', payload);
                    // Standard cost per gram: 0.50 ₾/g
                    const cost = payload.new.grams_used * 0.50;
                    setMaterialCost(prev => prev + cost);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className={cn(
            "sticky top-0 z-40 mb-6 transition-colors duration-300 rounded-3xl overflow-hidden shadow-xl",
            isOverLimit ? "bg-error text-white" : "bg-primary text-white"
        )}>
            <div className="p-5 flex justify-between items-center">
                <div>
                    <Text className={cn("text-white/80 font-bold uppercase tracking-widest text-[10px] mb-1", isOverLimit && "text-white/90")}>
                        Заработок за сессию
                    </Text>
                    <div className="text-3xl font-display font-black tracking-tight flex items-baseline gap-1">
                        {currentEarnings.toFixed(0)} ₾
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <div className={cn(
                        "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full mb-1",
                        isOverLimit ? "bg-white/20 text-white" : "bg-white/20 text-white"
                    )}>
                        {isOverLimit ? <AlertTriangle size={12} /> : <TrendingUp size={12} />}
                        <span>{isOverLimit ? 'Превышен лимит' : 'В норме'}</span>
                    </div>
                    <Text className="text-white/70 text-[10px]">
                        Расход: {materialCost.toFixed(0)} ₾ / {allowance.toFixed(0)} ₾
                    </Text>
                </div>
            </div>

            {/* ProgressBar */}
            <div className="bg-black/20 h-1 w-full">
                <div
                    className={cn("h-full transition-all duration-500", isOverLimit ? "bg-white" : "bg-success")}
                    style={{ width: `${Math.min((materialCost / allowance) * 100, 100)}%` }}
                />
            </div>
        </div>
    );
};
