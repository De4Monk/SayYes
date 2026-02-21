import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testWhatsApp() {
    console.log('--- Starting WhatsApp Test ---');

    // 1. Get a random active tenant
    const { data: tenant } = await supabase.from('tenants').select('*').limit(1).single();
    if (!tenant) throw new Error('No tenant found');
    console.log(`Using tenant: ${tenant.id}`);

    // 2. Ensure an integration exists
    const { data: profile } = await supabase.from('profiles').select('id').eq('tenant_id', tenant.id).limit(1).single();
    if (profile) {
        await supabase.from('salon_integrations')
            .upsert({
                owner_profile_id: profile.id,
                tenant_id: tenant.id,
                green_api_id_instance: 'test_instance_123',
                green_api_token: 'test_token_abc'
            }, { onConflict: 'owner_profile_id' });
    }

    // 3. Create a dummy client
    const { data: client, error: clErr } = await supabase.from('clients').insert({
        name: 'Test Client WA',
        phone: '89991234567',
        is_subscribed_wa: true,
        tenant_id: tenant.id
    }).select().single();
    if (clErr) throw new Error('Client creation failed: ' + clErr.message);

    // 4. Create a template if missing
    await supabase.from('notification_templates').upsert({
        type: 'test_wa_template',
        channel: 'whatsapp',
        message_text: 'Hello {{client_name}}, testing WhatsApp integration for {{salon_name}}'
    }, { onConflict: 'type' });

    // 5. Insert to queue
    const { data: task, error: tErr } = await supabase.from('notification_queue').insert({
        client_id: client.id,
        tenant_id: tenant.id,
        template_type: 'test_wa_template',
        channel: 'whatsapp',
        status: 'pending',
        scheduled_for: new Date().toISOString()
    }).select().single();

    if (tErr) throw new Error('Task creation failed: ' + tErr.message);

    console.log(`Task inserted: ${task.id}. Triggering queue processor...`);

    // 6. Trigger the internal endpoint (assuming worker is running on 3000 or similar, but since we just want to run the logic: let's start it or call ProcessTask directly, wait, let's start the server and run script, or just start server and hit curl)

    console.log('Test setup complete. Please check the sayyes-worker output.');
}

testWhatsApp().catch(console.error);
