import React from 'react';
import { useRole } from '../../contexts/RoleContext';
import { useTelegram } from '../../hooks/useTelegram';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { Button } from '../atoms/Button';
import { Smartphone } from 'lucide-react';

export const PhoneSyncWidget = () => {
    const { currentUser } = useRole();
    const { tg } = useTelegram();

    // Если телефон уже есть, ничего не рендерим
    if (currentUser?.phone) {
        return null;
    }

    const handleShareContact = () => {
        if (tg && tg.requestContact) {
            tg.requestContact((shared) => {
                if (shared) {
                    alert('Контакт отправлен! Обновите страницу через пару секунд.');
                }
            });
        } else {
            // Фолбэк для разработки в браузере
            alert('Запрос контакта доступен только внутри Telegram.');
        }
    };

    return (
        <Card className="bg-blue-50/50 border-blue-100">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-full text-tg-blue">
                    <Smartphone size={24} />
                </div>
                <div className="flex-1">
                    <Heading level={3} className="text-tg-blue mb-1">
                        Синхронизация профиля
                    </Heading>
                    <Text variant="secondary" className="mb-4 text-sm">
                        Поделитесь номером телефона, чтобы мы могли подтянуть вашу историю визитов, скидки и бонусы из системы салона.
                    </Text>
                    <Button
                        variant="primary"
                        fullWidth
                        onClick={handleShareContact}
                    >
                        Поделиться номером
                    </Button>
                </div>
            </div>
        </Card>
    );
};
