import React from 'react';
import { cn } from '../../lib/utils';

export const Heading = ({ children, level = 1, className, ...props }) => {
    const Tag = `h${level}`;
    const styles = {
        1: "font-display text-2xl font-bold mb-1",
        2: "font-display text-xl font-bold mb-1",
        3: "font-bold text-lg mb-1",
    };

    return (
        <Tag className={cn(styles[level], className)} {...props}>
            {children}
        </Tag>
    );
};

export const Text = ({ children, variant = 'body', className, ...props }) => {
    const styles = {
        body: "text-zinc-500 text-sm",
        caption: "text-[10px] text-zinc-400 uppercase font-bold tracking-wider",
        label: "text-sm font-medium text-zinc-700",
    };

    return (
        <p className={cn(styles[variant], className)} {...props}>
            {children}
        </p>
    );
};
