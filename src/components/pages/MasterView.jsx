import React, { useState, useEffect } from 'react';
import { Heading, Text } from '../atoms/Typography';
import { Card } from '../atoms/Card';
import { LiveEarningsWidget } from '../organisms/LiveEarningsWidget';
import { SmartModifiers } from '../organisms/SmartModifiers';
import { DyeCalculator } from '../organisms/DyeCalculator';
import { DyeCocktailInput } from '../organisms/DyeCocktailInput';
import { supabase } from '../../lib/supabase';
import { useRole } from '../../contexts/RoleContext';
import { getTodayBounds } from '../../lib/dateUtils';

export const MasterView = () => {
    const { currentUser } = useRole();
    const [currentAppointment, setCurrentAppointment] = useState(null);
    const [todayEarnings, setTodayEarnings] = useState(0);
    const [materialCost, setMaterialCost] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTodayData = async () => {
            if (!currentUser?.dikidi_master_id) {
                setIsLoading(false);
                return;
            }

            try {
                // Use standardized timezone bounds for Asia/Tbilisi
                const { startOfDay, endOfDay } = getTodayBounds();

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
                    // Find the nearest future or currently active appointment
                    const now = new Date();
                    const activeAppointment = data.find(appt => {
                        const apptTime = new Date(appt.start_time);
                        return apptTime >= now || (apptTime < now && appt.status !== 'completed');
                    });

                    setCurrentAppointment(activeAppointment || data[0]);

                    // Calculate total earnings for today (all paid appointments)
                    const earnings = data
                        .filter(a => a.status === 'paid')
                        .reduce((sum, a) => sum + (a.service_price || 0), 0);
                    setTodayEarnings(earnings);

                    // Fetch real material cost from usage_logs for today
                    const appointmentIds = data.map(a => a.id);
                    const { data: usageLogs, error: usageError } = await supabase
                        .from('usage_logs')
                        .select('grams_used')
                        .in('appointment_id', appointmentIds);

                    if (!usageError && usageLogs) {
                        // Assume standard cost per gram: 0.50 ₾/gram
                        const totalCost = usageLogs.reduce((sum, log) => sum + (log.grams_used * 0.50), 0);
                        setMaterialCost(totalCost);
                    }
                } else {
                    setCurrentAppointment(null);
                }
            } catch (err) {
                console.error('Ошибка загрузки записей мастера:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTodayData();
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
                                        {new Date(currentAppointment.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tbilisi' })}
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
                        currentEarnings={currentAppointment.service_price || 0}
                        materialCost={materialCost}
                        allowance={(currentAppointment.service_price || 0) * 0.1 || 25.00}
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
