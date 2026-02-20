import React from 'react';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Heading, Text } from '../atoms/Typography';
import { Check, X } from 'lucide-react';

export const VerificationQueue = () => {
    // Mock data - replace with RxDB queries
    const pendingFormulas = [
        { id: 1, master: 'Sarah A.', client: 'Jessica M.', formula: '60g 5N + 20g 6G', cost: 12.50 },
        { id: 2, master: 'Mike T.', client: 'David B.', formula: '40g 8A + 10g Blue', cost: 18.20 },
    ];

    const handleApprove = (id) => {
        console.log('Approved:', id);
    };

    const handleReject = (id) => {
        console.log('Rejected:', id);
    };

    return (
        <div className="space-y-4">
            <Heading level={2}>Очередь проверок</Heading>
            {pendingFormulas.length === 0 ? (
                <Card className="p-8 text-center text-zinc-400">
                    <Text>Все отлично! Нет формул ожидающих проверки.</Text>
                </Card>
            ) : (
                <div className="flex flex-col gap-3">
                    {pendingFormulas.map((item) => (
                        <Card key={item.id} className="flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-zinc-800">{item.master}</div>
                                    <Text variant="caption">Клиент: {item.client}</Text>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-primary">${item.cost.toFixed(2)}</div>
                                    <Text variant="caption">Примерная стоимость</Text>
                                </div>
                            </div>

                            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                                <Text variant="label" className="text-zinc-500 mb-1">Формула:</Text>
                                <div className="font-mono text-sm font-bold text-zinc-800">{item.formula}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-1">
                                <Button
                                    variant="danger"
                                    icon={X}
                                    className="bg-error/10 text-error shadow-none hover:bg-error/20"
                                    onClick={() => handleReject(item.id)}
                                >
                                    Отклонить
                                </Button>
                                <Button
                                    variant="primary"
                                    icon={Check}
                                    className="bg-success text-white shadow-success/20 hover:bg-success/90"
                                    onClick={() => handleApprove(item.id)}
                                >
                                    Одобрить
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
