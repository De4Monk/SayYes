import React from 'react';
import { Navigation } from '../molecules/Navigation';
import { cn } from '../../lib/utils';

export const MainLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-background text-text font-sans flex flex-col items-center">
            {/* Container for Desktop Centering (Max Width constraint) logic */}
            <div className="w-full max-w-lg min-h-screen relative bg-background shadow-2xl flex flex-col">

                {/* Header */}
                <header className="fixed top-0 left-0 right-0 z-50 h-16 glass flex items-center justify-between px-6 max-w-lg mx-auto">
                    <div className="flex flex-col">
                        <span className="font-display font-extrabold text-xl tracking-tight text-black">ELITE<span className="text-primary">ERP</span></span>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                            </span>
                            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Cloud Synced</span>
                        </div>
                    </div>

                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs text-white">
                        JD
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <main className="flex-grow pt-20 pb-24 px-4 overflow-y-auto custom-scrollbar">
                    {children}
                </main>

                {/* Navigation - Constrained to max-width and fixed at bottom */}
                <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-50">
                    <Navigation />
                </div>
            </div>
        </div>
    );
};
