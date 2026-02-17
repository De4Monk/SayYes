import React, { useEffect, useState } from 'react';
import { Card } from '../atoms/Card';
import { Text } from '../atoms/Typography';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

export const LiveEarningsWidget = ({ currentEarnings = 120.50, allowance = 20.00 }) => {
    const [materialCost, setMaterialCost] = useState(0);
    const isOverLimit = materialCost > allowance;

    useEffect(() => {
        // Subscribe to usage_logs inserts
        const channel = supabase
            .channel('usage-tracking')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'usage_logs' },
                (payload) => {
                    console.log('New usage logged:', payload);
                    // In a real app, we would sum up usage for the *current* appointment.
                    // For this demo, we'll just increment the cost logic simply.
                    // Assuming a standard cost per gram (e.g., $0.50/g)
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
                        Current Session Earnings
                    </Text>
                    <div className="text-3xl font-display font-black tracking-tight flex items-baseline gap-1">
                        ${currentEarnings.toFixed(2)}
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <div className={cn(
                        "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full mb-1",
                        isOverLimit ? "bg-white/20 text-white" : "bg-white/20 text-white"
                    )}>
                        {isOverLimit ? <AlertTriangle size={12} /> : <TrendingUp size={12} />}
                        <span>{isOverLimit ? 'Limit Exceeded' : 'On Track'}</span>
                    </div>
                    <Text className="text-white/70 text-[10px]">
                        Est. Cost: ${materialCost.toFixed(2)} / ${allowance.toFixed(2)}
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
