import React from 'react';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { Coffee, Wine, GlassWater, ChevronRight } from 'lucide-react';
import { Button } from '../atoms/Button';

export const DigitalMenuGrid = () => {
    const menuItems = [
        { id: 1, name: 'Cappuccino', type: 'Hot Drink', price: 0, icon: Coffee }, // 0 price = complimentary
        { id: 2, name: 'Green Tea', type: 'Hot Drink', price: 0, icon: Coffee },
        { id: 3, name: 'Prosecco', type: 'Alcohol', price: 8, icon: Wine },
        { id: 4, name: 'Sparkling Water', type: 'Cold Drink', price: 0, icon: GlassWater },
    ];

    const handleOrder = (item) => {
        console.log(`Ordered ${item.name} to chair`);
        // TODO: Emit event to RxDB/Admin View
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Heading level={2}>Bar & Refreshments</Heading>
                <Text variant="caption" className="text-primary">Order to Chair</Text>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleOrder(item)}
                        className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex flex-col items-start gap-3 touch-target active:scale-95 transition-transform text-left relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-125 transition-transform duration-500">
                            <item.icon size={48} className="text-primary" />
                        </div>

                        <div className="p-2 bg-zinc-50 rounded-full text-zinc-700">
                            <item.icon size={20} />
                        </div>

                        <div>
                            <div className="font-bold text-zinc-800">{item.name}</div>
                            <Text variant="caption" className={item.price === 0 ? "text-success" : "text-zinc-500"}>
                                {item.price === 0 ? 'Complimentary' : `$${item.price.toFixed(2)}`}
                            </Text>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
