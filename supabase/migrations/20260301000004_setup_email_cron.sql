-- Activer les extensions réseau et cron dans Postgres
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Supprimer un job existant s'il porte le même nom pour éviter les conflits
SELECT cron.unschedule('process-email-queue-worker');
-- Planifier la relance du worker (Edge Function) toutes les minutes
SELECT cron.schedule(
        'process-email-queue-worker',
        '* * * * *',
        $$
        SELECT net.http_post(
                -- Remplacer cette URL par celle de ton projet Supabase
                url := 'https://dkbnmnpxoesvkbnwuyle.supabase.co/functions/v1/process-email-queue',
                -- INSÉRER LA CLÉ ANON dans l'entête Authorization Bearer
                headers := '{"Content-Type": "application/json", "Authorization": "Bearer INSERER_CLE_ANON"}'::jsonb,
                body := '{}'::jsonb
            );
$$
);