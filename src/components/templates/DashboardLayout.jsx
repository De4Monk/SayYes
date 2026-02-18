import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '../molecules/BottomNav';

export const DashboardLayout = () => {
    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white min-h-screen flex flex-col antialiased">
            <main className="flex-1 overflow-y-auto pb-24">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
};
