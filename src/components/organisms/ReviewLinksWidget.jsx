import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRole } from '../../contexts/RoleContext';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { Button } from '../atoms/Button';

export const ReviewLinksWidget = () => {
    const { currentUser, currentRole } = useRole();
    const [links, setLinks] = useState({
        google: { enabled: false, url: '' },
        yandex: { enabled: false, url: '' },
        twogis: { enabled: false, url: '' },
        dikidi: { enabled: false, url: '' }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (currentUser?.id && currentRole === 'owner') {
            fetchSettings();
        } else {
            setLoading(false);
        }
    }, [currentUser, currentRole]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('salon_settings')
                .select('review_links')
                .eq('owner_profile_id', currentUser.id)
                .single();

            if (error) {
                if (error.code !== 'PGRST116') { // PGRST116 is no rows returned, ignore if new
                    throw error;
                }
            }
            if (data?.review_links) {
                setLinks(prev => ({
                    ...prev,
                    ...data.review_links
                }));
            }
        } catch (error) {
            console.error('Error fetching review links:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('salon_settings')
                .update({ review_links: links })
                .eq('owner_profile_id', currentUser.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error saving review links:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = (platform) => {
        setLinks(prev => ({
            ...prev,
            [platform]: { ...prev[platform], enabled: !prev[platform].enabled }
        }));
    };

    const handleUrlChange = (platform, url) => {
        setLinks(prev => ({
            ...prev,
            [platform]: { ...prev[platform], url }
        }));
    };

    if (currentRole !== 'owner') return null;

    const platforms = [
        { id: 'google', label: 'Google Maps' },
        { id: 'yandex', label: 'Яндекс Карты' },
        { id: 'twogis', label: '2GIS' },
        { id: 'dikidi', label: 'Dikidi' }
    ];

    if (loading) {
        return (
            <Card className="p-4 space-y-4">
                <div className="h-6 w-1/3 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
                <div className="h-32 w-full bg-slate-200 rounded animate-pulse" />
            </Card>
        );
    }

    return (
        <Card className="p-4 bg-white border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-primary" />
            <div className="pl-3">
                <Heading level={3} className="text-slate-900 mb-1">
                    Площадки для отзывов
                </Heading>
                <Text className="text-slate-500 text-sm mb-6 leading-snug">
                    Эти ссылки получат клиенты, оценившие визит на 5 звезд.
                </Text>

                <div className="space-y-4 mb-6">
                    {platforms.map(platform => (
                        <div key={platform.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm text-slate-700">{platform.label}</span>

                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={links[platform.id]?.enabled || false}
                                        onChange={() => handleToggle(platform.id)}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            {links[platform.id]?.enabled && (
                                <input
                                    type="url"
                                    placeholder={`Ссылка на ${platform.label}`}
                                    className="w-full px-3 py-2 mt-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                    value={links[platform.id]?.url || ''}
                                    onChange={(e) => handleUrlChange(platform.id, e.target.value)}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <Button
                    variant="primary"
                    fullWidth
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>
            </div>
        </Card>
    );
};
