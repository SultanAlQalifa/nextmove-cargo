export type LessonType = 'video' | 'audio' | 'pdf' | 'text' | 'quiz';

export interface AcademyLesson {
    id: string;
    course_id: string;
    title: string;
    type: LessonType;
    url?: string;
    file_name?: string;
    content?: string;
    is_free?: boolean;
    order_index: number;
    created_at?: string;
    updated_at?: string;
}

export interface AcademyResource {
    id: string;
    lesson_id: string;
    title: string;
    file_name: string;
    url: string;
    file_size?: number;
    created_at?: string;
}

export interface AcademyCourse {
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    category: string;
    cover_image_url?: string;
    status: 'draft' | 'published' | 'archived';
    created_at?: string;
    updated_at?: string;
    academy_lessons?: AcademyLesson[];
    students?: number;
    rating?: number;
    certificate_price?: number;
    academy_resources?: AcademyResource[];
}

export interface AcademyEnrollment {
    id: string;
    user_id: string;
    course_id: string;
    enrolled_at: string;
    progress: string[]; // Array of lesson IDs
    certified_at?: string;
    certificate_url?: string;
    is_certificate_paid?: boolean;
    certificate_payment_id?: string;
    last_reminder_sent_at?: string;
}

export interface AcademyReview {
    id: string;
    course_id: string;
    user_id: string;
    rating: number;
    comment: string;
    created_at: string;
    profiles?: {
        full_name: string;
        avatar_url: string;
    };
}

export interface AcademyLessonLike {
    id: string;
    lesson_id: string;
    user_id: string;
    created_at: string;
}

export interface AcademyLessonComment {
    id: string;
    lesson_id: string;
    user_id: string;
    content: string;
    parent_id?: string;
    created_at: string;
    profiles?: {
        full_name: string;
        avatar_url: string;
    };
    replies?: AcademyLessonComment[];
}

export interface AcademyQuiz {
    id: string;
    lesson_id: string;
    title: string;
    description?: string;
    passing_score: number;
    academy_quiz_questions?: AcademyQuizQuestion[];
    questions?: AcademyQuizQuestion[]; // Alias for frontend usage
}

export interface AcademyQuizQuestion {
    id: string;
    quiz_id: string;
    question_text: string;
    order_index: number;
    academy_quiz_options?: AcademyQuizOption[];
    options?: AcademyQuizOption[]; // Alias for frontend usage
}

export interface AcademyQuizOption {
    id: string;
    question_id: string;
    option_text: string;
    is_correct: boolean;
    order_index: number;
}
