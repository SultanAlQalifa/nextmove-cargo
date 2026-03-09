-- Deactivate and delete all payment gateways EXCEPT Wave and Wallet
DELETE FROM payment_gateways
WHERE provider NOT IN ('wave', 'wallet');
-- Ensure Wave and Wallet are active if they exist
UPDATE payment_gateways
SET is_active = true
WHERE provider IN ('wave', 'wallet');