import React from 'react';
import { useRole } from '../../contexts/RoleContext';

export const AuthGuard = ({ children }) => {
    const { currentUser, isLoading } = useRole();

    // 1. Loading State
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-sm text-slate-500 font-medium animate-pulse">Verifying Access...</p>
            </div>
        );
    }

    // 2. Unauthorized State (No User Found)
    if (!currentUser) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 px-6 text-center">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl max-w-sm w-full border border-slate-100 dark:border-slate-700">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 dark:text-red-400">
                        <span className="material-symbols-outlined text-3xl">lock</span>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">
                        Упс! Кажется, вас еще нет в системе SayYes ERP.
                    </p>

                    <button
                        onClick={() => window.open('https://t.me/evgenii_sayyes', '_blank')}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3.5 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                    >
                        <span className="material-symbols-outlined">send</span>
                        Contact Admin
                    </button>

                    <p className="mt-6 text-xs text-slate-400">
                        Please contact the administrator to get your access configured.
                    </p>
                </div>
            </div>
        );
    }

    // 3. Authorized
    return <>{children}</>;
};
