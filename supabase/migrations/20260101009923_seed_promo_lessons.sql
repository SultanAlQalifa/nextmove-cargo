-- ═══════════════════════════════════════════════════════════════
-- Seed Academy Content 2: Alibaba & NextMove Promotion
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE course_id UUID;
lesson4_id UUID;
lesson5_id UUID;
lesson6_id UUID;
BEGIN -- 1. Get the existing Course ID (or create if not exists - assuming it exists from prev step)
SELECT id INTO course_id
FROM public.academy_courses
WHERE title = 'Importation Chine-Afrique : De Zéro à Héros'
LIMIT 1;
-- If course doesn't exist (safety check), stop
IF course_id IS NULL THEN RAISE EXCEPTION 'Course not found. Please run the previous seed script first.';
END IF;
-- 2. Insert Lesson 4: Alibaba Payment & Security
INSERT INTO public.academy_lessons (
        course_id,
        title,
        content,
        type,
        order_index,
        is_free
    )
VALUES (
        course_id,
        'Module 4 : Paiement Sécurisé & Négociation',
        '<!DOCTYPE html>
<html lang="fr">
<body class="bg-slate-50 text-slate-800 p-4">
    <div class="mb-8 border-b-4 border-yellow-500 pb-6 text-center">
        <h1 class="text-3xl font-black text-slate-900 mb-2">Module 4 : Payer sans Peur</h1>
        <h2 class="text-xl text-yellow-600 font-bold">Trade Assurance & Négociation</h2>
    </div>

    <div class="space-y-8">
        <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 class="text-xl font-bold mb-3">🚫 Les Interdits Absolus</h3>
            <div class="bg-red-50 p-4 rounded-xl border border-red-100 text-red-800 text-sm">
                <ul class="list-disc pl-4 space-y-2">
                    <li>Ne payez JAMAIS par Western Union ou MoneyGram.</li>
                    <li>Ne payez JAMAIS sur un compte bancaire personnel (au nom d''un individu).</li>
                    <li>Ne sortez JAMAIS de la plateforme Alibaba pour la transaction.</li>
                </ul>
            </div>
        </section>

        <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 class="text-xl font-bold mb-3 flex items-center gap-2">🛡️ Alibaba Trade Assurance</h3>
            <p class="text-slate-600 mb-4">C''est le système de "Tiers de Confiance". Votre argent est bloqué par Alibaba tant que vous ne confirmez pas la réception.</p>
            <div class="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-sm grid gap-2">
                <p><strong>Étape 1 :</strong> Demandez au fournisseur de créer une "Trade Assurance Order".</p>
                <p><strong>Étape 2 :</strong> Vérifiez bien la liste des produits dans la commande (quantité, couleur, specs).</p>
                <p><strong>Étape 3 :</strong> Payez avec votre carte Visa/Mastercard locale.</p>
            </div>
        </section>
    </div>
</body>
</html>',
        'text',
        4,
        true
    )
RETURNING id INTO lesson4_id;
-- 3. Insert Lesson 5: The NextMove Advantage
INSERT INTO public.academy_lessons (
        course_id,
        title,
        content,
        type,
        order_index,
        is_free
    )
