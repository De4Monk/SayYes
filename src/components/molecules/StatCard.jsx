import React from 'react';
import { Card } from '../atoms/Card';
import { Text } from '../atoms/Typography';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({ title, value, trend, trendValue, isPositive = true }) => {
    return (
        <Card className="flex flex-col gap-1">
            <Text variant="caption">{title}</Text>
            <div className="flex justify-between items-end">
                <div className="text-2xl font-display font-black tracking-tight">{value}</div>
                {trend && (
                    <div className={cn("flex items-center text-xs font-bold px-2 py-1 rounded-full", isPositive ? "bg-success/10 text-success" : "bg-error/10 text-error")}>
                        {isPositive ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                        {trendValue}
                    </div>
                )}
            </div>
        </Card>
    );
};
