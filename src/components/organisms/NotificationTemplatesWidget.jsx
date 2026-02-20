import React, { useState, useEffect } from 'react';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { Bell, Edit2 } from 'lucide-react';
import { Button } from '../atoms/Button';
import { supabase } from '../../lib/supabase';
import { useRole } from '../../contexts/RoleContext';

const TEMPLATE_NAMES = {
    'reminder_24h': 'Напоминание за 24 часа',
    'feedback_request': 'Запрос отзыва',
    'cancellation_recovery': 'Возврат после отмены',
    'lost_client': 'Возврат спящих клиентов',
    'birthday_offer': 'Поздравление с Днем Рождения'
};

export const NotificationTemplatesWidget = () => {
    const { currentUser, currentRole } = useRole();
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(null);
    const [canEdit, setCanEdit] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [draftText, setDraftText] = useState('');
    const [draftConfig, setDraftConfig] = useState({});
    const [isSavingText, setIsSavingText] = useState(false);

    useEffect(() => {
        fetchTemplates();

        if (currentRole === 'owner') {
            setCanEdit(true);
        } else if (currentRole === 'admin') {
            fetchPermissions();
        }
    }, [currentUser?.id, currentRole]);

    const fetchPermissions = async () => {
        try {
            const { data, error } = await supabase
                .from('salon_settings')
                .select('admins_can_edit_templates')
                .limit(1)
                .single();

            if (data) {
                setCanEdit(data.admins_can_edit_templates);
            }
        } catch (err) {
            console.error('Ошибка проверки прав:', err);
            setCanEdit(false);
        }
    };

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('notification_templates')
                .select('*')
                .order('type');

            if (error) throw error;
            setTemplates(data || []);
        } catch (err) {
            console.error('Ошибка загрузки шаблонов:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTemplate = async (id, currentStatus) => {
        setIsUpdating(id);
        try {
            const { error } = await supabase
                .from('notification_templates')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            // Обновляем локальный стейт
            setTemplates(prev =>
                prev.map(t => t.id === id ? { ...t, is_active: !currentStatus } : t)
            );
        } catch (err) {
            console.error('Ошибка обновления шаблона:', err);
            alert('Ошибка при обновлении статуса шаблона');
        } finally {
            setIsUpdating(null);
        }
    };

    const handleEdit = (template) => {
        setEditingId(template.id);
        setDraftText(template.message_text || '');
        setDraftConfig(template.config || {});
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setDraftText('');
        setDraftConfig({});
    };

    const handleSaveText = async (id) => {
        setIsSavingText(true);
        try {
            const { error } = await supabase
                .from('notification_templates')
                .update({ message_text: draftText, config: draftConfig })
                .eq('id', id);

            if (error) throw error;

            setTemplates(prev =>
                prev.map(t => t.id === id ? { ...t, message_text: draftText, config: draftConfig } : t)
            );
            handleCancelEdit();
        } catch (err) {
            console.error('Ошибка сохранения текста шаблона:', err);
            alert('Ошибка при сохранении текста шаблона. Текст не потерян, попробуйте еще раз.');
        } finally {
            setIsSavingText(false);
        }
    };

    if (isLoading) {
        return (
            <Card className="flex flex-col gap-4 animate-pulse">
                <div className="h-6 bg-zinc-200 rounded w-1/3 mb-2"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-zinc-100 rounded-xl w-full"></div>
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                    <Bell size={20} />
                </div>
                <div>
                    <Heading level={3}>Шаблоны уведомлений</Heading>
                    <Text className="text-zinc-500 text-sm">Настройка автоматических рассылок</Text>
                </div>
            </div>

            <div className="space-y-3">
                {templates.map(template => (
                    <div
                        key={template.id}
                        className={`flex flex-col p-4 bg-zinc-50 border transition-colors rounded-xl ${editingId === template.id ? 'border-primary ring-1 ring-primary' : 'border-zinc-100 hover:border-zinc-200'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm text-zinc-800">
                                        {TEMPLATE_NAMES[template.type] || template.type}
                                    </span>
                                    <span className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-medium">
                                        Канал: {template.channels ? template.channels.join(' / ') : 'TG / WA / Both'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {canEdit && (
                                    <button
                                        onClick={() => handleEdit(template)}
                                        className="p-2 text-zinc-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg"
                                        title="Редактировать текст"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                )}

                                <button
                                    onClick={() => toggleTemplate(template.id, template.is_active)}
                                    disabled={!canEdit || isUpdating === template.id}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${template.is_active ? 'bg-primary' : 'bg-zinc-200'
                                        } ${(!canEdit || isUpdating === template.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${template.is_active ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Inline Editor */}
                        {editingId === template.id && (
                            <div className="mt-4 pt-4 border-t border-zinc-200 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                                {/* Dynamic Config Block */}
                                {template.type === 'cancellation_recovery' && (
                                    <div className="flex flex-col gap-1.5 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                                        <label className="text-sm font-medium text-zinc-700">
                                            Через сколько часов отправить после отмены?
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={draftConfig.delay_hours || ''}
                                            onChange={(e) => setDraftConfig({ ...draftConfig, delay_hours: parseInt(e.target.value) || 0 })}
                                            className="w-full sm:w-1/3 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none transition-colors"
                                        />
                                    </div>
                                )}

                                {template.type === 'lost_client' && (
                                    <div className="flex flex-col gap-1.5 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                                        <label className="text-sm font-medium text-zinc-700">
                                            Через сколько дней без визитов клиент считается 'спящим'?
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={draftConfig.days_offline || ''}
                                            onChange={(e) => setDraftConfig({ ...draftConfig, days_offline: parseInt(e.target.value) || 0 })}
                                            className="w-full sm:w-1/3 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none transition-colors"
                                        />
                                    </div>
                                )}

                                {template.type === 'reminder_24h' && (
                                    <div className="flex flex-col gap-1.5 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                                        <label className="text-sm font-medium text-zinc-700">
                                            За сколько часов до визита отправлять напоминание?
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={draftConfig.hours_before || ''}
                                            onChange={(e) => setDraftConfig({ ...draftConfig, hours_before: parseInt(e.target.value) || 0 })}
                                            className="w-full sm:w-1/3 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none transition-colors"
                                        />
                                    </div>
                                )}

                                {template.type === 'birthday_offer' && (
                                    <div className="flex flex-col gap-1.5 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                                        <label className="text-sm font-medium text-zinc-700">
                                            За сколько дней до Дня Рождения отправлять подарок?
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={draftConfig.days_before || ''}
                                            onChange={(e) => setDraftConfig({ ...draftConfig, days_before: parseInt(e.target.value) || 0 })}
                                            className="w-full sm:w-1/3 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none transition-colors"
                                        />
                                    </div>
                                )}

                                <textarea
                                    value={draftText}
                                    onChange={(e) => setDraftText(e.target.value)}
                                    className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-sm focus:border-primary outline-none transition-colors resize-y min-h-[100px]"
                                    placeholder="Введите текст шаблона..."
                                />

                                <div>
                                    <span className="text-xs font-semibold text-zinc-500 mb-2 block uppercase tracking-wider">Доступные переменные:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {['{{client_name}}', '{{time}}', '{{service}}', '{{master_name}}', '{{salon_name}}'].map(variable => (
                                            <span
                                                key={variable}
                                                className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded text-xs font-mono font-medium border border-zinc-200"
                                            >
                                                {variable}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleCancelEdit}
                                        disabled={isSavingText}
                                        className="text-sm px-4 py-2"
                                    >
                                        Отмена
                                    </Button>
                                    <Button
                                        onClick={() => handleSaveText(template.id)}
                                        disabled={isSavingText}
                                        className="text-sm px-4 py-2"
                                    >
                                        {isSavingText ? 'Сохранение...' : 'Сохранить'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {templates.length === 0 && (
                    <div className="text-center py-6 text-zinc-500 text-sm">
                        Шаблоны не найдены
                    </div>
                )}
            </div>
        </Card>
    );
};
