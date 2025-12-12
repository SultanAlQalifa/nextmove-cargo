-- CHECK EMAIL QUEUE SCHEMA
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'email_queue';