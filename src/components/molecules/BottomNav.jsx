import React from 'react';
import { NavLink } from 'react-router-dom';
import { useRole } from '../../contexts/RoleContext';

export const BottomNav = () => {
    const { currentRole } = useRole();

    const navItems = [
        { name: 'Главная', icon: 'home', path: '/' },
        { name: 'Записи', icon: 'calendar_month', path: '/schedule' },
        { name: 'Клиенты', icon: 'group', path: '/clients' },
    ];

    if (currentRole === 'admin' || currentRole === 'owner') {
        navItems.push({ name: 'Управление', icon: 'dashboard', path: '/manage' });
        navItems.push({ name: 'Уведомления', icon: 'notifications', path: '/settings' });
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 pb-safe pt-2 px-2">
            <div className="flex justify-around items-end w-full pb-3">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `group flex flex-col items-center justify-center w-full gap-1 pt-1 ${isActive ? 'text-primary' : 'text-slate-400'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div
                                    className={`h-8 flex items-center justify-center transition-transform group-active:scale-90 ${isActive
                                        ? 'text-primary'
                                        : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                                        }`}
                                >
                                    <span
                                        className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}
                                        style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                                    >
                                        {item.icon}
                                    </span>
                                </div>
                                <span
                                    className={`text-[10px] font-medium ${isActive
                                        ? 'text-primary'
                                        : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                                        }`}
                                >
                                    {item.name}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};
