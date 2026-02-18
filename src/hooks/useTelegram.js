import { useEffect, useState } from 'react';

export function useTelegram() {
    const [tg, setTg] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (window.Telegram?.WebApp) {
            const webApp = window.Telegram.WebApp;
            setTg(webApp);

            // Notify Telegram that the Mini App is ready
            webApp.ready();
            webApp.expand(); // Optional: expand to full height

            // Set User
            if (webApp.initDataUnsafe?.user) {
                setUser(webApp.initDataUnsafe.user);
            }

            // Sync Theme & Viewport
            // console.log("Telegram WebApp Initialized", webApp);
        } else {
            // console.warn("Telegram WebApp not detected");
        }
    }, []);

    const onClose = () => {
        tg?.close();
    };

    const onToggleButton = () => {
        if (tg?.MainButton?.isVisible) {
            tg.MainButton.hide();
        } else {
            tg?.MainButton.show();
        }
    };

    return {
        onClose,
        onToggleButton,
        tg,
        user,
        queryId: tg?.initDataUnsafe?.query_id,
    };
}
