-- Fix specific shipment weight to 0 to resolve user complaint
UPDATE public.shipments
SET cargo_weight = 0
WHERE id = '41c83f0e-9407-4ffc-9b1a-d533b0edfc86';