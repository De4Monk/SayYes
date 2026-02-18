import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
    const [currentRole, setCurrentRole] = useState('master'); // Default to master until loaded
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true);
            try {
                // 1. Get Telegram User
                const tg = window.Telegram?.WebApp;
                const tgUser = tg?.initDataUnsafe?.user;

                if (tgUser) {
                    console.log("Telegram User Detected:", tgUser);

                    // 2. Fetch Profile from Supabase
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('telegram_id', tgUser.id)
                        .single();

                    if (error) {
                        console.error("Error fetching profile:", error);
                        // Handle case where profile doesn't exist? 
                        // Maybe create a guest profile or just stay as default 'master' for dev?
                    } else if (profile) {
                        console.log("Profile Loaded:", profile);
                        setCurrentUser(profile);
                        if (profile.role) {
                            setCurrentRole(profile.role);
                        }
                    }
                } else {
                    console.log("No Telegram User detected. Running in Dev/Browser mode?");
                    // Optional: Check for local storage dev override
                }
            } catch (err) {
                console.error("Auth Init Error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const switchRole = (role) => {
        setCurrentRole(role);
        // Maybe update profile in DB if needed, or just local state for testing
    };

    return (
        <RoleContext.Provider value={{ currentRole, currentUser, switchRole, isLoading }}>
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
