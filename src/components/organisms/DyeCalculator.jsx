import React, { useState } from 'react';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { Keypad } from '../molecules/Keypad';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

export const DyeCalculator = ({ appointment }) => {
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
            // Allow logging even if user is null for now (or handle anonymously if needed)

            const grams = parseFloat(value);

            const { error } = await supabase.from('usage_logs').insert({
                grams_used: grams,
                master_id: user?.id || null,
                appointment_id: appointment?.id || null, // Link to real appointment!
                notes: 'Ручное списание из Калькулятора'
            });

            if (error) throw error;

            console.log("Dispensed:", grams, "g for appointment", appointment?.id);
            setValue('0');
            // Optimistic UI update or toast here
        } catch (error) {
            console.error("Error dispensing:", error);
            alert("Ошибка сохранения: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="flex flex-col gap-4">
            <Heading level={2}>Калькулятор красителя</Heading>

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
                    Добавить компонент
                </button>
                <button
                    onClick={handleDispense}
                    disabled={loading}
                    className="bg-primary text-white py-4 rounded-xl font-bold text-sm touch-target shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                    {loading ? 'Сохранение...' : 'Списать'}
                </button>
            </div>
        </Card>
    );
};
