-- Add payment tracking columns to academy_enrollments
ALTER TABLE academy_enrollments
ADD COLUMN IF NOT EXISTS is_certificate_paid BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS certificate_payment_id UUID REFERENCES transactions(id);
-- Add price column to academy_courses if specific courses have different certificate prices
-- For now, we assume a standard price, but let's add it for flexibility
ALTER TABLE academy_courses
ADD COLUMN IF NOT EXISTS certificate_price INTEGER DEFAULT 5000;