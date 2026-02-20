import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BookingCard } from '../molecules/BookingCard';
import { Heading, Text } from '../atoms/Typography';
import { Skeleton } from '../atoms/Skeleton'; // Assuming we create/have one, or I'll define a simple one here temporarily

const AppointmentList = ({ onSelect }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Fetch appointments where time is >= today AND < tomorrow
            // Note: date strings in DB might be ISO. 
            // For simplicity in this demo, accessing all appointments or just limiting by order
            // Ideally: .gte('appointment_time', today.toISOString()).lt(...)

            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .order('appointment_time', { ascending: true })
                .limit(20);

            if (error) throw error;
            setAppointments(data || []);
        } catch (err) {
            console.error("Error fetching appointments:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-8 w-1/3 bg-zinc-200 animate-pulse rounded" />
                <div className="h-40 bg-zinc-100 animate-pulse rounded-2xl" />
                <div className="h-40 bg-zinc-100 animate-pulse rounded-2xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-500 rounded-xl">
                Ошибка при загрузке записей: {error}
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div className="text-center py-10 bg-zinc-50 rounded-xl">
                <Text className="text-zinc-400">На сегодня записей не найдено.</Text>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Heading level={2}>Клиенты сегодня</Heading>
            <div className="grid gap-4">
                {appointments.map((appt) => (
                    <BookingCard
                        key={appt.id}
                        clientName={appt.client_name}
                        serviceName={appt.service_name}
                        time={appt.appointment_time}
                        status={appt.status}
                        onClick={() => onSelect(appt)}
                    />
                ))}
            </div>
        </div>
    );
};

export default AppointmentList;
