-- Allow Forwarders to UPDATE their own shipments (or related ones)
-- Currently, RLS might be restricting UPDATE to only admins or users with specific roles, missing forwarders.
-- First, drop existing restrictive update policies if any
DROP POLICY IF EXISTS "Forwarders can update their own shipments" ON shipments;
-- Create comprehensive update policy for forwarders
CREATE POLICY "Forwarders can update their own shipments" ON shipments FOR
UPDATE USING (
        -- Forwarder owns the shipment
        forwarder_id = auth.uid()
        OR -- Or user is an admin (standard admin check)
        EXISTS (
            SELECT 1
            FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
                AND r.name IN ('admin', 'super_admin')
        )
    );
-- Ensure DELETE is also allowed for forwarders (as per recent feature request)
DROP POLICY IF EXISTS "Forwarders can delete their own pending shipments" ON shipments;
CREATE POLICY "Forwarders can delete their own pending shipments" ON shipments FOR DELETE USING (
    (
        forwarder_id = auth.uid()
        AND status = 'pending'
    )
    OR EXISTS (
        SELECT 1
        FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'super_admin')
    )
);