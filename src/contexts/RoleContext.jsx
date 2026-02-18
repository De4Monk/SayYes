import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
            try {
                // Wait for TG to be ready if possible, but we rely on the hook

                if (tgUser) {
                    console.log("Telegram User Detected via Hook:", tgUser);

                    // 2. Fetch Profile from Supabase
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('telegram_id', tgUser.id)
                        .single();

                    if (error) {
                        console.error("Error fetching profile:", error);
                        // If profile is missing, we might want to create one or handle it
                    } else if (profile) {
                        console.log("Profile Loaded:", profile);
                        setCurrentUser(profile);
                        if (profile.role) {
                            setCurrentRole(profile.role);
                        }
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
