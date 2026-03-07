-- Migration: Tester Engagement & Feedback System
-- Description: Tables to track tester missions, feedback, and activity for Google Play compliance.
-- 1. Add is_tester to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_tester boolean DEFAULT false;
-- 2. Tester Missions Table
CREATE TABLE IF NOT EXISTS public.tester_missions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    link text NOT NULL,
    points_reward integer DEFAULT 100,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);
-- 3. Tester Activity Table (Track completions)
CREATE TABLE IF NOT EXISTS public.tester_activity (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    mission_id uuid NOT NULL REFERENCES public.tester_missions(id),
    completed_at timestamptz DEFAULT now(),
    UNIQUE(user_id, mission_id)
);
-- 4. Tester Feedback Table
CREATE TABLE IF NOT EXISTS public.tester_feedback (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    content text NOT NULL,
    type text DEFAULT 'bug',
    -- bug, suggestion, feedback
    status text DEFAULT 'pending',
    -- pending, reviewed, fixed, dismissed
    admin_response text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- 5. RLS Policies
ALTER TABLE public.tester_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tester_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tester_feedback ENABLE ROW LEVEL SECURITY;
-- Missions: Accessible to testers and admins
CREATE POLICY "Testers and admins can view missions" ON public.tester_missions FOR
SELECT USING (
        (
            SELECT is_tester
            FROM public.profiles
            WHERE id = (
                    select auth.uid()
                )
        ) = true
        OR public.is_admin()
    );
-- Activity: Testers can see/insert their own, admins see all
CREATE POLICY "Users can manage own activity" ON public.tester_activity FOR ALL USING (
    user_id = (
        select auth.uid()
    )
    OR public.is_admin()
) WITH CHECK (
    user_id = (
        select auth.uid()
    )
    OR public.is_admin()
);
-- Feedback: Testers manage own, admins see all
CREATE POLICY "Users can manage own feedback" ON public.tester_feedback FOR ALL USING (
    user_id = (
        select auth.uid()
    )
    OR public.is_admin()
) WITH CHECK (
    user_id = (
        select auth.uid()
    )
    OR public.is_admin()
);
-- 6. Trigger for feedback updated_at
DROP TRIGGER IF EXISTS set_tester_feedback_updated_at ON public.tester_feedback;
CREATE TRIGGER set_tester_feedback_updated_at BEFORE
UPDATE ON public.tester_feedback FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- 7. Seed initial missions
INSERT INTO public.tester_missions (title, description, link, points_reward)
VALUES (
        'Première Connexion',
        'Explorez votre nouveau dashboard de testeur.',
        '/dashboard'
    ),
    (
        'Simuler une Expédition',
        'Utilisez le formulaire pour créer une expédition fictive.',
        '/dashboard/client/create-shipment'
    ),
    (
        'Vérifier vos Points',
        'Consultez votre centre de test pour voir vos points earnés.',
        '/dashboard/tester/dashboard'
    ),
    (
        'Laisser un Avis',
        'Envoyez un feedback via le centre de test.',
        '/dashboard/tester/dashboard'
    ) ON CONFLICT DO NOTHING;