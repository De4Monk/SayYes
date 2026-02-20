import React, { useState, useEffect } from 'react';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { BellRing, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useRole } from '../../contexts/RoleContext';

export const NotificationQueueWidget = () => {
    const { currentUser } = useRole();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        pending: 0,
        sent: 0,
        failed: 0
    });

    const fetchCounts = async () => {
        if (!currentUser?.id) return;

        try {
            const queries = ['pending', 'sent', 'failed'].map(status =>
                supabase
                    .from('notification_queue')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', status)
            );

            const [pendingRes, sentRes, failedRes] = await Promise.all(queries);

            setStats({
                pending: pendingRes.count || 0,
                sent: sentRes.count || 0,
                failed: failedRes.count || 0
            });
        } catch (err) {
            console.error('Ошибка загрузки очереди:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCounts();

        const channel = supabase.channel('custom-all-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notification_queue' },
                (payload) => {
                    fetchCounts();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser?.id]);

    if (isLoading) {
        return (
            <Card className="flex flex-col gap-4 animate-pulse">
                <div className="h-6 bg-zinc-200 rounded w-1/3 mb-2"></div>
                <div className="grid grid-cols-3 gap-3">
                    <div className="h-24 bg-zinc-100 rounded-xl"></div>
                    <div className="h-24 bg-zinc-100 rounded-xl"></div>
                    <div className="h-24 bg-zinc-100 rounded-xl"></div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <BellRing size={20} />
                </div>
                <div>
                    <Heading level={3}>Очередь уведомлений</Heading>
                    <Text className="text-zinc-500 text-sm">Статус отправки в реальном времени</Text>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center justify-center bg-orange-50 border border-orange-100 rounded-xl p-3">
                    <Clock size={24} className="text-orange-400 mb-1" />
                    <span className="text-2xl font-bold text-orange-600">{stats.pending}</span>
                    <span className="text-[10px] font-medium text-orange-600/70 uppercase tracking-wider text-center">Ожидают</span>
                </div>

                <div className="flex flex-col items-center justify-center bg-green-50 border border-green-100 rounded-xl p-3">
                    <CheckCircle2 size={24} className="text-green-500 mb-1" />
                    <span className="text-2xl font-bold text-green-600">{stats.sent}</span>
                    <span className="text-[10px] font-medium text-green-600/70 uppercase tracking-wider text-center">Отправлены</span>
                </div>

                <div className="flex flex-col items-center justify-center bg-red-50 border border-red-100 rounded-xl p-3">
                    <AlertCircle size={24} className="text-red-500 mb-1" />
                    <span className="text-2xl font-bold text-red-600">{stats.failed}</span>
                    <span className="text-[10px] font-medium text-red-600/70 uppercase tracking-wider text-center">Ошибки</span>
                </div>
            </div>
        </Card>
    );
};
