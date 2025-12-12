
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function audit() {
    console.log("═════════════════════════════════════════");
    console.log("      GLOBAL PRICING AUDIT REPORT      ");
    console.log("═════════════════════════════════════════\n");

    // 1. Check Locations
    console.log("1. LOCATIONS CHECK");
    const { data: locations, error: locError } = await supabase
        .from('locations')
        .select('id, name, type, status')
        .order('name');

    if (locError) console.error("❌ Error:", locError.message);
    else {
        console.log(`✅ Found ${locations?.length} locations.`);
        const targetNames = ['China', 'Chine', 'Senegal', 'Sénégal', 'Senegal (SN)'];
        const foundTargets = locations?.filter(l => targetNames.includes(l.name));
        console.log("   Target Locations present:", foundTargets?.map(l => `${l.name} (${l.id})`));
    }

    // 2. Check Forwarders
    console.log("\n2. FORWARDERS CHECK");
    const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, company_name, first_name, last_name')
        .eq('role', 'forwarder');

    if (profError) console.error("❌ Error:", profError.message);
    else {
        console.log(`✅ Found ${profiles?.length} forwarders.`);
        profiles?.forEach(p => console.log(`   - [${p.id}] ${p.company_name || p.first_name + ' ' + p.last_name}`));
    }

    // 3. Check Rates
    console.log("\n3. RATES CHECK");
    const { data: rates, error: rateError } = await supabase
        .from('forwarder_rates')
        .select(`
            *,
            origin:origin_id(name),
            destination:destination_id(name),
            forwarder:forwarder_id(company_name)
        `);

    if (rateError) console.error("❌ Error:", rateError.message);
    else {
        console.log(`✅ Found ${rates?.length} total rates.`);

        // Group by Forwarder
        const ratesByFwd = rates?.reduce((acc: any, rate: any) => {
            const name = rate.forwarder?.company_name || rate.forwarder_id;
            if (!acc[name]) acc[name] = 0;
            acc[name]++;
            return acc;
        }, {});

        console.log("   Rates per Forwarder:", ratesByFwd);

        // Check for specific route: China -> Senegal
        const chinaIds = locations?.filter(l => ['China', 'Chine'].includes(l.name)).map(l => l.id) || [];
        const senegalIds = locations?.filter(l => ['Senegal', 'Sénégal', 'Senegal (SN)'].includes(l.name)).map(l => l.id) || [];

        const validRates = rates?.filter(r =>
            chinaIds.includes(r.origin_id) && senegalIds.includes(r.destination_id)
        );

        console.log(`\n   Matching Rates for China -> Senegal: ${validRates?.length}`);
        validRates?.forEach(r => {
            console.log(`   -> [${r.forwarder?.company_name}] ${r.mode} (${r.type}): ${r.price} ${r.currency}/${r.unit} (Origin: ${r.origin?.name} -> Dest: ${r.destination?.name})`);
        });

        if (validRates?.length === 0) {
            console.warn("⚠️  CRITICAL: No rates found for China -> Senegal route despite aliases.");
            console.log("   Orphan Rates (Null Origin/Dest):", rates?.filter(r => !r.origin_id || !r.destination_id).length);
        }
    }
}

audit();
