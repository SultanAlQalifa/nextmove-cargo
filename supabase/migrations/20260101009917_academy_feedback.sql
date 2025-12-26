-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Academy Feedback System (Reviews, Likes, Notes)
-- ═══════════════════════════════════════════════════════════════
-- TABLE: academy_reviews (Course level)
CREATE TABLE IF NOT EXISTS academy_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES academy_courses(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (
        rating >= 1
        AND rating <= 5
    ),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(course_id, user_id)
);
-- TABLE: academy_lesson_likes (Lesson level)
CREATE TABLE IF NOT EXISTS academy_lesson_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES academy_lessons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(lesson_id, user_id)
);
-- TABLE: academy_lesson_comments (Lesson level discussion)
CREATE TABLE IF NOT EXISTS academy_lesson_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES academy_lessons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
-- RLS
ALTER TABLE academy_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_lesson_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_lesson_comments ENABLE ROW LEVEL SECURITY;
-- Policies: academy_reviews
CREATE POLICY "Anyone can view reviews" ON academy_reviews FOR
SELECT USING (true);
CREATE POLICY "Authenticated users can review courses" ON academy_reviews FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON academy_reviews FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users or admins can delete reviews" ON academy_reviews FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
-- Policies: academy_lesson_likes
CREATE POLICY "Anyone can see likes" ON academy_lesson_likes FOR
SELECT USING (true);
CREATE POLICY "Authenticated users can like lessons" ON academy_lesson_likes FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike lessons" ON academy_lesson_likes FOR DELETE USING (auth.uid() = user_id);
-- Policies: academy_lesson_comments
CREATE POLICY "Anyone can see lesson comments" ON academy_lesson_comments FOR
SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON academy_lesson_comments FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can edit their own comments" ON academy_lesson_comments FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users or admins can delete comments" ON academy_lesson_comments FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin', 'support')
    )
);
-- Triggers for updated_at
CREATE TRIGGER tr_academy_reviews_updated_at BEFORE
UPDATE ON academy_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_academy_lesson_comments_updated_at BEFORE
UPDATE ON academy_lesson_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();