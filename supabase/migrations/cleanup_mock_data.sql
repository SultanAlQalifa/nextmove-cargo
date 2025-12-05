-- Cleanup Mock Data (Corrected)
-- Removes specific test data patterns if they exist in the database
-- 1. Remove Mock RFQs (Linked to mock clients)
-- 'id' is UUID, so we cannot use LIKE. We rely on the client relationship.
DELETE FROM rfq_requests
WHERE client_id IN (
        SELECT id
        FROM profiles
        WHERE full_name LIKE 'Client %'
            OR email LIKE '%@example.com'
    );
-- 2. Remove Mock Shipments
-- tracking_number is TEXT, so LIKE works here.
DELETE FROM shipments
WHERE tracking_number LIKE 'SHP-2024%'
    OR client_id IN (
        SELECT id
        FROM profiles
        WHERE full_name LIKE 'Client %'
            OR email LIKE '%@example.com'
    );
-- 3. Remove Mock Consolidations
DELETE FROM consolidations
WHERE title IN (
        'Groupage Maritime Chine-Sénégal',
        'Express Air Cargo Dubai',
        'Liaison Turquie-Mali'
    );
-- 4. Remove Mock Profiles (Client 1, Client 2, etc.)
-- Do this LAST to avoid foreign key constraint errors (though CASCADE should handle it)
DELETE FROM profiles
WHERE (
        full_name LIKE 'Client %'
        OR full_name LIKE 'Forwarder %'
    )
    AND email LIKE '%@example.com';