-- ═══════════════════════════════════════════════════════════════
-- SCRIPT DE CORRECTION (VERSION CORRIGÉE)
-- ═══════════════════════════════════════════════════════════════
-- 1. DÉSACTIVER TEMPORAIREMENT LA SÉCURITÉ POUR CE SCRIPT
SET app.bypass_role_check = 'on';
-- 2. CORRECTION DU TRIGGER DE SÉCURITÉ (Autoriser Admin/SQL Editor)
CREATE OR REPLACE FUNCTION prevent_role_change() RETURNS TRIGGER AS $$ BEGIN -- Autoriser si c'est le système (SQL Editor) ou si le bypass est activé
    IF auth.uid() IS NULL
    OR current_setting('app.bypass_role_check', true) = 'on' THEN RETURN NEW;
END IF;
IF (
    TG_OP = 'UPDATE'
    AND OLD.role IS DISTINCT
    FROM NEW.role
) THEN -- Autoriser les admins connectés
IF EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
        AND role IN ('admin', 'super-admin')
) THEN RETURN NEW;
END IF;
-- Autoriser le changement initial de 'client' vers un autre rôle
IF auth.uid() = NEW.id
AND OLD.role = 'client'
AND NEW.role IN ('forwarder', 'supplier', 'driver') THEN RETURN NEW;
END IF;
RAISE EXCEPTION 'Non autorisé à changer votre propre rôle.';
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. CORRECTION AFRIFLUX
UPDATE profiles
SET role = 'forwarder',
    subscription_status = 'active',
    kyc_status = 'verified'
WHERE email = 'afriflux@gmail.com';
-- 4. SUPPRESSION TEST
DELETE FROM profiles
WHERE email = 'nextemove.demo.client@gmail.com';
-- 5. AUTOMATISATION (Sync Souscription -> Rôle)
UPDATE profiles
SET role = 'forwarder',
    subscription_status = 'active'
WHERE role = 'client'
    AND id IN (
        SELECT user_id
        FROM user_subscriptions
        WHERE status = 'active'
    );
CREATE OR REPLACE FUNCTION sync_role_on_subscription() RETURNS TRIGGER AS $$ BEGIN IF NEW.status = 'active' THEN PERFORM set_config('app.bypass_role_check', 'on', true);
UPDATE profiles
SET role = 'forwarder',
    subscription_status = 'active'
WHERE id = NEW.user_id
    AND role = 'client';
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_subscription_change ON user_subscriptions;
CREATE TRIGGER on_subscription_change
AFTER
INSERT
    OR
UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION sync_role_on_subscription();
-- Confirmation
SELECT 'Tout est corrigé !' as message;