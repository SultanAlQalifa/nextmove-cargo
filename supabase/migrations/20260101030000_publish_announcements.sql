-- Migration: Publish Announcements and Update News Ticker
-- 1. Update News Ticker with new messages
UPDATE public.platform_settings
SET news_ticker_messages = ARRAY [
    '🎁 100 Points offerts pour fêter nos 100 premiers utilisateurs !',
    'Bienvenue sur NextMove Cargo – Votre partenaire logistique global.',
    '📲 L''application mobile NextMove arrive bientôt sur les stores !',
    'Obtenez des cotations instantanées pour vos expéditions Aériennes et Maritimes.',
    'Service client disponible 24/7 pour vos besoins urgents.'
]
WHERE id IS NOT NULL;
-- 2. Insert Blog Posts for Visual Announcements
-- Using local asset paths for images (assuming they are placed in public/assets/announcements/)
INSERT INTO public.blog_posts (
        title,
        slug,
        excerpt,
        content,
        featured_image,
        category,
        published_at
    )
VALUES (
        'Célébration : 100 Points Offerts à Tous !',
        'celebration-100-points-offerts',
        'Pour vous remercier de votre fidélité, nous offrons 100 points de fidélité à tous nos utilisateurs. Profitez-en pour économiser sur vos prochains envois !',
        '<h2>Un Grand Merci à Notre Communauté</h2><p>Nous sommes ravis de vous annoncer que chaque utilisateur de NextMove Cargo a été crédité de <strong>100 points de fidélité</strong> !</p><p>C''est notre façon de vous dire merci pour votre confiance et de célébrer ensemble la croissance de notre communauté.</p><h3>Comment utiliser vos points ?</h3><p>Vos points peuvent être convertis en crédit wallet ou utilisés pour payer une partie de vos frais de transport.</p>',
        '/assets/marketing/welcome-bonus.png',
        'Annonce',
        now()
    ),
    (
        'Cap des 100 Utilisateurs Actifs Atteint !',
        'cap-100-utilisateurs-actifs',
        'Une étape majeure pour NextMove Cargo. Merci à nos 100 premiers utilisateurs actifs qui nous font confiance pour leur logistique.',
        '<h2>100+ Utilisateurs Actifs</h2><p>Nous avons franchi une étape symbolique importante aujourd''hui : plus de 100 clients, transitaires et administrateurs utilisent activement la plateforme NextMove Cargo pour gérer leurs importations et exportations.</p><p>Cette croissance rapide témoigne de la nécessité d''une solution logistique moderne, transparente et efficace en Afrique. Merci de faire partie de l''aventure !</p>',
        '/assets/marketing/users-milestone.png',
        'Actualité',
        now()
    ),
    (
        'Bientôt Disponible : NextMove Mobile',
        'bientot-disponible-nextmove-mobile',
        'L''expérience NextMove bientôt dans votre poche. Suivez vos colis, demandez des cotations et gérez votre compte depuis votre mobile.',
        '<h2>La Logistique au Bout des Doigts</h2><p>Nous travaillons d''arrache-pied pour finaliser l''application mobile NextMove, qui sera bientôt disponible sur l''App Store et Google Play.</p><p>Avec cette application, vous pourrez :</p><ul><li>Suivre vos expéditions en temps réel</li><li>Recevoir des notifications instantanées</li><li>Scanner vos documents</li><li>Payer via Mobile Money en un clic</li></ul><p>Restez à l''écoute pour le lancement officiel !</p>',
        '/assets/marketing/app-store-promo.png',
        'Technologie',
        now()
    ) ON CONFLICT (slug) DO
UPDATE
SET title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content = EXCLUDED.content,
    featured_image = EXCLUDED.featured_image,
    updated_at = now();