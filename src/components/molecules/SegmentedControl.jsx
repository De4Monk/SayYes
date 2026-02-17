import React from 'react';
import { cn } from '../../lib/utils';
import { Text } from '../atoms/Typography';

export const SegmentedControl = ({ options, value, onChange, label }) => {
    return (
        <div className="flex flex-col gap-2 w-full">
            {label && <Text variant="caption">{label}</Text>}
            <div className="flex p-1 bg-zinc-200/50 rounded-xl">
                {options.map((option) => {
                    const isSelected = value === option.value;
                    return (
                        <button
                            key={option.value}
                            onClick={() => onChange(option.value)}
                            className={cn(
                                "flex-1 py-3 px-2 rounded-lg text-sm font-bold transition-all duration-200 touch-target",
                                isSelected
                                    ? "bg-white text-primary shadow-sm scale-[1.02]"
                                    : "text-zinc-500 hover:text-zinc-700"
                            )}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
