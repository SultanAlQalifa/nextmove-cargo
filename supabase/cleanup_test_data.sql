-- Cleanup Test Data
-- Delete RFQs that look like test data
DELETE FROM rfq_requests
WHERE origin_port ILIKE '%test%'
    OR destination_port ILIKE '%test%'
    OR cargo_description ILIKE '%test%';
-- Delete Consolidations that look like test data
DELETE FROM consolidations
WHERE title ILIKE '%test%'
    OR origin_port ILIKE '%test%'
    OR destination_port ILIKE '%test%';
-- Verify cleanup
SELECT count(*) as remaining_rfqs
FROM rfq_requests;
SELECT count(*) as remaining_consolidations
FROM consolidations;