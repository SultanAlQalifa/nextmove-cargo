-- ═══════════════════════════════════════════════════════════════
-- SECTION 8: SUPPORT SYSTEM ENHANCEMENTS & SLA AUTOMATION
-- ═══════════════════════════════════════════════════════════════
-- 1. Alter tickets table to add SLA deadline
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS user_plan TEXT DEFAULT 'starter';
-- Snapshotted plan at creation
CREATE INDEX IF NOT EXISTS idx_tickets_sla_deadline ON public.tickets(sla_deadline);
-- 2. Function to Calculate SLA and Priority based on User Plan
CREATE OR REPLACE FUNCTION public.calculate_ticket_sla() RETURNS TRIGGER AS $$
DECLARE user_subscription_tier TEXT;
BEGIN -- Only for inserts or if priority is null (though we override it anyway for clients)
-- We allow admins/system to set priority manually if needed, but for clients we enforce it.
-- Fetch user's active subscription tier via most recent active subscription
SELECT plan_id INTO user_subscription_tier
FROM public.subscriptions
WHERE user_id = NEW.user_id
    AND status = 'active'
ORDER BY created_at DESC
LIMIT 1;
-- Default to starter if no sub found
IF user_subscription_tier IS NULL THEN user_subscription_tier := 'starter';
END IF;
-- Snapshot the plan
NEW.user_plan := user_subscription_tier;
-- Enforce Priority and SLA based on Plan
-- Enterprise ('enterprise') -> Urgent (4h/6h)
-- Pro ('pro') -> High (24h)
-- Starter ('starter') -> Medium (48h)
-- If the user tried to set priority, strictly override it based on plan 
-- UNLESS the inserter is an admin (we check by seeing if user_id != auth.uid() usually, 
-- but for simplicity we enforce business rules: Plan dictates Base Priority).
-- Actually, let's allow admins to override if they are the ones inserting (rare for tickets table, usually updates).
-- This trigger is BEFORE INSERT, so usually initiated by Client.
CASE
    user_subscription_tier
    WHEN 'enterprise' THEN NEW.priority := 'urgent';
NEW.sla_deadline := NOW() + INTERVAL '6 hours';
-- 4-8h window, simplified to 6h
WHEN 'pro' THEN NEW.priority := 'high';
NEW.sla_deadline := NOW() + INTERVAL '24 hours';
ELSE -- starter or others
NEW.priority := 'medium';
NEW.sla_deadline := NOW() + INTERVAL '48 hours';
END CASE
;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. Trigger for SLA Calculation
DROP TRIGGER IF EXISTS tr_set_ticket_sla ON public.tickets;
CREATE TRIGGER tr_set_ticket_sla BEFORE
INSERT ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.calculate_ticket_sla();
-- 4. Create AI Chatbot Knowledge Base Table (Simple Implementation)
CREATE TABLE IF NOT EXISTS public.support_knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keywords TEXT [] NOT NULL,
    -- Array of keywords to match
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS for Knowledge Base (Public Read)
ALTER TABLE public.support_knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read knowledge base" ON public.support_knowledge_base FOR
SELECT USING (true);
-- Seed some initial knowledge
INSERT INTO public.support_knowledge_base (keywords, question, answer, category)
VALUES (
        ARRAY ['prix', 'tarif', 'coute', 'combien'],
        'Combien coûte la livraison ?',
        'Nos tarifs dépendent de la destination et du poids. Vous pouvez utiliser notre calculateur en ligne pour obtenir une estimation précise.',
        'billing'
    ),
    (
        ARRAY ['suivre', 'colis', 'tracking', 'trace'],
        'Comment suivre mon colis ?',
        'Vous pouvez suivre votre colis en temps réel depuis votre tableau de bord en cliquant sur le numéro de suivi de votre expédition.',
        'shipping'
    ),
    (
        ARRAY ['facture', 'paiement', 'reçu'],
        'Où trouver mes factures ?',
        'Vos factures sont disponibles dans la section "Paiements" de votre tableau de bord une fois le paiement confirmé.',
        'billing'
    ),
    (
        ARRAY ['délais', 'temps', 'quand', 'durée'],
        'Quels sont les délais de livraison ?',
        'Les délais varient selon le mode de transport : Aérien (3-5 jours), Maritime (15-45 jours). Consultez les détails lors de la réservation.',
        'shipping'
    ),
    (
        ARRAY ['douane', 'frais', 'taxe'],
        'Les frais de douane sont-ils inclus ?',
        'Pour les envois "Door-to-Door", les frais de douane sont généralement inclus. Vérifiez les termes spécifiques de votre cotation.',
        'legal'
    );