import React, { useState, useEffect } from 'react';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useRole } from '../../contexts/RoleContext';

export const AdminPermissionsWidget = () => {
    const { currentUser } = useRole();
    const [isLoading, setIsLoading] = useState(true);
    const [permissions, setPermissions] = useState({
        admins_can_edit_templates: false,
        admins_can_send_mass_promo: false
    });
    const [isUpdating, setIsUpdating] = useState(null);

    useEffect(() => {
        const loadPermissions = async () => {
            if (!currentUser?.id) return;
            try {
                const { data, error } = await supabase
                    .from('salon_settings')
                    .select('admins_can_edit_templates, admins_can_send_mass_promo')
                    .eq('owner_profile_id', currentUser.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Ошибка загрузки прав:', error);
                } else if (data) {
                    setPermissions({
                        admins_can_edit_templates: data.admins_can_edit_templates ?? false,
                        admins_can_send_mass_promo: data.admins_can_send_mass_promo ?? false
                    });
                } else {
                    // Create default if not exists
                    await supabase.from('salon_settings').upsert({
                        owner_profile_id: currentUser.id,
                        admins_can_edit_templates: false,
                        admins_can_send_mass_promo: false
                    }, { onConflict: 'owner_profile_id' });
                }
            } catch (err) {
                console.error("Fetch permissions error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadPermissions();
    }, [currentUser?.id]);

    const togglePermission = async (field, currentValue) => {
        if (!currentUser?.id) return;
        setIsUpdating(field);

        try {
            const newValue = !currentValue;
            const { error } = await supabase
                .from('salon_settings')
                .update({ [field]: newValue })
                .eq('owner_profile_id', currentUser.id);

            if (error) throw error;

            setPermissions(prev => ({
                ...prev,
                [field]: newValue
            }));
        } catch (err) {
            console.error(`Ошибка обновления ${field}:`, err);
            alert('Ошибка при обновлении прав администратора');
        } finally {
            setIsUpdating(null);
        }
    };

    if (isLoading) {
        return (
            <Card className="flex flex-col gap-4 animate-pulse">
                <div className="h-6 bg-zinc-200 rounded w-1/3 mb-2"></div>
                <div className="space-y-3">
                    <div className="h-16 bg-zinc-100 rounded-xl w-full"></div>
                    <div className="h-16 bg-zinc-100 rounded-xl w-full"></div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
                    <Shield size={20} />
                </div>
                <div>
                    <Heading level={3}>Права администраторов</Heading>
                    <Text className="text-zinc-500 text-sm">Доступ к функциям управления</Text>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl transition-colors hover:border-zinc-200">
                    <div className="flex flex-col pr-4">
                        <span className="font-semibold text-sm text-zinc-800">
                            Редактирование шаблонов
                        </span>
                        <span className="text-xs text-zinc-500 mt-1">
                            Разрешить администраторам менять тексты уведомлений
                        </span>
                    </div>

                    <button
                        onClick={() => togglePermission('admins_can_edit_templates', permissions.admins_can_edit_templates)}
                        disabled={isUpdating === 'admins_can_edit_templates'}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${permissions.admins_can_edit_templates ? 'bg-primary' : 'bg-zinc-200'
                            } ${isUpdating === 'admins_can_edit_templates' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${permissions.admins_can_edit_templates ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl transition-colors hover:border-zinc-200">
                    <div className="flex flex-col pr-4">
                        <span className="font-semibold text-sm text-zinc-800">
                            Массовые рассылки
                        </span>
                        <span className="text-xs text-zinc-500 mt-1">
                            Разрешить администраторам запускать массовые промо-рассылки
                        </span>
                    </div>

                    <button
                        onClick={() => togglePermission('admins_can_send_mass_promo', permissions.admins_can_send_mass_promo)}
                        disabled={isUpdating === 'admins_can_send_mass_promo'}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${permissions.admins_can_send_mass_promo ? 'bg-primary' : 'bg-zinc-200'
                            } ${isUpdating === 'admins_can_send_mass_promo' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${permissions.admins_can_send_mass_promo ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>
        </Card>
    );
};
