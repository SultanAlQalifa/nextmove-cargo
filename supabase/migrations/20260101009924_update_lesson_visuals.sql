-- ═══════════════════════════════════════════════════════════════
-- Update Academy Content: Add Visuals (Images)
-- ═══════════════════════════════════════════════════════════════
DO $$ BEGIN -- 1. Lesson 1: Sourcing (Add Alibaba Dashboard Image)
UPDATE public.academy_lessons
SET content = REPLACE(
        content,
        '<div class="space-y-8">',
        '<div class="mb-8"><img src="https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=2073&auto=format&fit=crop" class="w-full h-64 object-cover rounded-2xl shadow-lg mb-2" alt="Alibaba Sourcing"><p class="text-xs text-center text-slate-400">Trading vs Usine : Ne vous faites pas avoir</p></div><div class="space-y-8">'
    )
WHERE title = 'Module 1 : Devenir un Pro du Sourcing Alibaba';
-- 2. Lesson 2: Landed Cost (Add Calculator/Profit Image)
UPDATE public.academy_lessons
SET content = REPLACE(
        content,
        '<div class="bg-slate-900 text-white p-6 rounded-3xl shadow-xl mb-8">',
        '<div class="mb-8"><img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop" class="w-full h-64 object-cover rounded-2xl shadow-lg mb-2" alt="Calcul de Marge"><p class="text-xs text-center text-slate-400">Calculez chaque centime pour rester rentable</p></div><div class="bg-slate-900 text-white p-6 rounded-3xl shadow-xl mb-8">'
    )
WHERE title = 'Module 2 : Calculer sa Marge Réelle (Landed Cost)';
-- 3. Lesson 3: Logistics (Add Plane vs Ship Image)
UPDATE public.academy_lessons
SET content = REPLACE(
        content,
        '<div class="grid gap-6 mb-8">',
        '<div class="mb-8"><img src="https://images.unsplash.com/photo-1494412651409-ae1c4027d160?q=80&w=2070&auto=format&fit=crop" class="w-full h-64 object-cover rounded-2xl shadow-lg mb-2" alt="Logistique Aérienne et Maritime"><p class="text-xs text-center text-slate-400">Le choix crucial : Vitesse (Avion) ou Volume (Bateau)</p></div><div class="grid gap-6 mb-8">'
    )
WHERE title = 'Module 3 : Logistique & Incoterms (Aérien vs Maritime)';
-- 4. Lesson 4: Payment (Add Secure Payment/Handshake Image)
UPDATE public.academy_lessons
SET content = REPLACE(
        content,
        '<div class="space-y-8">',
        '<div class="mb-8"><img src="https://images.unsplash.com/photo-1556740985-ef56be5aa8e6?q=80&w=2070&auto=format&fit=crop" class="w-full h-64 object-cover rounded-2xl shadow-lg mb-2" alt="Paiement Sécurisé"><p class="text-xs text-center text-slate-400">Trade Assurance : Votre bouclier contre les arnaques</p></div><div class="space-y-8">'
    )
WHERE title = 'Module 4 : Paiement Sécurisé & Négociation';
-- 5. Lesson 5: NextMove (Add Warehouse/Shipping Image)
UPDATE public.academy_lessons
SET content = REPLACE(
        content,
        '<div class="space-y-6">',
        '<div class="mb-8"><img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop" class="w-full h-64 object-cover rounded-2xl shadow-lg mb-2" alt="Entrepôt NextMove"><p class="text-xs text-center text-slate-400">Votre adresse en Chine : La clé du groupage</p></div><div class="space-y-6">'
    )
WHERE title = 'Module 5 : NextMove à la Rescousse (Moins cher, Plus simple)';
-- 6. Lesson 6: Tracking (Add Mobile Tracking/Technology Image)
UPDATE public.academy_lessons
SET content = REPLACE(
        content,
        '<div class="space-y-8">',
        '<div class="mb-8"><img src="https://images.unsplash.com/photo-1512428559087-560fa5ce7d87?q=80&w=2070&auto=format&fit=crop" class="w-full h-64 object-cover rounded-2xl shadow-lg mb-2" alt="Tracking Mobile"><p class="text-xs text-center text-slate-400">Suivez tout depuis votre poche</p></div><div class="space-y-8">'
    )
WHERE title = 'Module 6 : Suivre vos colis comme un Espion';
END $$;