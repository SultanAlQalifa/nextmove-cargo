import { supabase } from "../lib/supabase";
import { AcademyCourse, AcademyLesson, AcademyReview, AcademyLessonComment, AcademyEnrollment, AcademyQuiz } from "../types/academy";

export const academyService = {
    /**
     * Fetches all courses with their basic info
     */
    async getCourses(): Promise<AcademyCourse[]> {
        const { data, error } = await supabase
            .from('academy_courses')
            .select('*, academy_lessons(id), academy_enrollments(id), academy_reviews(rating)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Process data to include stats
        return (data as any[]).map(course => {
            const enrollmentsCount = course.academy_enrollments?.length || 0;
            const ratings = course.academy_reviews || [];
            const avgRating = ratings.length > 0
                ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
                : 0;

            return {
                ...course,
                students: enrollmentsCount,
                rating: avgRating
            };
        });
    },

    /**
     * Fetches a single course by ID with its lessons
     */
    async getCourseById(courseId: string): Promise<AcademyCourse> {
        const { data, error } = await supabase
            .from('academy_courses')
            .select('*, academy_lessons(*)')
            .eq('id', courseId)
            .single();

        if (error) throw error;
        return data as AcademyCourse;
    },

    /**
     * Creates or updates a course and its lessons
     */
    async saveCourse(course: Partial<AcademyCourse>, lessons: Array<Partial<AcademyLesson>>) {
        // 1. Save main course info
        const { data: savedCourse, error: courseError } = await supabase
            .from('academy_courses')
            .upsert({
                id: course.id || undefined,
                title: course.title,
                subtitle: course.subtitle,
                description: course.description,
                category: course.category,
                cover_image_url: course.cover_image_url,
                certificate_price: course.certificate_price,
                status: course.status || 'draft',
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (courseError) throw courseError;

        // 2. Handle lessons (Cascade deletion of old ones if we want to be simple, 
        // or update them if we want to be more granular. Let's do a simple replace logic for now)

        // For MVP: Delete existing lessons of this course and re-insert new ones
        if (course.id) {
            await supabase.from('academy_lessons').delete().eq('course_id', course.id);
        }

        if (lessons.length > 0) {
            const lessonsToInsert = lessons.map((lesson, index) => ({
                course_id: savedCourse.id,
                title: lesson.title,
                type: lesson.type,
                url: lesson.url,
                file_name: lesson.file_name,
                order_index: index,
                updated_at: new Date().toISOString()
            }));

            const { error: lessonsError } = await supabase
                .from('academy_lessons')
                .insert(lessonsToInsert);

            if (lessonsError) throw lessonsError;
        }

        return savedCourse;
    },

    /**
     * Deletes a course and its lessons (handled by CASCADE in DB)
     */
    async deleteCourse(courseId: string) {
        const { error } = await supabase
            .from('academy_courses')
            .delete()
            .eq('id', courseId);

        if (error) throw error;
    },

    /**
     * Update only the status of a course
     */
    async updateCourseStatus(courseId: string, status: AcademyCourse['status']) {
        const { error } = await supabase
            .from('academy_courses')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', courseId);

        if (error) throw error;
    },

    /**
     * Bulk delete courses
     */
    async deleteCourses(courseIds: string[]) {
        const { error } = await supabase
            .from('academy_courses')
            .delete()
            .in('id', courseIds);

        if (error) throw error;
    },

    /**
     * Bulk update course status
     */
    async updateCoursesStatus(courseIds: string[], status: AcademyCourse['status']) {
        const { error } = await supabase
            .from('academy_courses')
            .update({ status, updated_at: new Date().toISOString() })
            .in('id', courseIds);

        if (error) throw error;
    },

    /**
     * Upload a course asset (cover or lesson material)
     */
    async uploadAsset(file: File, type: 'cover' | 'lesson') {
        const fileExt = file.name.split('.').pop();
        const fileName = `${type}_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${type}/${fileName}`;

        const { error } = await supabase.storage
            .from('academy-content')
            .upload(filePath, file);

        if (error) throw error;

        const { data } = supabase.storage
            .from('academy-content')
            .getPublicUrl(filePath);

        return {
            url: data.publicUrl,
            fileName: file.name
        };
    },

    /**
     * Fetch reviews for a course
     */
    async getCourseReviews(courseId: string): Promise<AcademyReview[]> {
        const { data, error } = await supabase
            .from('academy_reviews')
            .select('*, profiles(full_name, avatar_url)')
            .eq('course_id', courseId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as any[];
    },

    /**
     * Fetch all reviews (for admin)
     */
    async getAllReviews(): Promise<any[]> {
        const { data, error } = await supabase
            .from('academy_reviews')
            .select('*, profiles(full_name, avatar_url), academy_courses(title)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as any[];
    },

    /**
     * Reorder lessons
     */
    async reorderLessons(lessonOrders: { id: string, order_index: number }[]) {
        const { error } = await supabase
            .from('academy_lessons')
            .upsert(lessonOrders.map(lo => ({ id: lo.id, order_index: lo.order_index })));

        if (error) throw error;
    },

    /**
     * Fetch all comments (for admin)
     */
    async getAdminComments(): Promise<any[]> {
        const { data, error } = await supabase
            .from('academy_lesson_comments')
            .select('*, profiles(full_name, avatar_url), academy_lessons(title, course_id, academy_courses(title))')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as any[];
    },

    /**
     * Get statistics
     */
    async getAcademyStats() {
        const { data: enrollments, error: enrollError } = await supabase
            .from('academy_enrollments')
            .select('certified_at, enrolled_at, course_id');

        if (enrollError) throw enrollError;

        return {
            totalStudents: enrollments?.length || 0,
            certificates: enrollments?.filter(e => e.certified_at).length || 0,
            enrollments: enrollments || []
        };
    },

    /**
     * Add or update a review
     */
    async saveReview(review: Partial<AcademyReview>) {
        const { data, error } = await supabase
            .from('academy_reviews')
            .upsert({
                course_id: review.course_id,
                user_id: review.user_id,
                rating: review.rating,
                comment: review.comment,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Fetch comments for a lesson
     */
    async getLessonComments(lessonId: string): Promise<AcademyLessonComment[]> {
        const { data, error } = await supabase
            .from('academy_lesson_comments')
            .select('*, profiles(full_name, avatar_url)')
            .eq('lesson_id', lessonId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as any[];
    },

    /**
     * Add a comment to a lesson
     */
    async addLessonComment(comment: Partial<AcademyLessonComment>) {
        const { data, error } = await supabase
            .from('academy_lesson_comments')
            .insert({
                lesson_id: comment.lesson_id,
                user_id: comment.user_id,
                content: comment.content
            })
            .select('*, profiles(full_name, avatar_url)')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Toggle like on a lesson
     */
    async toggleLike(lessonId: string, userId: string) {
        // Check if already liked
        const { data: existing } = await supabase
            .from('academy_lesson_likes')
            .select('id')
            .eq('lesson_id', lessonId)
            .eq('user_id', userId)
            .maybeSingle();

        if (existing) {
            await supabase.from('academy_lesson_likes').delete().eq('id', existing.id);
            return false; // unliked
        } else {
            await supabase.from('academy_lesson_likes').insert({ lesson_id: lessonId, user_id: userId });
            return true; // liked
        }
    },

    /**
     * Get likes count for a lesson
     */
    async getLikesCount(lessonId: string) {
        const { count, error } = await supabase
            .from('academy_lesson_likes')
            .select('*', { count: 'exact', head: true })
            .eq('lesson_id', lessonId);

        if (error) throw error;
        return count || 0;
    },

    /**
     * Fetch all enrollments for admin dashboard
     */
    async getEnrollments() {
        const { data, error } = await supabase
            .from('academy_enrollments')
            .select(`
                *,
                profiles (full_name, avatar_url),
                academy_courses (
                    id,
                    title,
                    academy_lessons (id)
                )
            `)
            .order('enrolled_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Issue a certificate for a completed enrollment
     */
    async issueCertificate(enrollmentId: string, certificateUrl?: string) {
        const { data, error } = await supabase
            .from('academy_enrollments')
            .update({
                certified_at: new Date().toISOString(),
                certificate_url: certificateUrl || null
            })
            .eq('id', enrollmentId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Send a reminder email to a student
     */
    async sendReminder(enrollmentId: string) {
        const { error } = await supabase.rpc('trigger_academy_reminder', {
            enrollment_id: enrollmentId
        });

        if (error) throw error;
        return true;
    },

    /**
     * Fetch a specific enrollment for a student
     */
    async getUserEnrollment(courseId: string, userId: string) {
        const { data, error } = await supabase
            .from('academy_enrollments')
            .select('*')
            .eq('course_id', courseId)
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    /**
     * Fetch all enrollments for a specific user (for dashboard progress)
     */
    async getMyEnrollments(userId: string) {
        const { data, error } = await supabase
            .from('academy_enrollments')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return data;
    },

    /**
     * Enroll a student in a course
     */
    async enrollStudent(courseId: string, userId: string) {
        const { data, error } = await supabase
            .from('academy_enrollments')
            .insert({
                course_id: courseId,
                user_id: userId,
                enrolled_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Fetch all certified enrollments for a specific user
     */
    async getMyCertificates(userId: string) {
        const { data, error } = await supabase
            .from('academy_enrollments')
            .select('*, academy_courses(title, cover_image_url)')
            .eq('user_id', userId)
            .not('certified_at', 'is', null)
            .order('certified_at', { ascending: false });

        if (error) throw error;
        return data as (AcademyEnrollment & { academy_courses: { title: string, cover_image_url: string } })[];
    },

    /**
     * Mark a lesson as completed
     */
    async updateLessonProgress(enrollmentId: string, lessonId: string) {
        // 1. Get current progress
        const { data: enrollment, error: getError } = await supabase
            .from('academy_enrollments')
            .select('progress')
            .eq('id', enrollmentId)
            .single();

        if (getError) throw getError;

        const currentProgress = Array.isArray(enrollment.progress) ? enrollment.progress : [];

        // 2. Add lessonId if not already there
        if (!currentProgress.includes(lessonId)) {
            const newProgress = [...currentProgress, lessonId];
            const { data, error } = await supabase
                .from('academy_enrollments')
                .update({
                    progress: newProgress,
                    updated_at: new Date().toISOString()
                })
                .eq('id', enrollmentId)
                .select()
                .single();

            if (error) throw error;
            return data;
        }

        return enrollment;
    },

    /**
     * Get statistics for a specific course
     */
    async getCourseStats(courseId: string) {
        const { data: course, error } = await supabase
            .from('academy_courses')
            .select('id, academy_enrollments(id), academy_reviews(rating)')
            .eq('id', courseId)
            .single();

        if (error) throw error;

        const enrollmentsCount = (course as any).academy_enrollments?.length || 0;
        const ratings = (course as any).academy_reviews || [];
        const avgRating = ratings.length > 0
            ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
            : 0;

        return {
            averageRating: avgRating,
            totalEnrollments: enrollmentsCount,
            reviewsCount: ratings.length
        };
    },

    /**
     * Update enrollment payment status for certificate
     */
    async payForCertificate(enrollmentId: string, paymentId: string) {
        const { data, error } = await supabase
            .from('academy_enrollments')
            .update({
                is_certificate_paid: true,
                certificate_payment_id: paymentId,
                updated_at: new Date().toISOString()
            })
            .eq('id', enrollmentId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * QUIZ: Fetch quiz for a lesson
     */
    async getLessonQuiz(lessonId: string): Promise<AcademyQuiz | null> {
        const { data, error } = await supabase
            .from('academy_quizzes')
            .select('*, academy_quiz_questions(*, academy_quiz_options(*))')
            .eq('lesson_id', lessonId)
            .maybeSingle();

        if (error) throw error;
        return data as any;
    },

    /**
     * QUIZ: Save/Update a quiz
     */
    async saveQuiz(quiz: Partial<AcademyQuiz>) {
        // 1. Save main quiz info
        const { data: savedQuiz, error: quizError } = await supabase
            .from('academy_quizzes')
            .upsert({
                id: quiz.id || undefined,
                lesson_id: quiz.lesson_id,
                title: quiz.title,
                description: quiz.description,
                passing_score: quiz.passing_score,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (quizError) throw quizError;

        // 2. Handle questions if provided
        if (quiz.questions) {
            // Basic replace logic for questions/options for simplicity
            for (const q of quiz.questions) {
                const { data: savedQ, error: qError } = await supabase
                    .from('academy_quiz_questions')
                    .upsert({
                        id: q.id || undefined,
                        quiz_id: savedQuiz.id,
                        question_text: q.question_text,
                        order_index: q.order_index
                    })
                    .select()
                    .single();

                if (qError) throw qError;

                if (q.options) {
                    const optionsToInsert = q.options.map((o: any) => ({
                        question_id: savedQ.id,
                        option_text: o.option_text,
                        is_correct: o.is_correct,
                        order_index: o.order_index
                    }));

                    await supabase.from('academy_quiz_options').delete().eq('question_id', savedQ.id);
                    await supabase.from('academy_quiz_options').insert(optionsToInsert);
                }
            }
        }

        return savedQuiz;
    },

    /**
     * SETTINGS: Fetch Academy settings (templates)
     */
    async getAcademySettings() {
        const { data, error } = await supabase
            .from('system_settings')
            .select('*')
            .ilike('key', 'academy_email_%');

        if (error) throw error;
        return data;
    },

    /**
     * SETTINGS: Update a specific setting
     */
    async updateAcademySetting(key: string, value: any) {
        const { error } = await supabase
            .from('system_settings')
            .upsert({
                key,
                value,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
        return true;
    },

    /**
     * PUBLIC: Verify certificate by code
     */
    async verifyCertificate(code: string) {
        const { data, error } = await supabase
            .from('academy_enrollments')
            .select('*, profiles(*), academy_courses(*)')
            .eq('verification_code', code)
            .maybeSingle();

        if (error) throw error;
        return data;
    }
};
