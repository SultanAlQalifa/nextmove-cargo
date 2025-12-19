-- Add dynamic News Ticker columns to platform_settings
ALTER TABLE public.platform_settings
ADD COLUMN IF NOT EXISTS news_ticker_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS news_ticker_messages TEXT [] DEFAULT ARRAY [
    'Bienvenue sur NextMove Cargo – Votre partenaire logistique global.',
    'Obtenez des cotations instantanées pour vos expéditions Aériennes et Maritimes.',
    'Nouveaux partenaires certifiés disponibles !',
    'Service client disponible 24/7 pour vos besoins urgents.'
];
-- Update the existing row with default values if they are null
UPDATE public.platform_settings
SET news_ticker_messages = ARRAY [
    'Bienvenue sur NextMove Cargo – Votre partenaire logistique global.',
    'Obtenez des cotations instantanées pour vos expéditions Aériennes et Maritimes.',
    'Nouveaux partenaires certifiés disponibles !',
    'Service client disponible 24/7 pour vos besoins urgents.'
]
WHERE news_ticker_messages IS NULL;