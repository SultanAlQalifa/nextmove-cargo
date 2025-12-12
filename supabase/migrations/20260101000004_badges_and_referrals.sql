-- Migration: Badges and Referral System
-- 1. Client Tier Enum
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'client_tier'
) THEN CREATE TYPE public.client_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
END IF;
END $$;
-- 2. Update profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS client_tier public.client_tier DEFAULT 'bronze',
    ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
    ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS referral_points integer DEFAULT 0;
-- 3. Create referrals table for tracking history
CREATE TABLE IF NOT EXISTS public.referrals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id uuid NOT NULL REFERENCES public.profiles(id),
    referred_id uuid NOT NULL REFERENCES public.profiles(id),
    status text DEFAULT 'pending',
    -- pending, completed, rewarded
    points_earned integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(referred_id) -- One referral per user
);
-- 4. RLS for referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
CREATE POLICY "Users can view their own referrals" ON public.referrals FOR
SELECT USING (auth.uid() = referrer_id);
-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
-- 6. Trigger to auto-generate referral code if missing (Backup)
CREATE OR REPLACE FUNCTION public.generate_referral_code() RETURNS TRIGGER AS $$ BEGIN IF NEW.referral_code IS NULL THEN -- Generate simplistic code: 
    -- First 3 chars of name (or 'USR') + Random string
    NEW.referral_code := upper(
        substring(
            COALESCE(NEW.full_name, 'USR')
            from 1 for 3
        )
    ) || upper(
        substring(
            md5(random()::text)
            from 1 for 5
        )
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS ensure_referral_code ON public.profiles;
CREATE TRIGGER ensure_referral_code BEFORE
INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();