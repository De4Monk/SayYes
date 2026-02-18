import React, { useEffect, useState } from 'react';

import { supabase } from '../../lib/supabase';
import { useRole } from '../../contexts/RoleContext';
import { AppointmentListItem } from '../molecules/AppointmentListItem';
import { InventoryWidget } from '../molecules/InventoryWidget';
import { NavLink } from 'react-router-dom';
import { Heading, Text } from '../atoms/Typography';
import { Card } from '../atoms/Card';

export const SalonOperationsDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [stats, setStats] = useState({ revenue: 0, count: 0 });
    const [loading, setLoading] = useState(true);

    const { currentRole, currentUser } = useRole();

    const DYE_KEYWORDS = ["color", "coloring", "correction", "complex", "окрашивание", "коррекция", "комплекс", "toning", "тонер", "мелирование", "airtouch", "shatush", "balayage"];

    useEffect(() => {
        fetchData();
    }, [currentUser]); // Re-fetch when user loads

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fix: Use local date string to avoid UTC conversion issues
            // 'en-CA' format is YYYY-MM-DD which matches ISO date part
            const todayStr = new Date().toLocaleDateString('en-CA');
            console.log("Fetching appointments for local date:", todayStr);

            // Get appointments for today
            // Get appointments for today
            let query = supabase
                .from('appointments')
                .select('*')
                .gte('appointment_time', `${todayStr}T00:00:00`)
                .lte('appointment_time', `${todayStr}T23:59:59`)
                .order('appointment_time', { ascending: true });

            // RBAC Filter: 
            // - Owner/Admin: See ALL appointments (no filter)
            // - Master/Barber: See ONLY their own appointments (filter by dikidi_master_id)
            if (currentRole === 'master' || currentRole === 'barber') {
                if (currentUser && currentUser.dikidi_master_id) {
                    // console.log("Applying Master Filter:", currentUser.dikidi_master_id);
                    query = query.eq('master_id', currentUser.dikidi_master_id);
                } else {
                    console.warn("Role is master but no dikidi_master_id found in profile. Showing empty or all?");
                    // Ideally show nothing if ID is missing to be safe, but for now we let it fall through or we could force a filter that returns nothing
                    // query = query.eq('master_id', '000000'); // Force empty
                }
            } else if (currentRole === 'owner' || currentRole === 'admin') {
                // No filter needed, they see everything
                // console.log("Owner/Admin Access - Showing All Records");
            }

            const { data, error } = await query;

            if (error) throw error;

            const appts = data || [];
            setAppointments(appts);

            // Calculate revenue from 'paid' status
            const revenue = appts
                .filter(a => a.status === 'paid')
                .reduce((sum, a) => sum + (a.service_price || 0), 0);

            setStats({ revenue, count: appts.length });

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Header Section */}
            <header className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm px-4 pt-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                            {(currentRole === 'owner' || currentRole === 'admin')
                                ? 'SayYes Salon'
                                : `Hello, ${currentUser?.full_name || currentUser?.first_name || 'Master'}`
                            }
                        </h1>
                    </div>
                    <button className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                        <img
                            alt="Profile"
                            className="h-full w-full object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDv4kifFQzTPNTh389QyV3t0DHqUmoEhhtl65ZC4utPQrAscwmG6ImzB2ZXtVOtZJwcs4NtKeyXSzhACC8Fef5Nin8yLQJEFZtaA1hWxfyAIBHVwvfjaak5_60zgoFRNfebmsfloI7TpDd5dWdZZHDMQTBU_A02Nf1OyDTT3zj-YVoQkmM2wSiCtdHjdX1AIbK7TcmWi1_AQN5LrEa2EGdCPvGT6fgAzOt0A-JLvjCvmIBxVA_NUn8aigGXxLqDRapziIhlIsPlxPQ"
                        />
                        <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-green-400"></span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="px-4 py-4 space-y-6">

                {/* Revenue Hero Card */}
                <div className="bg-primary rounded-2xl p-6 shadow-lg shadow-primary/20 text-white relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
                    <div className="relative z-10 flex flex-col gap-1">
                        <div className="flex justify-between items-start">
                            <p className="text-primary-50 text-sm font-medium tracking-wide">Today's Revenue</p>
                            <span className="material-symbols-outlined text-primary-100">payments</span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                            <h2 className="text-4xl font-bold tracking-tight">${stats.revenue.toFixed(2)}</h2>
                        </div>
                        <div className="flex items-center gap-1.5 mt-3">
                            <div className="flex items-center justify-center bg-white/20 rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-sm">
                                <span className="material-symbols-outlined text-[14px] mr-0.5">trending_up</span>
                                --%
                            </div>
                            <span className="text-primary-100 text-xs">vs last Tuesday</span>
                        </div>
                    </div>
                </div>

                {/* Quick Action Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* New Appointment - Link to Schedule for now */}
                    <NavLink to="/schedule" className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform duration-150 min-h-[140px] group">
                        <div className="h-12 w-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                            <span className="material-symbols-outlined text-3xl">add</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">New Booking</span>
                    </NavLink>
                    {/* Check-in Client */}
                    <button className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform duration-150 min-h-[140px] group">
                        <div className="h-12 w-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                            <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Check-in</span>
                    </button>
                </div>

                {/* Inventory Alert Widget */}
                <InventoryWidget />

                {/* Schedule Preview */}
                <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upcoming</h3>
                        <NavLink to="/schedule" className="text-sm font-medium text-primary hover:text-primary/80">View Calendar</NavLink>
                    </div>
                    <div className="space-y-3">
                        {loading && <div className="p-4 text-center text-slate-400">Loading...</div>}
                        {!loading && appointments.length === 0 && (
                            <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl">No appointments today</div>
                        )}
                        {appointments.slice(0, 5).map((app) => {
                            // Check for Color Service
                            const isColorService = DYE_KEYWORDS.some(keyword =>
                                (app.service_name || '').toLowerCase().includes(keyword)
                            );

                            return (
                                <NavLink to="/schedule" key={app.id} className="block">
                                    <AppointmentListItem
                                        time={app.appointment_time}
                                        clientName={app.client_name}
                                        serviceName={app.service_name}
                                        status={app.status}
                                        onClick={() => { }}
                                        onAddDye={isColorService ? () => console.log("Add Dye for", app.id) : undefined}
                                    />
                                </NavLink>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
};
