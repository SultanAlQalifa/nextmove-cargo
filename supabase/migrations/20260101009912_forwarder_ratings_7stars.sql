-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Forwarder Rating System (7 Stars)
-- ═══════════════════════════════════════════════════════════════
-- 1. Update Profile Constraints & Columns
-- Remove old 5-star constraint if it exists
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.constraint_column_usage
    WHERE table_name = 'profiles'
        AND constraint_name = 'profiles_rating_check'
) THEN
ALTER TABLE profiles DROP CONSTRAINT profiles_rating_check;
END IF;
END $$;
-- Apply new 7-star constraint
ALTER TABLE profiles
ADD CONSTRAINT profiles_rating_check CHECK (
        rating >= 0
        AND rating <= 7
    );
-- Add review_count column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
-- 2. Create Reviews Table
CREATE TABLE IF NOT EXISTS forwarder_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    forwarder_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (
        rating >= 1
        AND rating <= 7
    ),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    -- One review per shipment per client/forwarder pair
    CONSTRAINT unique_shipment_review UNIQUE (shipment_id)
);
-- 3. RLS Policies
ALTER TABLE forwarder_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone" ON forwarder_reviews FOR
SELECT USING (true);
CREATE POLICY "Clients can create reviews for their shipments" ON forwarder_reviews FOR
INSERT WITH CHECK (
        auth.uid() = client_id
        AND EXISTS (
            SELECT 1
            FROM shipments s
            WHERE s.id = shipment_id
                AND s.client_id = auth.uid()
                AND s.status = 'delivered'
        )
    );
CREATE POLICY "Clients can update their own reviews" ON forwarder_reviews FOR
UPDATE USING (auth.uid() = client_id);
-- 4. Automatic Rating Aggregate Trigger
CREATE OR REPLACE FUNCTION update_forwarder_rating() RETURNS TRIGGER AS $$ BEGIN -- Update the average rating and count on the forwarder's profile
UPDATE profiles
SET rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM forwarder_reviews
        WHERE forwarder_id = COALESCE(NEW.forwarder_id, OLD.forwarder_id)
    ),
    review_count = (
        SELECT COUNT(*)
        FROM forwarder_reviews
        WHERE forwarder_id = COALESCE(NEW.forwarder_id, OLD.forwarder_id)
    )
WHERE id = COALESCE(NEW.forwarder_id, OLD.forwarder_id);
RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER on_review_changed
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON forwarder_reviews FOR EACH ROW EXECUTE FUNCTION update_forwarder_rating();
-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_forwarder ON forwarder_reviews(forwarder_id);
CREATE INDEX IF NOT EXISTS idx_reviews_shipment ON forwarder_reviews(shipment_id);
COMMENT ON TABLE forwarder_reviews IS 'Detailed reviews for forwarders (7-star system)';