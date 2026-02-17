import React from 'react';
import { Card } from '../atoms/Card';
import { Text } from '../atoms/Typography';
import { cn } from '../../lib/utils';

export const POSItem = ({ icon: Icon, label, price, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-zinc-100 touch-target active:scale-95 transition-transform hover:border-primary/50 text-center gap-2 aspect-square"
        >
            <div className="p-3 bg-primary/5 rounded-full text-primary">
                <Icon size={24} />
            </div>
            <div>
                <div className="font-bold text-sm leading-tight text-zinc-800">{label}</div>
                <Text variant="caption" className="mt-1">${price.toFixed(2)}</Text>
            </div>
        </button>
    );
};
