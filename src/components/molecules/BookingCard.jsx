import React from 'react';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { Button } from '../atoms/Button';
import { Calendar } from 'lucide-react';
import { useTelegram } from '../../hooks/useTelegram';

export const BookingCard = () => {
    const { tg } = useTelegram();

    const handleBooking = () => {
        const dikidiUrl = 'https://dikidi.net/887914';
        if (tg && tg.openLink) {
            tg.openLink(dikidiUrl);
        } else {
            window.open(dikidiUrl, '_blank');
        }
    };

    return (
        <Card className="bg-white border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-primary" />

            <div className="pl-3 py-1 flex items-start gap-4">
                <div className="p-3 bg-blue-50/50 rounded-full text-primary mt-1">
                    <Calendar size={28} />
                </div>

                <div className="flex-1">
                    <Heading level={3} className="text-slate-900 mb-1">
                        Онлайн-запись
                    </Heading>
                    <Text className="text-slate-500 text-sm mb-4 leading-snug">
                        Выберите удобное время и мастера для вашего следующего визита
                    </Text>

                    <Button
                        variant="primary"
                        fullWidth
                        onClick={handleBooking}
                    >
                        Записаться
                    </Button>
                </div>
            </div>
        </Card>
    );
};
