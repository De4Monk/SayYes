import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { Text } from '../atoms/Typography';
import { User, LogOut } from 'lucide-react';

export const DevAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check active session
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async () => {
        setLoading(true);
        const email = 'master@test.com';
        const password = 'password123';

        try {
            // Try to sign in
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                // If sign in fails, try to sign up
                console.log('Login failed, attempting sign up...');
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (signUpError) throw signUpError;
            }

            // Ensure profile exists (RLS might block this if not careful, but public profiles RLS is open for select)
            // For insert to usage_logs, we need to match auth.uid(). 
            // Ideally, a trigger creates the profile, but for now we ignore profile creation if not strictly needed for usage_logs foreign key 
            // WAIT: schema says master_id references profiles(id). We MUST have a profile.

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Check if profile exists, if not create it
                const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();

                if (!profile) {
                    await supabase.from('profiles').insert({
                        id: user.id,
                        role: 'master',
                        telegram_id: 'test_dev_user',
                        native_name: 'Dev Master'
                    });
                }
            }

        } catch (error) {
            console.error('Auth Error:', error.message);
            alert('Auth Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (user) {
        return (
            <div className="fixed bottom-24 right-4 z-50">
                <div className="bg-zinc-800 text-white p-2 rounded-full shadow-lg flex items-center gap-2 pr-4">
                    <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                        <User size={16} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase text-zinc-400">Logged In</span>
                        <span className="text-xs font-bold">{user.email?.split('@')[0]}</span>
                    </div>
                    <button onClick={handleLogout} className="ml-2 p-1 hover:bg-white/10 rounded-full">
                        <LogOut size={14} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-24 right-4 z-50">
            <Button
                onClick={handleLogin}
                disabled={loading}
                className="shadow-2xl shadow-primary/50 text-xs px-4 py-2 h-auto"
            >
                {loading ? 'Connecting...' : 'Dev Login'}
            </Button>
        </div>
    );
};
