// background.js - Keep Alive Mechanism
console.log("!!! Background Service Worker Started !!!");

// Пинг каждые 20 секунд
setInterval(() => {
    console.log("ping (keep-alive)");
}, 20000);

const SUPABASE_URL = 'https://ozrpmpwnfrimjjrjsfms.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96cnBtcHduZnJpbWpqcmpzZm1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjUzMzksImV4cCI6MjA4Njk0MTMzOX0.duUFlxQQ8afUmI7Bj0KtEY7bJkvfvsLZSwQ1aZzT1r4';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
   
    if (message.type === 'SYNC_APPOINTMENT' || message.type === 'DIKIDI_DATA') { 
        
        const appointment = message.payload;
        appointment.external_id = String(appointment.external_id);

        console.log("!!! BRIDGE STEP 3: Attempting Supabase POST for ID:", appointment.external_id, "Price:", appointment.service_price);

        const rpcPayload = {
            external_id: String(appointment.external_id),
            client_name: appointment.client_name,
            client_phone: appointment.client_phone, // Добавил телефон, если он есть
            service_name: appointment.service_name,
            service_price: Number(appointment.service_price), // Гарантируем число
            status: appointment.status,
            
            // Пробуем оба варианта времени (функция в БД "всеядная")
            appointment_time: appointment.appointment_time || appointment.start_time,
            start_time: appointment.appointment_time || appointment.start_time, 
            
            master_id: appointment.master_id ? String(appointment.master_id) : null,
            master_dikidi_id: appointment.master_id ? String(appointment.master_id) : null
        };
        // --------------------------------

        fetch(`${SUPABASE_URL}/rest/v1/rpc/upsert_appointment_via_dikidi`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(rpcPayload)
        })
            .then(async response => {
                if (!response.ok) {
                    const text = await response.text();
                    console.error("Supabase RPC Error:", response.status, text);
                } else {
                    console.log("✅ Dikidi Bridge: RPC Sync Success for", appointment.external_id);
                }
            })
            .catch(error => {
                console.error("Dikidi Bridge: Network/Fetch Failed", error);
            });

        return true;
    }
});
