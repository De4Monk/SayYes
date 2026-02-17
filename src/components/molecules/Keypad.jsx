import React from 'react';
import { cn } from '../../lib/utils';
import { Delete } from 'lucide-react';

export const Keypad = ({ onKeyPress, onDelete, onClear }) => {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

    return (
        <div className="grid grid-cols-3 gap-2 w-full max-w-xs mx-auto">
            {keys.map((key) => (
                <button
                    key={key}
                    onClick={() => onKeyPress(key)}
                    className="h-14 rounded-xl bg-white text-xl font-bold text-zinc-800 shadow-sm active:bg-zinc-100 touch-target"
                >
                    {key}
                </button>
            ))}
            <button
                onClick={onDelete}
                className="h-14 rounded-xl bg-error/10 text-error flex items-center justify-center touch-target active:bg-error/20"
            >
                <Delete />
            </button>
        </div>
    );
};
