# SUPABASE SUPPORT TICKET - CRITICAL 500 ERROR

**Issue:** Persistent `500 Internal Server Error: Database error querying schema` on Auth/API.
**Impact:** Total blocking of User Signup/Login flow.
**Severity:** Critical (Development Blocked).
**Project Ref:** `dkbnmnpxoesvkbnwuyle`

---

## 🇺🇸 ENGLISH VERSION (Primary)

### Summary

Persistent **500 Internal Server Error: "Database error querying schema"** on auth endpoints (e.g., `auth/v1/token?grant_type=password`).
We executed exhaustive DB-level diagnostics and repairs; evidence indicates the failure is in the **PostgREST/service layer** during schema introspection, as the database permissions are verified correct.

### Diagnostics & Evidence

### 1. Role privileges verified (executed as superuser/service_role)

```sql
SELECT 
    has_schema_privilege('authenticator','public','usage') AS public_usage, 
    has_schema_privilege('authenticator','public','create') AS public_create, 
    has_table_privilege('authenticator','auth.users','select') AS auth_read; 
-- Results: public_usage = true, public_create = true, auth_read = true
```

### 2. Extensions / Logic Disabled

- `pg_graphql` dropped.
- Trigger `on_auth_user_created` dropped.
- RLS disabled on `public.profiles`.
- Recursive helpers rewritten to read `auth.users` metadata only.

### 3. Catalog Visibility

- Option A repair executed to grant visibility to `information_schema` / `pg_catalog` where permitted.
- `authenticator` role verified to have all required permissions.

### Observed Behavior

All auth attempts return: `{"code":500,"error_code":"unexpected_failure","msg":"Database error querying schema"}`
**Failing Attempt Timestamp (Please Correlate):**

- **2026-01-04 01:37:44 GMT** (cf-ray: `9b87032bbdb202d4-MAD`, error_id: `9b87032c059d02d4-MAD`)

### Requested Actions

1. **Immediately restart the PostgREST process** (or full API service) for this project and reply with the UTC timestamp.
2. Provide the **exact PostgREST/internal log lines** for the failing request at `01:37:44 GMT`. Include the internal SQL query and Postgres error code (e.g., 42501).
3. Confirm if the API process maps `authenticator` to another internal role.

### 🚨 ESCALATION REQUEST

**If a restart does not immediately resolve the issue, we formally request an escalation to the Infrastructure/DB team to perform a catalog integrity check.**
We suspect potential corruption in the `auth` schema views or system catalogs (e.g., stale connection pool or schema-introspection cache corruption) that is invisible to the `postgres` user. Please advise on a rollback plan or catalog repair steps.

---

## 🛠 REPRODUCTION STEPS FOR SUPPORT ENGINEER

**1. Force PostgREST Reload (SQL)**
Run this as `service_role` or `superuser` to attempt a config reload:

```sql
SELECT pg_notify('pgrst', 'reload');
```

**2. Trigger the Error (CURL)**
Immediately after reload, this request fails with `500`:

```bash
curl -i -X POST 'https://dkbnmnpxoesvkbnwuyle.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{ "email": "test-google@nextmove-cargo.com", "password": "any_password" }'
```

*Expected Result:* `200` or `400 Invalid Login`
*Actual Result:* `500 Database error querying schema`

---

## 📋 TECHNICAL CHECKLIST FOR TRIAGE (Please run these)

### A. Restart & Logs

- [ ] Restart PostgREST process and provide UTC timestamp.
- [ ] Provide stack trace for `01:37:44 GMT` failure.

### B. Introspection Checks

- [ ] Confirm effective DB role used for introspection.
- [ ] Clear/Reload PostgREST schema cache.
- [ ] Rotate connection pool (to clear pinned prepared statements).

### C. Catalog Integrity (Run as postgres)

```sql
-- ACL Check
SELECT n.nspname, n.nspowner, nspacl FROM pg_namespace n WHERE n.nspname IN ('auth','public');

-- Trigger Check
SELECT tgname, tgenabled, tgrelid::regclass FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Invalid Objects Check for Auth Schema
SELECT oid::regprocedure, proname FROM pg_proc 
WHERE NOT pg_function_is_visible(oid) 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth');
```

### D. Safe Snapshot Commands (if escalation needed)

```bash
# Dump catalogs only (safe, small)
pg_dump --clean --if-exists --quote-all-identifiers \
  --schema-only --schema="pg_catalog" --schema="information_schema" \
  -f system_catalogs_snapshot.sql <DB_URL>

# Dump auth schema structure (no data)
pg_dump --clean --if-exists --quote-all-identifiers \
  --schema-only --schema="auth" \
  -f auth_schema_snapshot.sql <DB_URL>
```

---

## 🇫🇷 VERSION FRANÇAISE

### Résumé

Erreur **500 persistante "Database error querying schema"** lors des appels d'authentification.
Diagnostics complets côté base : privilèges du rôle `authenticator` **OK** ; triggers/RLS/extensions désactivés.
Le problème est situé niveau **PostgREST / introspection de schéma**.

### Preuves

**Privilèges Vérifiés :**

- `public_usage` : TRUE
- `public_create` : TRUE
- `auth_read` : TRUE

### Dernières Tentatives de Reproduction (Today)

- **Heure :** 2026-01-04 02:40:00 GMT
- **Compte :** `test-google@nextmove-cargo.com`
- **Error ID :** `9b877656e1682177-MAD`
- **Résultat :** Toujours l'erreur 500 "Database error querying schema".
- **Réponse :** `500 unexpected_failure`

### Comportement Observé

Tentative d'authentification échouée :

- **Horodatage :** `2026-01-04 01:37:44 GMT`
- **ID Erreur :** `9b87032c059d02d4-MAD`
- **Réponse :** `500 unexpected_failure`

### Demandes

1. **Redémarrer immédiatement le processus PostgREST** / service API et indiquer l'heure UTC.
2. Fournir les **logs internes PostgREST** pour l'échec de `01:37:44 GMT`.
3. Escalader à l'infrastructure si nécessaire.
