-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Academy System Database Schema
-- ═══════════════════════════════════════════════════════════════
-- ═══ ENUMS ═══
-- Type de leçon
DO $$ BEGIN CREATE TYPE lesson_type AS ENUM ('video', 'audio', 'pdf', 'text');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- ═══ TABLE: academy_courses ═══
CREATE TABLE IF NOT EXISTS academy_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    category TEXT DEFAULT 'E-commerce',
    cover_image_url TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
-- ═══ TABLE: academy_lessons ═══
CREATE TABLE IF NOT EXISTS academy_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES academy_courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    type lesson_type DEFAULT 'text' NOT NULL,
    content TEXT,
    -- HTML content for text lessons
    url TEXT,
    -- Blob URL placeholder or direct link
    file_name TEXT,
    -- Original filename for display
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
-- ═══ TABLE: academy_enrollments (Future feature) ═══
CREATE TABLE IF NOT EXISTS academy_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES academy_courses(id) ON DELETE CASCADE NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    progress JSONB DEFAULT '[]'::jsonb,
    -- Completed lesson IDs
    certified_at TIMESTAMP WITH TIME ZONE,
    certificate_url TEXT,
    last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, course_id)
);
-- ═══ ROW LEVEL SECURITY (RLS) ═══
ALTER TABLE academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_enrollments ENABLE ROW LEVEL SECURITY;
-- Policies for academy_courses
CREATE POLICY "Anyone can view published courses" ON academy_courses FOR
SELECT USING (status = 'published');
CREATE POLICY "Admins can manage all courses" ON academy_courses FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin', 'support', 'manager')
    )
);
-- Policies for academy_lessons
CREATE POLICY "Students can view lessons of enrolled courses" ON academy_lessons FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM academy_enrollments
            WHERE user_id = auth.uid()
                AND course_id = academy_lessons.course_id
        )
        OR EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'super-admin', 'support', 'manager')
        )
    );
CREATE POLICY "Admins can manage all lessons" ON academy_lessons FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin', 'support', 'manager')
    )
);
-- Policies for academy_enrollments
CREATE POLICY "Users can view own enrollments" ON academy_enrollments FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all enrollments" ON academy_enrollments FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin', 'support', 'manager')
    )
);
-- ═══ UPDATED_AT TRIGGER ═══
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS tr_academy_courses_updated_at ON academy_courses;
CREATE TRIGGER tr_academy_courses_updated_at BEFORE
UPDATE ON academy_courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS tr_academy_lessons_updated_at ON academy_lessons;
CREATE TRIGGER tr_academy_lessons_updated_at BEFORE
UPDATE ON academy_lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ═══ STORAGE BUCKET ═══
-- Insert into storage.buckets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('academy-content', 'academy-content', true) ON CONFLICT (id) DO NOTHING;
-- RLS for Storage (simplified for mvp)
CREATE POLICY "Public Access for Academy Content" ON storage.objects FOR
SELECT TO public USING (bucket_id = 'academy-content');
CREATE POLICY "Admin Upload for Academy Content" ON storage.objects FOR ALL TO authenticated USING (
    bucket_id = 'academy-content'
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin', 'support', 'manager')
    )
);
-- ═══ RPC: trigger_academy_reminder ═══
CREATE OR REPLACE FUNCTION trigger_academy_reminder(enrollment_id UUID) RETURNS VOID AS $$
DECLARE v_user_email TEXT;
v_user_name TEXT;
v_course_title TEXT;
v_admin_id UUID;
BEGIN -- Get enrollment details
SELECT p.email,
    p.full_name,
    c.title,
    auth.uid() INTO v_user_email,
    v_user_name,
    v_course_title,
    v_admin_id
FROM academy_enrollments e
    JOIN profiles p ON p.id = e.user_id
    JOIN academy_courses c ON c.id = e.course_id
WHERE e.id = enrollment_id;
-- Insert into email_queue
INSERT INTO public.email_queue (
        sender_id,
        subject,
        body,
        recipient_group,
        recipient_emails,
        status,
        metadata
    )
VALUES (
        v_admin_id,
        'Rappel : Votre progression dans le cours ' || v_course_title,
        'Bonjour ' || COALESCE(v_user_name, 'Étudiant') || ', nous avons remarqué que vous n''avez pas progressé récemment dans votre cours "' || v_course_title || '". N''hésitez pas à vous replonger dedans pour atteindre vos objectifs !',
        'specific',
        jsonb_build_array(v_user_email),
        'pending',
        jsonb_build_object(
            'type',
            'academy_reminder',
            'enrollment_id',
            enrollment_id
        )
    );
-- Update last reminder timestamp
UPDATE academy_enrollments
SET last_reminder_sent_at = NOW()
WHERE id = enrollment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;