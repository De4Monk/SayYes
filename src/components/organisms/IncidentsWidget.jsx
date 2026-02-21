import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRole } from '../../contexts/RoleContext';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { AlertTriangle, Phone } from 'lucide-react';

export const IncidentsWidget = () => {
    const { currentRole } = useRole();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentRole === 'admin' || currentRole === 'owner') {
            fetchIncidents();
        } else {
            setLoading(false);
        }
    }, [currentRole]);

    const fetchIncidents = async () => {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
                    id, score, comment, created_at,
                    appointments ( service_name, start_time ),
                    clients ( name, phone )
                `)
                .lt('score', 5)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            setIncidents(data || []);
        } catch (error) {
            console.error('Error fetching incidents:', error);
        } finally {
            setLoading(false);
        }
    };

    if (currentRole !== 'admin' && currentRole !== 'owner') return null;

    if (loading) {
        return (
            <Card className="p-4 space-y-4">
                <div className="h-6 w-1/3 bg-slate-200 rounded animate-pulse" />
                <div className="h-24 w-full bg-slate-200 rounded animate-pulse" />
            </Card>
        );
    }

    return (
        <Card className="p-4 bg-white border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-red-500" />
            <div className="pl-3">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <Heading level={3} className="text-slate-900 m-0">
                        Требуют внимания (Инциденты)
                    </Heading>
                </div>

                {incidents.length === 0 ? (
                    <Text className="text-slate-400 text-sm">
                        Негативных отзывов нет. Отличная работа!
                    </Text>
                ) : (
                    <div className="space-y-3">
                        {incidents.map((incident) => {
                            const date = new Date(incident.appointments?.start_time).toLocaleDateString('ru-RU', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            });

                            return (
                                <div key={incident.id} className="p-3 bg-red-50/50 border border-red-100 rounded-lg">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="font-medium text-slate-800 flex items-center gap-2">
                                                {incident.clients?.name || 'Неизвестный клиент'}
                                                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">
                                                    {incident.score} / 5
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                {incident.appointments?.service_name || 'Услуга'} • {incident.appointments?.start_time ? date : 'Нет даты'}
                                            </div>
                                        </div>
                                        {incident.clients?.phone && (
                                            <a
                                                href={`tel:${incident.clients.phone}`}
                                                className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors shrink-0"
                                            >
                                                <Phone className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                    <div className="text-sm text-slate-700 italic border-l-2 border-red-200 pl-2 mt-2">
                                        {incident.comment ? `"${incident.comment}"` : "Ожидается комментарий клиента..."}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Card>
    );
};
