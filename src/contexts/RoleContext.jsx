import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, setSupabaseToken } from '../lib/supabase';
import { useTelegram } from '../hooks/useTelegram';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
    const [currentRole, setCurrentRole] = useState('master'); // Default to master until loaded
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const { tg, user: tgUser, onToggleButton } = useTelegram();

    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Wait for TG to be ready if possible, but we rely on the hook

                if (tgUser) {
                    console.log("Telegram User Detected via Hook:", tgUser);

                    // 2. Fetch Profile from Custom Backend
                    const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8080';
                    const response = await fetch(`${WORKER_URL}/auth/telegram`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            initData: tg.initData,
                            user: tgUser
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `Auth Failed: ${response.status} ${response.statusText}`);
                    }

                    const responseData = await response.json();

                    if (responseData.token) {
                        // Используем наш кастомный инжектор токена в заголовки запросов
                        // вместо системного Supabase Auth, чтобы избежать конфликта с GoTrue
                        setSupabaseToken(responseData.token);
                    }

                    const profile = responseData.profile;
                    if (profile) {
                        console.log("Profile Loaded from Backend:", profile);
                        setCurrentUser(profile);
                        if (profile.role) {
                            setCurrentRole(profile.role);
                        }
                    } else {
                        throw new Error("Profile data not found in backend response");
                    }
                } else {
                    console.log("No Telegram User detected via Hook. Environment:", import.meta.env.MODE);

                    // Fallback for Dev/Browser Mode if Auth fails
                    if (import.meta.env.DEV) {
                        console.warn("⚠️ No Telegram User. Activating DEV MODE.");
                        setCurrentUser({
                            id: 'dev-admin-id',
                            telegram_id: 'dev_admin',
                            role: 'admin', // Default to Admin for easier testing
                            native_name: 'Dev Admin'
                        });
                        setCurrentRole('admin');
                    }
                }
            } catch (err) {
                console.error("Auth Init Error:", err);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        // Only run when tgUser is stable or we are sure it's not coming
        // A simple timeout might be needed if SDK takes time to inject, but hook handles it well usually
        initAuth();
    }, [tgUser]);

    const switchRole = (role) => {
        setCurrentRole(role);
        // Maybe update profile in DB if needed, or just local state for testing
    };

    return (
        <RoleContext.Provider value={{ currentRole, currentUser, switchRole, isLoading, error }}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = () => {
    const context = useContext(RoleContext);
    if (!context) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
};