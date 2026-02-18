// background.js - Keep Alive Mechanism
console.log("!!! Background Service Worker Started !!!");

// Пинг каждые 20 секунд, чтобы Chrome не убивал процесс
setInterval(() => {
    console.log("ping (keep-alive)");
    // Можно делать легкий fetch к чему-нибудь или просто лог
}, 20000);

const SUPABASE_URL = 'https://ozrpmpwnfrimjjrjsfms.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96cnBtcHduZnJpbWpqcmpzZm1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjUzMzksImV4cCI6MjA4Njk0MTMzOX0.duUFlxQQ8afUmI7Bj0KtEY7bJkvfvsLZSwQ1aZzT1r4';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SYNC_APPOINTMENT') {
        const appointment = message.payload;
        // Force external_id to string just to be safe
        appointment.external_id = String(appointment.external_id);

        console.log("!!! BRIDGE STEP 3: Attempting Supabase POST for ID:", appointment.external_id);

        // RPC Call to 'upsert_appointment_via_dikidi'
        const rpcPayload = {
            p_external_id: String(appointment.external_id),
            p_client_name: appointment.client_name,
            p_service_name: appointment.service_name,
            p_service_price: appointment.service_price,
            p_status: appointment.status,
            p_appointment_time: appointment.appointment_time,
            p_dikidi_master_id: appointment.master_id ? String(appointment.master_id) : null,
            p_debug_date: appointment.debug_date || null
        };

        fetch(`${SUPABASE_URL}/rest/v1/rpc/upsert_appointment_via_dikidi`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal' // We don't need the full object back
            },
            body: JSON.stringify(rpcPayload)
        })
            .then(async response => {
                console.log("Supabase RPC Status:", response.status);
                if (!response.ok) {
                    const text = await response.text();
                    console.error("Supabase RPC Error:", text);
                } else {
                    console.log("Dikidi Bridge: RPC Sync Success for", appointment.external_id);
                }
            })
            .catch(error => {
                console.error("Dikidi Bridge: Network/Fetch Failed", error);
            });

        return true;
    }
});
