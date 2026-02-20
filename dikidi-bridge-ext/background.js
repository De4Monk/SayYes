// background.js - Multi-tenant Version
console.log("!!! Background Service Worker Started (Multi-tenant Mode) !!!");

setInterval(() => console.log("ping"), 20000);

const SUPABASE_URL = 'https://ozrpmpwnfrimjjrjsfms.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96cnBtcHduZnJpbWpqcmpzZm1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjUzMzksImV4cCI6MjA4Njk0MTMzOX0.duUFlxQQ8afUmI7Bj0KtEY7bJkvfvsLZSwQ1aZzT1r4';

// ВСТАВЬ СЮДА UUID САЛОНА ИЗ ТАБЛИЦЫ tenants (Например: '123e4567-e89b-12d3-a456-426614174000')
const TENANT_ID = '38925e3b-6047-4baf-b8f0-764336822231'; 

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SYNC_APPOINTMENT' || message.type === 'DIKIDI_SYNC_EVENT') {
        
        const rawData = message.payload || message.detail;
        if (!rawData) return;

        // Формируем плоский объект, где ключи = аргументы функции в Postgres
        const rpcBody = {
            p_tenant_id: TENANT_ID,
            p_sync_secret: 'MySuperSecretKey2026', 
            p_external_id: String(rawData.external_id),
            p_client_name: rawData.client_name,
            p_client_phone: rawData.client_phone || null,
            p_service_name: rawData.service_name,
            p_service_price: Number(rawData.service_price),
            p_start_time: rawData.appointment_time || rawData.start_time,
            p_status: rawData.status,
            p_master_id: String(rawData.master_id || rawData.master_dikidi_id)
        };

        console.log(`Sending Data. ID: ${rpcBody.p_external_id}, Price: ${rpcBody.p_service_price}`);

        fetch(`${SUPABASE_URL}/rest/v1/rpc/upsert_appointment_via_dikidi`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(rpcBody) 
        })
        .then(async res => {
            if (res.ok) console.log("✅ DB Success!");
            else console.error("❌ DB Error:", await res.text());
        })
        .catch(err => console.error("❌ Network Error:", err));

        return true;
    }
});
