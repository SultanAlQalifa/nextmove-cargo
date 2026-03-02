-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - KYC & Transaction RPC Functions
-- Date: 2026-02-23
-- ═══════════════════════════════════════════════════════════════
-- 1. Function to get monthly transaction volume
CREATE OR REPLACE FUNCTION public.get_monthly_transaction_volume(p_user_id uuid) RETURNS numeric AS $$
DECLARE v_total numeric;
BEGIN
SELECT COALESCE(SUM(t.amount), 0) INTO v_total
FROM public.transactions t
    JOIN public.wallets w ON t.wallet_id = w.id
WHERE w.user_id = p_user_id
    AND t.type = 'payment'
    AND t.status = 'completed'
    AND t.created_at >= date_trunc('month', now());
RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Function to check if KYC is required for a transaction
CREATE OR REPLACE FUNCTION public.check_kyc_required(p_user_id uuid, p_pending_amount numeric) RETURNS boolean AS $$
DECLARE v_kyc_status text;
v_monthly_volume numeric;
v_limit numeric := 500000;
-- Limite de 500,000 XOF par mois
BEGIN -- 1. Récupérer le statut KYC et le rôle
SELECT kyc_status INTO v_kyc_status
FROM public.profiles
WHERE id = p_user_id;
-- 2. Si déjà vérifié, pas besoin de KYC
IF v_kyc_status = 'verified' THEN RETURN false;
END IF;
-- 3. Calculer le volume mensuel
v_monthly_volume := public.get_monthly_transaction_volume(p_user_id);
-- 4. Vérifier si le nouveau montant dépasse la limite
IF (v_monthly_volume + p_pending_amount) > v_limit THEN RETURN true;
END IF;
RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. Update comments for documentation
COMMENT ON FUNCTION public.get_monthly_transaction_volume(uuid) IS 'Calcule le volume total des paiements complétés de l''utilisateur pour le mois en cours.';
COMMENT ON FUNCTION public.check_kyc_required(uuid, numeric) IS 'Vérifie si un utilisateur doit soumettre son KYC avant d''effectuer un paiement, basé sur le volume mensuel (limite 500k XOF).';