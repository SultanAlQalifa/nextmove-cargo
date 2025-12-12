-- Comprehensive Schema Repair for 'shipments' table
-- Adds ALL potential missing columns to ensure compatibility with frontend
-- Core Logistics Columns
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS carrier_name VARCHAR(255);
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS transport_mode VARCHAR(50) DEFAULT 'sea';
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS service_type VARCHAR(50) DEFAULT 'standard';
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(50);
-- Should exist, but ensuring
-- Cargo Details
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS cargo_type VARCHAR(255);
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS cargo_packages INTEGER DEFAULT 0;
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS cargo_weight DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS cargo_volume DECIMAL(10, 2) DEFAULT 0;
-- Financials
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS price DECIMAL(15, 2) DEFAULT 0;
-- Route Details
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS origin_port VARCHAR(255);
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS destination_port VARCHAR(255);
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS origin_country VARCHAR(2) DEFAULT 'CN';
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS destination_country VARCHAR(2) DEFAULT 'SN';
-- Dates
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS departure_date DATE;
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS arrival_estimated_date DATE;
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS arrival_actual_date DATE;
-- Timestamps
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
-- Status (Enum usually exists, but ensuring column presence)
-- ALTER TABLE shipments ADD COLUMN IF NOT EXISTS status shipment_status DEFAULT 'pending'; 
-- (Skipping status as enum type dependency might fail if type missing, assuming basic table creation succeeded)