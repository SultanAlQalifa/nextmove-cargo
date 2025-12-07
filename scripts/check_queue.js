/* eslint-env node */
import { createClient } from '@supabase/supabase-js';

// Hardcoded for debugging since dotenv is not working/installed in this context
const supabaseUrl = 'https://dkbnmnpxoesvkbnwuyle.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYm5tbnB4b2Vzdmtibnd1eWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NjczNTgsImV4cCI6MjA3OTM0MzM1OH0.SG55XueWugfWVPwDC337KnmV_ARTcJijysab6n4_vS8'; // Anon Key
// Note: Anon key might not have permission to read email_queue depending on RLS.
// Ideally usage of SERVICE_ROLE_KEY if available in env, but usually not in local .env for security.
// Let's try with what we have. If RLS blocks, we might need a service key or valid user session.

// Actually, for local dev, we often have the service key in .env or we can just try.
// If this fails, I'll need another way.

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1); // eslint-disable-line no-undef
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQueue() {
    const { data, error } = await supabase
        .from('email_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
    } else {
        console.table(data.map(d => ({
            id: d.id,
            subject: d.subject,
            status: d.status,
            error: d.error_message,
            created: d.created_at
        })));
    }
}

checkQueue();
