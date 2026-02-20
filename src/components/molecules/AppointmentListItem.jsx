import React from 'react';

export const AppointmentListItem = ({ time, clientName, serviceName, status, onClick, onAddDye }) => {
    // Determine status color
    let statusColor = 'bg-primary';
    if (status === 'paid') statusColor = 'bg-green-500';
    if (status === 'cancelled') statusColor = 'bg-red-500';

    // Format time
    const dateObj = time ? new Date(time) : new Date();
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    // Split into time and AM/PM if possible, or just show time
    const [timePart, ampmPart] = timeStr.split(' ');

    return (
        <div
            onClick={onClick}
            className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 relative overflow-hidden cursor-pointer active:scale-95 transition-transform"
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusColor}`}></div>
            <div className="flex flex-col items-center min-w-[3.5rem] border-r border-slate-100 dark:border-slate-700 pr-4 py-1">
                <span className="text-xs text-slate-500 font-medium">{timePart}</span>
                <span className="text-xs text-slate-400">{ampmPart}</span>
            </div>
            <div className="flex-1">
                <h4 className="font-semibold text-slate-900 dark:text-white">{clientName}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{serviceName}</p>
            </div>

            {/* Conditional Dye Button */}
            {onAddDye && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddDye();
                    }}
                    className="mr-2 h-8 w-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800"
                    title="Добавить расход красителя"
                >
                    <span className="material-symbols-outlined text-lg">science</span>
                </button>
            )}

            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-lg">chevron_right</span>
            </div>
        </div>
    );
};
