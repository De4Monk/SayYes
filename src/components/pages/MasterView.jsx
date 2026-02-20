import React, { useState, useEffect } from 'react';
import { Heading, Text } from '../atoms/Typography';
import { Card } from '../atoms/Card';
import { LiveEarningsWidget } from '../organisms/LiveEarningsWidget';
import { SmartModifiers } from '../organisms/SmartModifiers';
import { DyeCalculator } from '../organisms/DyeCalculator';
import { DyeCocktailInput } from '../organisms/DyeCocktailInput';
import { supabase } from '../../lib/supabase';
import { useRole } from '../../contexts/RoleContext';

export const MasterView = () => {
    const { currentUser } = useRole();
    const [currentAppointment, setCurrentAppointment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTodayAppointment = async () => {
            if (!currentUser?.dikidi_master_id) {
                setIsLoading(false);
                return;
            }

            try {
                // Determine today's start and end bounds in local time
                const today = new Date();
                const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
                const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

                // Fetch appointments for this master for today
                const { data, error } = await supabase
                    .from('appointments')
                    .select('*')
                    .eq('master_id', currentUser.dikidi_master_id)
                    .gte('start_time', startOfDay)
                    .lte('start_time', endOfDay)
                    .order('start_time', { ascending: true });

                if (error) throw error;

                if (data && data.length > 0) {
                    // Find the nearest future or currently uncompleted appointment
                    const now = new Date();
                    const activeAppointment = data.find(appt => {
                        const apptTime = new Date(appt.start_time);
                        // Consider it active if it's in the future or within a reasonable past window (e.g., started but not finished)
                        // For simplicity here, just taking the first one that hasn't officially 'ended' if we had end times, 
                        // or just the first appointment chronologically if we assume they are processed sequentially.
                        // Let's refine: find the first one whose start_time + duration (or just start_time) is closest to now.
                        // If no duration, just pick the first one that is >= now, or the last one if all are in the past.
                        return apptTime >= now || (apptTime < now && appt.status !== 'completed'); // simplified check
                    });

                    // Fallback to the first appointment of the day if none match "active" perfectly
                    setCurrentAppointment(activeAppointment || data[0]);
                } else {
                    setCurrentAppointment(null);
                }
            } catch (err) {
                console.error('Ошибка загрузки записей мастера:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTodayAppointment();
    }, [currentUser?.dikidi_master_id]);

    const isColorService = (serviceName) => {
        if (!serviceName) return false;
        const keywords = ['окрашивание', 'тонирование', 'камуфляж', 'airtouch', 'color', 'tinting'];
        const normalizedName = serviceName.toLowerCase();
        return keywords.some(keyword => normalizedName.includes(keyword));
    };

    if (isLoading) {
        return (
            <div className="space-y-6 pb-safe animate-pulse p-4">
                <div className="h-8 bg-zinc-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-zinc-200 rounded w-1/3"></div>
                <div className="h-32 bg-zinc-100 rounded-2xl w-full mt-6"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-safe">
            <div className="mb-2">
                <Heading level={1}>Рабочее место</Heading>
                <Text>Ваши записи на сегодня</Text>
            </div>

            {!currentAppointment ? (
                <Card className="flex flex-col items-center justify-center p-8 text-center bg-zinc-50 border border-zinc-100 border-dashed">
                    <Text className="text-zinc-500">На сегодня активных записей нет</Text>
                </Card>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white border-none shadow-xl">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                                Текущий клиент
                            </span>
                            <Heading level={2} className="text-white m-0">
                                {currentAppointment.client_name || 'Неизвестный клиент'}
                            </Heading>

                            <div className="flex items-center gap-4 mt-2">
                                <div className="flex flex-col bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                                    <span className="text-[10px] text-zinc-400 uppercase">Время</span>
                                    <span className="font-mono text-sm font-semibold text-zinc-100">
                                        {new Date(currentAppointment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex flex-col bg-black/20 px-3 py-1.5 rounded-lg border border-white/5 flex-1 line-clamp-2">
                                    <span className="text-[10px] text-zinc-400 uppercase">Услуга</span>
                                    <span className="text-sm font-medium text-zinc-100 truncate">
                                        {currentAppointment.service_name || 'Услуга не указана'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <LiveEarningsWidget
                        currentEarnings={currentAppointment.price || 0} // Using actual price if available
                        materialCost={0} // TODO: Calculate from usage_logs
                        allowance={(currentAppointment.price || 0) * 0.1 || 25.00} // Mock logic
                    />

                    {/* Smart Logic Rendering */}
                    {isColorService(currentAppointment.service_name) && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                            <DyeCocktailInput />
                        </div>
                    )}

                    <SmartModifiers />

                    <DyeCalculator appointment={currentAppointment} />
                </div>
            )}

            {/* Additional spacing for bottom nav */}
            <div className="h-4" />
        </div>
    );
};
