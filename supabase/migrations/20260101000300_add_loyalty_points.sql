-- Add loyalty points to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;
-- Add tier column (Bronze, Silver, Gold, Platinum)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'Bronze';
-- Create a function to automatically calculate tier based on points
CREATE OR REPLACE FUNCTION public.calculate_loyalty_tier() RETURNS TRIGGER AS $$ BEGIN IF NEW.loyalty_points >= 10000 THEN NEW.tier := 'Platinum';
ELSIF NEW.loyalty_points >= 5000 THEN NEW.tier := 'Gold';
ELSIF NEW.loyalty_points >= 1000 THEN NEW.tier := 'Silver';
ELSE NEW.tier := 'Bronze';
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger to update tier on points change
DROP TRIGGER IF EXISTS update_loyalty_tier ON public.profiles;
CREATE TRIGGER update_loyalty_tier BEFORE
UPDATE OF loyalty_points ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.calculate_loyalty_tier();