import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export const Button = ({
    children,
    variant = 'primary',
    className,
    isLoading,
    icon: Icon,
    ...props
}) => {
    const baseStyles = "w-full rounded-2xl font-bold flex items-center justify-center gap-2 touch-target transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-primary text-white shadow-lg shadow-primary/20",
        secondary: "bg-white/5 border border-zinc-200 text-zinc-900 hover:bg-zinc-50",
        outline: "border-2 border-primary text-primary hover:bg-primary/5",
        ghost: "text-zinc-500 hover:bg-zinc-100",
        danger: "bg-error text-white shadow-lg shadow-error/20",
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], className)}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <>
                    {Icon && <Icon className="w-5 h-5" />}
                    {children}
                </>
            )}
        </button>
    );
};
