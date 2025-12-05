
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dkbnmnpxoesvkbnwuyle.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYm5tbnB4b2Vzdmtibnd1eWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NjczNTgsImV4cCI6MjA3OTM0MzM1OH0.SG55XueWugfWVPwDC337KnmV_ARTcJijysab6n4_vS8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUsers() {
    console.log('Creating test users...');

    // 1. Create Client
    const { data: clientData, error: clientError } = await supabase.auth.signUp({
        email: 'nextemove.demo.client@gmail.com',
        password: 'password123',
        options: {
            data: {
                full_name: 'Test Client',
                role: 'client'
            }
        }
    });

    if (clientError) {
        console.error('Error creating client:', clientError);
    } else {
        console.log('Client created:', clientData.user?.email);
    }

    // 2. Create Forwarder
    const { data: forwarderData, error: forwarderError } = await supabase.auth.signUp({
        email: 'nextemove.demo.forwarder@gmail.com',
        password: 'password123',
        options: {
            data: {
                full_name: 'FastForward Logistics',
                role: 'forwarder',
                company_name: 'FastForward Logistics'
            }
        }
    });

    if (forwarderError) {
        console.error('Error creating forwarder:', forwarderError.message);
    } else {
        console.log('Forwarder created:', forwarderData.user?.email);
    }
}

createUsers();
