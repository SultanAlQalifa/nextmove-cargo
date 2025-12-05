-- Check if the restore worked
SELECT *
FROM transactions
WHERE amount = 5;
-- List all profiles to verify the email
SELECT id,
    email,
    role,
    full_name
FROM profiles;