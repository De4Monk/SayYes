import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';

export const InventoryTable = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            // Join catalog with units (if separated) or just fetch catalog for now as per requirements
            // Requirement: Name | Type | Quantity | Status
            // Assuming we have a view or we can fetch simple list. 
            // If we have inventory_catalog and inventory_units, we should join.
            // For MVP as requested ("Simple table"), let's try to fetch inventory_catalog and maybe aggregate units?
            // Or maybe there's just one table? 
            // Audit showed: inventory_catalog (products) and inventory_units (physical items).
            // We need to count units per catalog item.

            const { data, error } = await supabase
                .from('inventory_catalog')
                .select(`
                    id,
                    brand,
                    name,
                    type,
                    inventory_units (count)
                `);

            if (error) throw error;

            // Transform data to include count
            const formatted = data.map(item => ({
                ...item,
                quantity: item.inventory_units ? item.inventory_units[0].count : 0
            }));

            setInventory(formatted);
        } catch (err) {
            console.error("Error fetching inventory:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="animate-pulse h-32 bg-zinc-100 rounded-xl" />;

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <Heading level={2}>Inventory</Heading>
                <button
                    onClick={fetchInventory}
                    className="text-primary text-sm font-medium"
                >
                    Refresh
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-zinc-500 border-b border-zinc-100">
                        <tr>
                            <th className="pb-2 font-medium">Product</th>
                            <th className="pb-2 font-medium">Type</th>
                            <th className="pb-2 font-medium text-right">Qty</th>
                            <th className="pb-2 font-medium text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {inventory.map((item) => (
                            <tr key={item.id}>
                                <td className="py-3 pr-2">
                                    <div className="font-medium text-zinc-900">{item.name}</div>
                                    <div className="text-xs text-zinc-400">{item.brand}</div>
                                </td>
                                <td className="py-3 text-zinc-600 capitalize">{item.type}</td>
                                <td className="py-3 text-right font-medium">{item.quantity}</td>
                                <td className="py-3 text-right">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.quantity < 3
                                            ? 'bg-red-100 text-red-600'
                                            : 'bg-emerald-100 text-emerald-600'
                                        }`}>
                                        {item.quantity < 3 ? 'Low' : 'OK'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {inventory.length === 0 && (
                    <div className="text-center py-6 text-zinc-400">
                        No inventory items found.
                    </div>
                )}
            </div>
        </Card>
    );
};
