-- Augmentation de la précision pour le volume CBM
-- Supporte jusqu'à 6 décimales pour les très petits colis (ex: 1cm x 1cm x 1cm)
ALTER TABLE rfq_requests
ALTER COLUMN volume_cbm TYPE DECIMAL(12, 6);
ALTER TABLE shipments
ALTER COLUMN cargo_volume TYPE DECIMAL(12, 6);