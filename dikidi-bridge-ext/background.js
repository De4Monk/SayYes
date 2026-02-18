// background.js

const SUPABASE_URL = 'https://ozrpmpwnfrimjjrjsfms.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96cnBtcHduZnJpbWpqcmpzZm1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjUzMzksImV4cCI6MjA4Njk0MTMzOX0.duUFlxQQ8afUmI7Bj0KtEY7bJkvfvsLZSwQ1aZzT1r4';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SYNC_APPOINTMENT') {
        const appointment = message.payload;
        // Force external_id to string just to be safe
        appointment.external_id = String(appointment.external_id);

        console.log("!!! BRIDGE STEP 3: Attempting Supabase POST for ID:", appointment.external_id);

        fetch(`${SUPABASE_URL}/rest/v1/appointments`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(appointment)
        })
            .then(async response => {
                console.log("Supabase HTTP Status:", response.status);
                const text = await response.text();
                console.log("Supabase Response Body:", text);

                if (!response.ok) {
                    console.error("Supabase Error:", text);
                } else {
                    console.log("Dikidi Bridge: Sync Success for", appointment.external_id);
                }
            })
            .catch(error => {
                console.error("Dikidi Bridge: Network/Fetch Failed", error);
            });

        return true;
    }
});