VALUES (
        course_id,
        'Module 5 : NextMove à la Rescousse (Moins cher, Plus simple)',
        '<!DOCTYPE html>
<html lang="fr">
<body class="bg-slate-50 text-slate-800 p-4">
    <div class="mb-8 border-b-4 border-blue-600 pb-6 text-center">
        <h1 class="text-3xl font-black text-slate-900 mb-2">Module 5 : Expédier avec NextMove</h1>
        <h2 class="text-xl text-blue-600 font-bold">L''astuce pour payer moins cher de transport</h2>
    </div>

    <div class="mb-6 bg-blue-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div class="relative z-10">
            <h3 class="font-black text-xl mb-2">Le Secret ? Le Groupage.</h3>
            <p class="text-blue-100 text-sm">Pourquoi payer un conteneur entier quand vous avez juste 2 cartons ? NextMove regroupe vos colis avec ceux d''autres commerçants.</p>
        </div>
    </div>

    <div class="space-y-6">
        <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 class="font-bold text-lg mb-4">Comment ça marche ? (Tuto)</h3>
            <ol class="list-decimal pl-6 space-y-4 text-slate-700">
                <li class="pl-2">
                    <strong>Récupérez votre Adresse Chinoise :</strong>
                    <br><span class="text-xs text-slate-500">Connectez-vous sur votre tableau de bord NextMove. Copiez l''adresse de notre entrepôt à Guangzhou.</span>
                </li>
                <li class="pl-2">
                    <strong>Donnez-la au Fournisseur :</strong>
                    <br><span class="text-xs text-slate-500">Lors de la commande Alibaba, dites : "Please ship to my forwarder agent address". Donnez l''adresse NextMove + VOTRE CODE CLIENT (ex: NM-192).</span>
                </li>
                <li class="pl-2">
                    <strong>On s''occupe du Reste :</strong>
                    <br><span class="text-xs text-slate-500">Nous recevons, nous pesons, nous dédouanons. Vous payez à l''arrivée à Dakar. C''est tout.</span>
                </li>
            </ol>
        </section>

        <div class="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
            <span class="block text-2xl font-black text-green-600 mb-1">DDP 100%</span>
            <span class="text-sm text-green-800">Douane Comprise. Pas de surprise à l''arrivée.</span>
        </div>
    </div>
</body>
</html>',
        'text',
        5,
        true
    )
RETURNING id INTO lesson5_id;
-- 4. Insert Lesson 6: Tracking & Reception
INSERT INTO public.academy_lessons (
        course_id,
        title,
        content,
        type,
        order_index,
        is_free
    )
VALUES (
        course_id,
        'Module 6 : Suivre vos colis comme un Espion',
        '<!DOCTYPE html>
<html lang="fr">
<body class="bg-slate-50 text-slate-800 p-4">
    <div class="mb-8 border-b-4 border-purple-500 pb-6 text-center">
        <h1 class="text-3xl font-black text-slate-900 mb-2">Module 6 : Contrôle Total</h1>
        <h2 class="text-xl text-purple-600 font-bold">Suivez votre argent à la trace</h2>
    </div>

    <div class="space-y-8">
        <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 class="text-xl font-bold mb-3">🔍 Le Tracking NextMove</h3>
            <p class="text-slate-600 mb-4">Ne dormez plus avec le stress "où est mon colis ?".</p>
            <div class="grid gap-3">
                <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <span class="text-xl">📧</span>
                    <span class="text-sm font-medium">Notification par Email à chaque étape (Réception Chine, Départ Bateau, Arrivée Dakar).</span>
                </div>
                <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <span class="text-xl">📱</span>
                    <span class="text-sm font-medium">Application Mobile : Scannez juste votre code ou entrez le tracking number.</span>
                </div>
            </div>
        </section>

        <section class="bg-purple-50 p-6 rounded-2xl border border-purple-100 text-center">
            <h3 class="font-bold text-lg text-purple-900 mb-2">Prêt à importer ?</h3>
            <p class="text-purple-800 text-sm mb-4">Vous avez la connaissance. Vous avez le partenaire logistique (NextMove). Il ne manque que l''action.</p>
            <div class="inline-block bg-purple-600 text-white font-bold py-3 px-6 rounded-full shadow-lg">
                👉 Lancez votre 1ère commande !
            </div>
        </section>
    </div>
</body>
</html>',
        'text',
        6,
        true
    )
RETURNING id INTO lesson6_id;
-- 5. Add Quizzes
INSERT INTO public.academy_quizzes (lesson_id, title, description, passing_score)
VALUES (
        lesson4_id,
        'Test Sécurité',
        'Connaissez-vous les règles d''or du paiement ?',
        100
    );
END $$;