import React, { useState } from 'react';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { Keypad } from '../molecules/Keypad';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

export const DyeCalculator = () => {
    const [value, setValue] = useState('0');
    const [loading, setLoading] = useState(false);

    const handleKeyPress = (key) => {
        setValue((prev) => {
            if (prev === '0' && key !== '.') return key;
            if (key === '.' && prev.includes('.')) return prev;
            if (prev.length > 5) return prev; // Max length
            return prev + key;
        });
    };

    const handleDelete = () => {
        setValue((prev) => {
            if (prev.length === 1) return '0';
            return prev.slice(0, -1);
        });
    };

    const handleDispense = async () => {
        if (value === '0') return;
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error("No authenticated user");
                // For demo/dev purposes without auth, we might just log or return
                // return; 
            }

            // TODO: In a real app, we would select the specific Inventory Unit ID here.
            // For now, we log a generic usage or "open" usage.
            const grams = parseFloat(value);

            const { error } = await supabase.from('usage_logs').insert({
                grams_used: grams,
                master_id: user?.id, // This will fail if RLS/Reference checks fail and no user is logged in
                // appointment_id, unit_id - optional/context dependent
                notes: 'Manual dispense from DyeCalculator'
            });

            if (error) throw error;

            console.log("Dispensed:", grams, "g");
            setValue('0');
        } catch (error) {
            console.error("Error dispensing:", error);
            alert("Error logging usage: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="flex flex-col gap-4">
            <Heading level={2}>Dye Calculator</Heading>

            {/* Display Screen */}
            <div className="bg-zinc-100 p-4 rounded-2xl text-right mb-2 border border-zinc-200">
                <Text variant="caption" className="mb-1">Grams</Text>
                <div className="text-4xl font-display font-black text-primary tracking-tight">
                    {value}<span className="text-zinc-400 text-xl ml-1">g</span>
                </div>
            </div>

            <Keypad onKeyPress={handleKeyPress} onDelete={handleDelete} />

            <div className="grid grid-cols-2 gap-3 mt-2">
                <button className="bg-primary/10 text-primary py-4 rounded-xl font-bold text-sm touch-target">
                    Add Component
                </button>
                <button
                    onClick={handleDispense}
                    disabled={loading}
                    className="bg-primary text-white py-4 rounded-xl font-bold text-sm touch-target shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Dispense & Log'}
                </button>
            </div>
        </Card>
    );
};
