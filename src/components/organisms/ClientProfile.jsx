import React from 'react';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { Star, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

export const ClientProfile = () => {
    // Mock Data
    const loyaltyPoints = 850;
    const nextTier = 1000;
    const history = [
        { id: 1, date: 'Oct 12', service: 'Balayage & Cut', master: 'Sarah A.' },
        { id: 2, date: 'Aug 24', service: 'Root Touch Up', master: 'Jessica L.' },
    ];

    const progress = (loyaltyPoints / nextTier) * 100;

    return (
        <Card className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-display font-bold text-xl shadow-lg shadow-primary/30">
                    JD
                </div>
                <div>
                    <Heading level={2}>Jane Doe</Heading>
                    <Text>Platinum Member</Text>
                </div>
            </div>

            {/* Loyalty Progress */}
            <div>
                <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-1 text-primary font-bold">
                        <Star size={16} fill="currentColor" />
                        <span>{loyaltyPoints} pts</span>
                    </div>
                    <Text variant="caption">{nextTier - loyaltyPoints} to Black Tier</Text>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* History - Privacy First (No formulas) */}
            <div className="space-y-3 pt-2">
                <Text variant="caption" className="ml-1">Recent Visits</Text>
                {history.map((visit) => (
                    <div key={visit.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-zinc-400">
                                <Clock size={16} />
                            </div>
                            <div>
                                <div className="font-bold text-sm text-zinc-800">{visit.service}</div>
                                <Text variant="caption">{visit.master}</Text>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold text-zinc-500">{visit.date}</div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};
