import React from 'react';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';

export const LivePLDashboard = () => {
    // Mock Data
    const revenue = 42890;
    const overhead = 12400;
    const netProfit = revenue - overhead;
    const margin = (netProfit / revenue) * 100;

    return (
        <Card className="bg-zinc-900 text-white border-zinc-800">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <Text variant="caption" className="text-zinc-400 mb-1">Net Monthly Profit</Text>
                    <div className="text-4xl font-display font-black tracking-tight">${netProfit.toLocaleString()}</div>
                </div>
                <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold">
                    {margin.toFixed(1)}% Margin
                </div>
            </div>

            <div className="space-y-4">
                {/* Revenue Bar */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Total Revenue</span>
                        <span className="font-bold text-white">${revenue.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-success w-full" />
                    </div>
                </div>

                {/* Overhead Bar */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Overhead & Costs</span>
                        <span className="font-bold text-white">${overhead.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-error" style={{ width: `${(overhead / revenue) * 100}%` }} />
                    </div>
                </div>
            </div>
        </Card>
    );
};
