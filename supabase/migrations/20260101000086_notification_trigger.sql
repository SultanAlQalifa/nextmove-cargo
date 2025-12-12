-- TRANSACTION NOTIFICATION TRIGGER
-- Automatically queues an email receipt when a transaction is completed.
-- 1. Create the Function
CREATE OR REPLACE FUNCTION public.notify_transaction_completion() RETURNS TRIGGER AS $$
DECLARE user_email text;
user_name text;
formatted_amount text;
BEGIN -- Only proceed if status is 'completed' and (it was check or status changed)
IF NEW.status = 'completed'
AND (
    TG_OP = 'INSERT'
    OR OLD.status != 'completed'
) THEN -- Fetch User Details
SELECT email,
    full_name INTO user_email,
    user_name
FROM public.profiles
WHERE id = NEW.user_id;
-- Format Amount (basic formatting)
formatted_amount := NEW.amount || ' FCFA';
-- Verify email exists
IF user_email IS NOT NULL THEN
INSERT INTO public.email_queue (
        sender_id,
        -- We use the user themselves as the "initiator" or system
        recipient_group,
        recipient_emails,
        subject,
        body,
        status
    )
VALUES (
        NEW.user_id,
        'specific',
        to_jsonb(ARRAY [user_email]),
        'Confirmation de Transaction - ' || formatted_amount,
        format(
            '<h3>Paiement Confirmé</h3>
                    <p>Bonjour %s,</p>
                    <p>Votre transaction a été traitée avec succès.</p>
                    <ul>
                        <li><strong>Montant:</strong> %s</li>
                        <li><strong>Type:</strong> %s</li>
                        <li><strong>Date:</strong> %s</li>
                        <li><strong>Référence:</strong> %s</li>
                    </ul>
                    <p>Merci de votre confiance.</p>',
            COALESCE(user_name, 'Client'),
            formatted_amount,
            NEW.type,
            to_char(now(), 'DD/MM/YYYY HH24:MI'),
            COALESCE(NEW.reference, NEW.id::text)
        ),
        'pending'
    );
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Create the Trigger
DROP TRIGGER IF EXISTS tr_notify_transaction_completion ON public.transactions;
CREATE TRIGGER tr_notify_transaction_completion
AFTER
INSERT
    OR
UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.notify_transaction_completion();
-- 3. Verification
SELECT 'Trigger created successfully' as status;