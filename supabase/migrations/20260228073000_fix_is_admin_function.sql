-- Use CREATE OR REPLACE only to avoid dependency errors with RLS policies
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$ BEGIN RETURN EXISTS (
                SELECT 1
                FROM public.profiles
                WHERE id = (
                                select auth.uid()
                        )
                        AND role = 'admin'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;