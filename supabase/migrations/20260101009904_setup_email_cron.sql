-- Enable the pg_cron extension to schedule jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
-- Enable pg_net to make HTTP requests from SQL (to call the Edge Function)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
-- Schedule the email processor to run every minute
-- NOTE: You need to replace 'YOUR_PROJECT_REF' and 'ANON_KEY' with actual values if not using internal network
-- For Supabase internal: we can use pg_net to call the function
-- But usually it's cleaner to just have the cron ready.
-- Job: Process Email Queue
SELECT cron.schedule(
        'process-email-queue',
        -- job name
        '* * * * *',
        -- every minute
        $$
        select net.http_post(
                url := 'https://dkbnmnpxoesvkbnwuyle.supabase.co/functions/v1/process-email-queue',
                headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
                body := '{}'::jsonb
            ) as request_id;
$$
);