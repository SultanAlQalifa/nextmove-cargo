-- Migration: Seed Fee Configs
-- Description: Inserts default active fees for the calculator so checkboxes appear in the UI.
DO $$ BEGIN -- Insurance
IF NOT EXISTS (
    SELECT 1
    FROM fee_configs
    WHERE category = 'insurance'
) THEN
INSERT INTO fee_configs (
        name,
        type,
        value,
        is_active,
        category,
        target,
        description
    )
VALUES (
        'Assurance Standard',
        'percentage',
        5,
        true,
        'insurance',
        'client',
        'Protection complète (5%)'
    );
END IF;
-- Packaging
IF NOT EXISTS (
    SELECT 1
    FROM fee_configs
    WHERE category = 'packaging'
) THEN
INSERT INTO fee_configs (
        name,
        type,
        value,
        is_active,
        category,
        target,
        description
    )
VALUES (
        'Emballage Renforcé',
        'fixed',
        15000,
        true,
        'packaging',
        'client',
        'Protection extra pour objets fragiles'
    );
END IF;
-- Priority
IF NOT EXISTS (
    SELECT 1
    FROM fee_configs
    WHERE category = 'priority'
) THEN
INSERT INTO fee_configs (
        name,
        type,
        value,
        is_active,
        category,
        target,
        description
    )
VALUES (
        'Traitement Prioritaire',
        'percentage',
        10,
        true,
        'priority',
        'client',
        'Accélération du traitement'
    );
END IF;
-- Inspection
IF NOT EXISTS (
    SELECT 1
    FROM fee_configs
    WHERE category = 'inspection'
) THEN
INSERT INTO fee_configs (
        name,
        type,
        value,
        is_active,
        category,
        target,
        description
    )
VALUES (
        'Inspection Qualité',
        'fixed',
        25000,
        true,
        'inspection',
        'client',
        'Vérification de la marchandise'
    );
END IF;
-- Door to Door
IF NOT EXISTS (
    SELECT 1
    FROM fee_configs
    WHERE category = 'door_to_door'
) THEN
INSERT INTO fee_configs (
        name,
        type,
        value,
        is_active,
        category,
        target,
        description
    )
VALUES (
        'Livraison Door-to-Door',
        'fixed',
        35000,
        true,
        'door_to_door',
        'client',
        'Livraison finale à domicile'
    );
END IF;
-- Storage
IF NOT EXISTS (
    SELECT 1
    FROM fee_configs
    WHERE category = 'storage'
) THEN
INSERT INTO fee_configs (
        name,
        type,
        value,
        is_active,
        category,
        target,
        description
    )
VALUES (
        'Stockage (7 jours)',
        'fixed',
        5000,
        true,
        'storage',
        'client',
        'Entreposage temporaire'
    );
END IF;
END $$;