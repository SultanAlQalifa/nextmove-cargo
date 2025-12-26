-- ═══════════════════════════════════════════════════════════════
-- Seed Academy Content: Importation Chine-Afrique (Masterclass)
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE course_id UUID;
lesson1_id UUID;
lesson2_id UUID;
lesson3_id UUID;
BEGIN -- 1. Create the Course (if not exists)
INSERT INTO public.academy_courses (
        title,
        subtitle,
        description,
        category,
        certificate_price,
        status,
        cover_image_url
    )
VALUES (
        'Importation Chine-Afrique : De Zéro à Héros',
        'La méthode complète pour lancer votre business d''importation rentable sans vous faire arnaquer.',
        'Ce cours ne vous apprend pas juste à acheter, il vous apprend à gagner de l''argent. Découvrez les secrets des plus grands importateurs : sourcing, négociation, logistique et calcul de rentabilité. Formation pratique, sans blabla.',
        'Sourcing',
        5000,
        -- Paid Certificate
        'published',
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop' -- Shipping container image
    )
RETURNING id INTO course_id;
-- 2. Insert Lesson 1: Sourcing
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
        'Module 1 : Devenir un Pro du Sourcing Alibaba',
        '<!DOCTYPE html>
<html lang="fr">
<body class="bg-slate-50 text-slate-800 p-4">
    <div class="mb-8 border-b-4 border-orange-500 pb-6 text-center">
        <h1 class="text-3xl font-black text-slate-900 mb-2">Module 1 : Sourcing Stratégique</h1>
        <h2 class="text-xl text-orange-600 font-bold">Comment repérer un fournisseur fiable (5 étapes)</h2>
    </div>

    <div class="mb-8 text-lg text-slate-600">
        <p class="mb-4">Importer de Chine est une opportunité, mais aussi un risque. Alibaba regorge de fournisseurs, mais tous ne se valent pas. Trading companies, usines, arnaqueurs... comment faire le tri ?</p>
        <p class="font-bold text-slate-800">Voici la check-list ultime pour valider un fournisseur.</p>
    </div>

    <div class="space-y-8">
        <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 class="text-xl font-bold mb-3 flex items-center gap-3"><span class="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center">1</span> Les Badges qui comptent</h3>
            <p class="mb-4 text-slate-600">Sur la recherche Alibaba, cochez toujours :</p>
            <ul class="list-disc pl-6 space-y-2 text-slate-700">
                <li><strong>Trade Assurance :</strong> Alibaba protège votre argent jusqu''à réception.</li>
                <li><strong>Verified Supplier :</strong> Un organisme (SGS/TÜV) a physiquement inspecté l''usine.</li>
            </ul>
        </section>

        <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 class="text-xl font-bold mb-3 flex items-center gap-3"><span class="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center">2</span> Usine ou Trading ?</h3>
            <ul class="space-y-3">
                <li class="flex items-start gap-3">
                    <span class="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-xs mt-1">USINE</span>
                    <span class="text-slate-700">Prix bas, gros volumes, idéal pour le custom (OEM). Mais MOQ élevé.</span>
                </li>
                <li class="flex items-start gap-3">
                    <span class="bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded text-xs mt-1">TRADING</span>
                    <span class="text-slate-700">Plus flexible, petits volumes, meilleur service client. Prix légèrement plus haut.</span>
                </li>
            </ul>
        </section>

        <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 class="text-xl font-bold mb-3 flex items-center gap-3"><span class="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center">3</span> La Question Piège</h3>
            <p class="text-slate-600">Posez une question très technique ("Grammage exact ?", "Cycle batterie ?").</p>
            <div class="mt-2 bg-green-50 text-green-800 p-3 rounded-xl border border-green-100 text-sm">
                <strong>Bon signe :</strong> Réponse précise ou "je demande à l''ingénieur".<br>
                <strong>Mauvais signe :</strong> Réponse vague "Top qualité tkt".
            </div>
        </section>
    </div>
</body>
</html>',
        'text',
        1,
        true
    )
RETURNING id INTO lesson1_id;
-- 3. Insert Lesson 2: Landed Cost
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
        'Module 2 : Calculer sa Marge Réelle (Landed Cost)',
        '<!DOCTYPE html>
