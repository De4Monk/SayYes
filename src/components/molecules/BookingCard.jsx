import React from 'react';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from '../atoms/Button';

export const BookingCard = () => {
    return (
        <Card className="bg-zinc-900 text-white border-none shadow-2xl shadow-primary/10 relative overflow-hidden">
            {/* Abstract Background Decoration */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="inline-block px-3 py-1 bg-primary/20 rounded-full text-primary text-[10px] font-bold uppercase tracking-wider mb-2">
                            Confirmed
                        </div>
                        <Heading level={3} className="text-white">Upcoming Session</Heading>
                    </div>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-zinc-400" />
                        <span className="font-bold">Tomorrow, Oct 24</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Clock size={18} className="text-zinc-400" />
                        <span>10:30 AM (2.5 hrs)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <MapPin size={18} className="text-zinc-400" />
                        <span>Executive Suite B</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="secondary" className="bg-white/10 text-white border-white/5 hover:bg-white/20">
                        Reschedule
                    </Button>
                    <Button variant="primary" className="bg-white text-primary">
                        Check In
                    </Button>
                </div>
            </div>
        </Card>
    );
};
