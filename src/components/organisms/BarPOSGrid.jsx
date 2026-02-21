import React, { useEffect, useState } from 'react';
import { POSItem } from '../molecules/POSItem';
import { Heading } from '../atoms/Typography';
import { Coffee, Wine, ShoppingBag, Scissors } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Map inventory type/name to an appropriate icon
const getItemIcon = (name) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('кофе') || lower.includes('чай') || lower.includes('coffee') || lower.includes('tea')) return Coffee;
    if (lower.includes('вино') || lower.includes('wine') || lower.includes('пиво') || lower.includes('beer')) return Wine;
    if (lower.includes('стрижка') || lower.includes('haircut')) return Scissors;
    return ShoppingBag; // default
};

export const BarPOSGrid = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBarItems = async () => {
            try {
                const { data, error } = await supabase
                    .from('inventory')
                    .select('id, name, unit_count, total_grams, alert_threshold')
                    .eq('type', 'bar')
                    .order('name', { ascending: true });

                if (error) throw error;

                setItems(data || []);
            } catch (err) {
                console.error('Ошибка загрузки товаров бара:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBarItems();
    }, []);

    const handleAddItem = async (item) => {
        // TODO: Integrate with a cart/checkout flow
        console.log('Добавлено в продажу:', item.name);
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Heading level={2}>Быстрая касса</Heading>
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-zinc-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="space-y-4">
                <Heading level={2}>Быстрая касса</Heading>
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl">
                    Товары бара не добавлены в инвентарь
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Heading level={2}>Быстрая касса</Heading>
            <div className="grid grid-cols-3 gap-3">
                {items.map((item) => (
                    <POSItem
                        key={item.id}
                        label={item.name}
                        icon={getItemIcon(item.name)}
                        onClick={() => handleAddItem(item)}
                    />
                ))}
            </div>
        </div>
    );
};
