import React from 'react';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from '../atoms/Button';

export const BookingCard = ({ clientName, serviceName, time, status, onClick }) => {
    // Format time if it's a date string
    const displayTime = time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Время не задано';

    return (
        <Card
            className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden cursor-pointer active:scale-95 duration-150"
            onClick={onClick}
        >
            <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${status === 'paid' ? 'bg-green-500' : 'bg-primary'}`} />

            <div className="pl-3">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mb-2 ${status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-primary'
                            }`}>
                            {status === 'paid' ? 'Оплачено' : (status === 'cancelled' ? 'Отменено' : 'Запланировано')}
                        </div>
                        <Heading level={3} className="text-slate-900">{clientName || 'Неизвестный клиент'}</Heading>
                        <Text className="text-slate-500 text-sm">{serviceName || 'Услуга'}</Text>
                    </div>
                </div>

                <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={16} className="text-slate-400" />
                        <span className="text-sm font-medium">{displayTime}</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="primary" className="w-full bg-primary hover:bg-primary-dark text-white shadow-none text-sm h-10" onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                    }}>
                        Посмотреть / Чек-ин
                    </Button>
                </div>
            </div>
        </Card>
    );
};
