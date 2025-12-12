-- Check policies for documents table
select *
from pg_policies
where schemaname = 'public'
    and tablename = 'documents';