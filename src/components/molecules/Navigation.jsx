import React from 'react';
import { useRole } from '../../contexts/RoleContext';
import { Workflow, IdCard, LineChart, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Navigation = () => {
    const { currentRole, switchRole } = useRole();

    const navItems = [
        { id: 'master', label: 'Master', icon: Workflow },
        { id: 'admin', label: 'Admin', icon: IdCard },
        { id: 'owner', label: 'Owner', icon: LineChart },
        { id: 'client', label: 'Client', icon: User },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 glass h-20 px-4 flex items-center justify-around z-50 pb-safe">
            {navItems.map((item) => {
                const isActive = currentRole === item.id;
                const Icon = item.icon;

                return (
                    <button
                        key={item.id}
                        onClick={() => switchRole(item.id)}
                        className={cn(
                            "flex flex-col items-center gap-1 group relative touch-target transition-all duration-300",
                            isActive ? "text-primary" : "text-zinc-400"
                        )}
                    >
                        {isActive && (
                            <div className="absolute -top-1 w-12 h-8 bg-primary/10 rounded-full animate-fade-in -z-10" />
                        )}
                        <Icon className={cn("w-6 h-6 transition-transform duration-300", isActive && "scale-110")} />
                        <span className="text-[10px] font-bold uppercase tracking-widest transition-colors duration-300">
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};
