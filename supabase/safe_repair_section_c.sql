-- ====================================================================
-- SAFE REPAIR (SECTION C)
-- ====================================================================
BEGIN;
-- 1. REVOCATION EXPLICITE (Nettoyage)
-- On retire tout pour être sûr de repartir d'une base saine.
REVOKE ALL ON SCHEMA public
FROM authenticator;
REVOKE ALL ON ALL TABLES IN SCHEMA public
FROM authenticator;
-- 2. RE-GRANT EXPLICITE (Application propre)
GRANT USAGE ON SCHEMA public TO authenticator;
GRANT CREATE ON SCHEMA public TO authenticator;
-- Important pour certains outils
-- Droits classiques CRUD
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON ALL TABLES IN SCHEMA public TO authenticator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticator;
-- 3. DEFAULT PRIVILEGES (Pour le futur)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON TABLES TO authenticator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO authenticator;
-- 4. RESTORE MEMBERSHIPS (Au cas où le deep scan aurait montré un manque)
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;
-- 5. RELOAD
NOTIFY pgrst,
'reload schema';
COMMIT;
SELECT 'REPAIR COMPLETE. RETRY LOGIN.' as status;