import React from 'react';
import { POSItem } from '../molecules/POSItem';
import { Heading } from '../atoms/Typography';
import { Coffee, Wine, ShoppingBag, Scissors } from 'lucide-react';

export const BarPOSGrid = () => {
    const items = [
        { id: 1, label: 'Кофе', price: 3.50, icon: Coffee },
        { id: 2, label: 'Чай', price: 2.50, icon: Coffee }, // Using Coffee icon for Tea for now
        { id: 3, label: 'Вино', price: 8.00, icon: Wine },
        { id: 4, label: 'Шампунь', price: 25.00, icon: ShoppingBag },
        { id: 5, label: 'Маска', price: 30.00, icon: ShoppingBag },
        { id: 6, label: 'Стрижка', price: 15.00, icon: Scissors },
    ];

    const handleAddItem = (item) => {
        // TODO: Add to RxDB context/cart
        console.log('Added item:', item.label);
    };

    return (
        <div className="space-y-4">
            <Heading level={2}>Быстрая касса</Heading>
            <div className="grid grid-cols-3 gap-3">
                {items.map((item) => (
                    <POSItem
                        key={item.id}
                        {...item}
                        onClick={() => handleAddItem(item)}
                    />
                ))}
            </div>
        </div>
    );
};
