import React from 'react';
import { cn } from '../../lib/utils';

export const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-zinc-800/10", className)}
            {...props}
        />
    );
};
