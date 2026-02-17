// background.js

const SUPABASE_URL = 'https://ozrpmpwnfrimjjrjsfms.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96cnBtcHduZnJpbWpqcmpzZm1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjUzMzksImV4cCI6MjA4Njk0MTMzOX0.duUFlxQQ8afUmI7Bj0KtEY7bJkvfvsLZSwQ1aZzT1r4';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SYNC_APPOINTMENT') {
        const appointment = message.payload;

        console.log("Dikidi Bridge Background: Syncing...", appointment);

        fetch(`${SUPABASE_URL}/rest/v1/appointments`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates' // Upsert behavior (requires unique constraint on external_id)
            },
            body: JSON.stringify(appointment)
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => { throw new Error(text) });
                }
                console.log("Dikidi Bridge: Sync Success");
            })
            .catch(error => {
                console.error("Dikidi Bridge: Sync Failed", error);
            });

        return true; // Keep message channel open for async response if needed
    }
});
