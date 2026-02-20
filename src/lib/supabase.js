import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Локальное хранилище для нашего кастомного токена
let customAccessToken = null;

// Экспортируем функцию, которая будет "заряжать" клиент токеном
export const setSupabaseToken = (token) => {
    customAccessToken = token;
    // Сразу авторизуем движок WebSockets (понадобится нам для Realtime)
    supabase.realtime.setAuth(token);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        fetch: (url, options) => {
            // Перехватываем запрос: если у нас есть токен от Воркера, вставляем его в заголовок
            if (customAccessToken) {
                const headers = new Headers(options?.headers);
                headers.set('Authorization', `Bearer ${customAccessToken}`);
                return fetch(url, { ...options, headers });
            }
            return fetch(url, options);
        }
    }
});