import React from 'react';
import { cn } from '../../lib/utils';

export const Card = ({ children, className, ...props }) => {
    return (
        <div
            className={cn(
                "bg-surface rounded-3xl p-5 border border-zinc-100 shadow-sm",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