<html lang="fr">
<body class="bg-slate-50 text-slate-800 p-4">
    <div class="mb-8 border-b-4 border-green-500 pb-6 text-center">
        <h1 class="text-3xl font-black text-slate-900 mb-2">Module 2 : La Marge Secrète</h1>
        <h2 class="text-xl text-green-600 font-bold">Le Coût de Revient (Landed Cost)</h2>
    </div>

    <div class="bg-slate-900 text-white p-6 rounded-3xl shadow-xl mb-8">
        <h3 class="text-lg font-bold mb-4 text-center text-slate-300 uppercase tracking-widest">La Formule</h3>
        <div class="text-center text-lg font-mono">
            Prix Achat (FOB)<br>
            <span class="text-orange-500">+</span> Transport<br>
            <span class="text-orange-500">+</span> Douane<br>
            <span class="text-orange-500">+</span> Frais Cachés<br>
            <span class="text-green-400 font-bold border-t border-slate-600 mt-2 pt-2 block">= COÛT RÉEL</span>
        </div>
    </div>

    <div class="space-y-8">
        <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 class="font-bold text-lg text-green-700 mb-2">1. Attention aux Devises</h3>
            <p class="text-slate-600">Ajoutez toujours <strong>3% de marge de sécurité</strong> au taux de change pour couvrir les frais bancaires et fluctuations.</p>
        </section>

        <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 class="font-bold text-lg text-green-700 mb-2">2. Poids vs Volume</h3>
            <p class="text-slate-600 mb-2">On vous facture au plus élevé entre le Poids Réel (Kg) et le Volume (CBM).</p>
            <ul class="list-disc pl-6 text-sm text-slate-700">
                <li><strong>Aérien :</strong> Sensible au poids (facturé au Kg).</li>
                <li><strong>Maritime :</strong> Sensible au volume (facturé au CBM).</li>
            </ul>
        </section>

        <section class="bg-red-50 p-6 rounded-2xl border border-red-100">
            <h3 class="font-bold text-lg text-red-700 mb-2">3. Les Frais Cachés</h3>
            <ul class="list-disc pl-6 text-red-800 text-sm">
                <li>Transport Port -> Entrepôt</li>
                <li>Main d''œuvre déchargement</li>
                <li>Stockage si retard</li>
            </ul>
        </section>
    </div>
</body>
</html>',
        'text',
        2,
        true
    )
RETURNING id INTO lesson2_id;
-- 4. Insert Lesson 3: Logistics
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
        'Module 3 : Logistique & Incoterms (Aérien vs Maritime)',
        '<!DOCTYPE html>
<html lang="fr">
<body class="bg-slate-50 text-slate-800 p-4">
    <div class="mb-8 border-b-4 border-blue-500 pb-6 text-center">
        <h1 class="text-3xl font-black text-slate-900 mb-2">Module 3 : Maîtriser la Logistique</h1>
        <h2 class="text-xl text-blue-600 font-bold">Aérien vs Maritime : Le Duel</h2>
    </div>

    <div class="grid gap-6 mb-8">
        <div class="bg-white p-6 rounded-3xl shadow border-t-4 border-blue-400">
            <h3 class="text-xl font-black mb-2">✈️ Aérien</h3>
            <ul class="text-sm space-y-2 text-slate-600">
                <li>✅ <strong>Rapide :</strong> 5-10 jours.</li>
                <li>✅ <strong>Sûr :</strong> Peu de casse.</li>
                <li>❌ <strong>Cher :</strong> 5-9k FCFA / Kg.</li>
            </ul>
            <p class="mt-3 text-xs font-bold text-blue-600">Pour : Bijoux, Téléphones, Echantillons.</p>
        </div>

        <div class="bg-white p-6 rounded-3xl shadow border-t-4 border-blue-800">
            <h3 class="text-xl font-black mb-2">🚢 Maritime</h3>
            <ul class="text-sm space-y-2 text-slate-600">
                <li>✅ <strong>Pas cher :</strong> Coût /10.</li>
                <li>✅ <strong>Gros Volume :</strong> Pas de limite.</li>
                <li>❌ <strong>Lent :</strong> 45-60 jours.</li>
            </ul>
            <p class="mt-3 text-xs font-bold text-blue-800">Pour : Meubles, Stock, Lourd.</p>
        </div>
    </div>

    <div class="bg-slate-100 p-6 rounded-3xl border border-slate-200">
        <h3 class="text-xl font-bold mb-4">Lexique Incoterms (Simplifié)</h3>
        
        <div class="space-y-4">
            <div class="bg-white p-4 rounded-xl">
                <div class="flex justify-between font-bold mb-1"><span>EXW (Ex Works)</span> <span class="text-slate-400">Départ Usine</span></div>
                <p class="text-xs text-slate-600">Le prix du produit nu à l''usine. VOUS gérez tout le transport.</p>
            </div>
            <div class="bg-white p-4 rounded-xl">
                <div class="flex justify-between font-bold mb-1"><span>FOB (Free On Board)</span> <span class="text-slate-400">Mis à bord</span></div>
                <p class="text-xs text-slate-600">Le fournisseur livre au port en Chine. C''est le standard.</p>
            </div>
            <div class="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <div class="flex justify-between font-bold text-indigo-900 mb-1"><span>DDP (Door-to-Door)</span> <span class="text-indigo-600">Tout inclus</span></div>
                <p class="text-xs text-indigo-800">NextMove gère tout jusqu''à votre porte. Zéro stress.</p>
            </div>
        </div>
    </div>
</body>
</html>',
        'text',
        3,
        true
    )
RETURNING id INTO lesson3_id;
-- 5. Add Quizzes (Optional but powerful)
INSERT INTO public.academy_quizzes (lesson_id, title, description, passing_score)
VALUES (
        lesson1_id,
        'Test Sourcing',
        'Validez vos connaissances sur Alibaba',
        100
    );
INSERT INTO public.academy_quizzes (lesson_id, title, description, passing_score)
VALUES (
        lesson2_id,
        'Test Rentabilité',
        'Savez-vous calculer votre marge ?',
        100
    );
END $$;