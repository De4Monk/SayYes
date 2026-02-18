import React from 'react';

export const InventoryWidget = () => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400">warning</span>
                    <h3 className="font-bold text-red-700 dark:text-red-300">Low Stock Alert</h3>
                </div>
                <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-bold px-2 py-1 rounded-full">3 Items</span>
            </div>
            {/* Hardcoded for now as per design */}
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                <div className="p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC2DdzluRqoIHDr393PLp1YUQbxNlnF_h-gSD8ygQHUcOFKtlqg6YkmU-Htj8B15JT4LqcK9nQ4-KR-FqMfUpJX6ZqDG6k6tzjbZwrqXdBrCFa0qURlEXvvGKM-odhmf-Lqa2sNllXBE6mTq1EOhDlvUKw9VdLvYSLDmLcPsI7ftqmKaDWHBp0ve3A-Pdy2CjNbKgDJvUvXaWKEGoHZGi1aBvqvunCXo_1I8ZA5KclpZ3zRakG5WVLz-feLSqEQVcqOSZaytHstDds')" }}></div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Moroccanoil Treatment</p>
                            <p className="text-xs text-slate-500">Only 2 units left</p>
                        </div>
                    </div>
                    <button className="text-primary text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors">
                        Restock
                    </button>
                </div>
                {/* Item 2 */}
                <div className="p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCJO1En7pWgDzWycicgqJN1jZrXiTlarMS0domaWkSXf4oFB_3h6SdgcqM11pkGW43C7lptpCa-rG9Ul-cnblEz3aack46hIy7CcXpaIi--1Vw71cN5k0_LrwsdbbS_fT5meezlNvl1NmOpTi8xxODGI3NMOD9duNViDWiJob4BaY_sP3qh7gXbVT6LcrqRUa1qDMU_hFvGIaw2c-oCjsGLBuwOPGV5VeqRyy7YsmOuvW6yoQp5uuGW20GjL4iLuMOxkipgddrgzwg')" }}></div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Redken Hairspray</p>
                            <p className="text-xs text-slate-500">Only 1 unit left</p>
                        </div>
                    </div>
                    <button className="text-primary text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors">
                        Restock
                    </button>
                </div>
            </div>
        </div>
    );
};
