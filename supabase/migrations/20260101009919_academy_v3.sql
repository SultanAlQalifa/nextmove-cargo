-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Academy v3 (Replies, Quizzes, Verified Certificates)
-- ═══════════════════════════════════════════════════════════════
-- 1. Add parent_id to comments for replies
ALTER TABLE public.academy_lesson_comments
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.academy_lesson_comments(id) ON DELETE CASCADE;
-- 2. Quizzes Table
CREATE TABLE IF NOT EXISTS public.academy_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES public.academy_lessons(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    passing_score INTEGER DEFAULT 80,
    -- percentage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(lesson_id)
);
-- 3. Quiz Questions Table
CREATE TABLE IF NOT EXISTS public.academy_quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.academy_quizzes(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
-- 4. Quiz Options Table
CREATE TABLE IF NOT EXISTS public.academy_quiz_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES public.academy_quiz_questions(id) ON DELETE CASCADE NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL
);
-- 5. Student Quiz Results (to track passing)
CREATE TABLE IF NOT EXISTS public.academy_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    quiz_id UUID REFERENCES public.academy_quizzes(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL,
    -- percentage
    passed BOOLEAN NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
-- 6. RLS for new tables
ALTER TABLE public.academy_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_quiz_attempts ENABLE ROW LEVEL SECURITY;
-- Select policies
CREATE POLICY "Anyone can see quizzes" ON public.academy_quizzes FOR
SELECT USING (true);
CREATE POLICY "Anyone can see questions" ON public.academy_quiz_questions FOR
SELECT USING (true);
CREATE POLICY "Anyone can see options" ON public.academy_quiz_options FOR
SELECT USING (true);
CREATE POLICY "Users can see own attempts" ON public.academy_quiz_attempts FOR
SELECT USING (auth.uid() = user_id);
-- Admin policies
CREATE POLICY "Admins can manage quizzes" ON public.academy_quizzes FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
CREATE POLICY "Admins can manage quiz questions" ON public.academy_quiz_questions FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
CREATE POLICY "Admins can manage quiz options" ON public.academy_quiz_options FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
-- 7. Initialize Email Templates in system_settings if not exist
INSERT INTO public.system_settings (key, value, description)
VALUES (
        'academy_email_certificate',
        '{"subject": "Félicitations ! Votre certificat NextMove est prêt", "body": "Bravo ! Vous avez complété avec succès votre formation. Vous trouverez en pièce jointe votre certificat officiel de NextMove Académie."}',
        'Template pour l''envoi de certificat'
    ),
    (
        'academy_email_reminder',
        '{"subject": "Revenez finir votre formation sur NextMove Académie !", "body": "Bonjour, nous avons remarqué que vous n''avez pas progressé récemment..."}',
        'Template pour le rappel d''inactivité'
    ) ON CONFLICT (key) DO NOTHING;
-- Triggers for updated_at
CREATE TRIGGER tr_academy_quizzes_updated_at BEFORE
UPDATE ON public.academy_quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();