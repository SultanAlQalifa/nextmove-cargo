#!/bin/bash

# ==============================================================================
# NextMove Cargo - Production Readiness Checklist
# This script verifies the state of the production Supabase project including
# Migrations, Seed Data (Loyalty Tiers), and Edge Functions.
# ==============================================================================

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[1;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}===================================================${NC}"
echo -e "${CYAN}🚀 NEXTMOVE CARGO - PRODUCTION CHECKLIST 🚀${NC}"
echo -e "${CYAN}===================================================${NC}"
echo ""

# Ensure we are logged in or link is established, otherwise these commands might fail
# Usually, running 'npx supabase status' checks if it's reachable. We assume the dev has set up `npx supabase link`

# ------------------------------------------------------------------------------
# 1. VERIFY MIGRATIONS (Local vs Applied)
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[1/3] Checking Database Migrations...${NC}"
MIGRATION_STATUS=$(npx supabase migration list 2>&1)

# Check if there are any pending migrations (usually marked with "Pending" or simply if local count != remote count)
if echo "$MIGRATION_STATUS" | grep -q 'Local migrations not found in remote\|Pending'; then
    echo -e "${RED}❌ Migrations: Some local migrations are NOT applied to production.${NC}"
    # Print a glimpse to help the dev
    echo "$MIGRATION_STATUS" | grep -E "Local migrations not found in remote|Pending" -A 5
else
    echo -e "${GREEN}✅ Migrations: All local migrations are successfully applied.${NC}"
fi
echo ""

# ------------------------------------------------------------------------------
# 2. VERIFY LOYALTY TIERS (Seed Data)
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[2/3] Checking Seed Data (Loyalty Tiers)...${NC}"

# We execute a raw SQL query via Supabase CLI to get the count
TIER_COUNT=$(npx supabase db query "SELECT count(*) FROM loyalty_tiers;" --csv 2>/dev/null | tail -n 1 | tr -d '\r' | tr -d ' ')

# Safeguard against empty or non-numeric values
if ! [[ "$TIER_COUNT" =~ ^[0-9]+$ ]]; then
    TIER_COUNT=0
fi

if [ "$TIER_COUNT" -eq 4 ]; then
    echo -e "${GREEN}✅ Loyalty Tiers: 4 levels found successfully.${NC}"
else
    if [ "$TIER_COUNT" -eq 0 ]; then
        echo -e "${RED}❌ Loyalty Tiers: Unable to query database or table does not exist/is empty.${NC}"
    else
        echo -e "${RED}❌ Loyalty Tiers: Found ${TIER_COUNT} levels instead of 4.${NC}"
    fi
fi
echo ""

# ------------------------------------------------------------------------------
# 3. VERIFY EDGE FUNCTIONS
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[3/3] Checking Edge Functions...${NC}"

# We count the number of local folders as a baseline
EXPECTED_FUNCTIONS=$(ls -1d supabase/functions/*/ 2>/dev/null | wc -l | tr -d ' ')

echo -e "➔ Found ${EXPECTED_FUNCTIONS} functions locally in supabase/functions/"

# List all functions deployed
FUNCTIONS_OUTPUT=$(npx supabase functions list 2>&1 || true)

# Count how many URLs or specific deployed indicators show up in 'npx supabase functions list'
DEPLOYED_COUNT=$(echo "$FUNCTIONS_OUTPUT" | grep -c 'https://')

if [ "$EXPECTED_FUNCTIONS" -eq 0 ]; then
     echo -e "${YELLOW}⚠️ Warning: No local edge functions found in supabase/functions/. Expected at least 18.${NC}"
elif [ "$DEPLOYED_COUNT" -ge "$EXPECTED_FUNCTIONS" ]; then
    echo -e "${GREEN}✅ Edge Functions: Expected ${EXPECTED_FUNCTIONS} functions are deployed.${NC}"
else
    echo -e "${RED}❌ Edge Functions: Only ${DEPLOYED_COUNT} out of ${EXPECTED_FUNCTIONS} functions seem to be deployed.${NC}"
    echo "Tip: Run 'npx supabase functions deploy' to push all functions."
fi
echo ""

# ==============================================================================
echo -e "${CYAN}===================================================${NC}"
echo -e "🎉 CHECK COMPLETE. Review the above steps."
echo -e "${CYAN}===================================================${NC}"
