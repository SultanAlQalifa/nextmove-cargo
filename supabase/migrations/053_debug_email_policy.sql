-- Temporary policy to allow checking email queue
CREATE POLICY "Enable read for everyone" ON "public"."email_queue" AS PERMISSIVE FOR
SELECT TO public USING (true);