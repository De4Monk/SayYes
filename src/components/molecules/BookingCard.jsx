import React from 'react';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from '../atoms/Button';

export const BookingCard = ({ clientName, serviceName, time, status, onClick }) => {
    // Format time if it's a date string
    const displayTime = time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD';

    return (
        <Card
            className="bg-zinc-900 text-white border-none shadow-2xl shadow-primary/10 relative overflow-hidden cursor-pointer active:scale-95 transition-transform"
            onClick={onClick}
        >
            {/* Abstract Background Decoration */}
            <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl ${status === 'paid' ? 'bg-green-500/20' : 'bg-primary/20'}`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-primary/20 text-primary'
                            }`}>
                            {status || 'Scheduled'}
                        </div>
                        <Heading level={3} className="text-white">{clientName || 'Unknown Client'}</Heading>
                        <Text className="text-zinc-400 text-sm">{serviceName || 'Service'}</Text>
                    </div>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Clock size={18} className="text-zinc-400" />
                        <span>{displayTime}</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="primary" className="bg-white text-primary w-full" onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                    }}>
                        Select Client
                    </Button>
                </div>
            </div>
        </Card>
    );
};
