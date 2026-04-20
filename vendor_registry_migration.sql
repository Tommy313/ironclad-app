-- ============================================================
-- Ironclad Fleet Intelligence — Vendor Registry Migration
-- Run this in the Supabase SQL Editor (once)
-- ============================================================

CREATE TABLE IF NOT EXISTS vendors (
  id               text PRIMARY KEY,
  name             text NOT NULL UNIQUE,
  vendor_type      text NOT NULL DEFAULT 'dealer',   -- dealer | independent | other
  labor_rate       numeric(8,2),                      -- known rate $/hr (null = unknown)
  rate_confidence  text DEFAULT 'estimated',          -- contract | published | estimated
  rate_note        text,
  agreement_type   text DEFAULT 'none',               -- resident | contract | expired | quoted | none
  agreement_status text DEFAULT 'NONE',               -- ACTIVE | EXPIRED | NONE | QUOTED
  agreement_ref    text,
  agreement_start  date,
  agreement_end    date,
  tech_cert        text,
  notes            text,
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Seed all known vendors from agreements + rate table
INSERT INTO vendors (id, name, vendor_type, labor_rate, rate_confidence, rate_note, agreement_type, agreement_status, agreement_ref, agreement_start, agreement_end, tech_cert, notes) VALUES
  ('alta-equipment',
   'Alta Equipment', 'dealer', 140.00, 'contract',
   'Resident contract FY25 $140/hr (BP0015900)',
   'resident', 'ACTIVE', 'BP0015900', '2025-07-01', '2028-06-30',
   'OE324 (Operating Engineers Local 324)',
   'Primary Sennebogen/Volvo dealer. Resident tech Jeff H. 36-month agreement through 6/30/28.'),

  ('michigan-cat',
   'Michigan CAT (MacAllister Machinery)', 'dealer', 125.00, 'contract',
   'MacAllister negotiated field rate — agreement expired 12/31/25',
   'contract', 'EXPIRED', NULL, '2022-03-01', '2025-12-31',
   'CAT Certified',
   '15% TUC applies on all billed hours. Agreement expired — no current contract. Verify current rates.'),

  ('reco-equipment',
   'RECO Equipment', 'dealer', 115.00, 'published',
   'RECO published field labor rate — field/travel/mileage separated',
   'none', 'NONE', NULL, NULL, NULL,
   NULL,
   'Good billing transparency — separates field labor, travel labor, and mileage. Used for Liebherr and specialty equipment.'),

  ('summit-industrial',
   'Summit Industrial Services', 'independent', 120.00, 'published',
   'Summit labor rate $130/hr; travel $80/hr (separate)',
   'none', 'NONE', NULL, NULL, NULL,
   NULL,
   'Travel billed separately at $80/hr. Shop supplies: recurring flat $200 pattern — verify scope. Multi-mechanic crews on large jobs.'),

  ('ohio-cat',
   'Ohio CAT', 'dealer', 130.00, 'published',
   'Ohio CAT standard field rate',
   'none', 'NONE', NULL, NULL, NULL,
   'CAT Certified',
   NULL),

  ('towlift',
   'Towlift', 'dealer', 105.00, 'estimated',
   'Estimated — Towlift material handling / lift truck rate',
   'none', 'NONE', NULL, NULL, NULL,
   NULL,
   NULL),

  ('co-op-industries',
   'CO-OP Industries', 'independent', 110.00, 'estimated',
   'Estimated — Co-Op industrial services rate',
   'none', 'NONE', NULL, NULL, NULL,
   NULL,
   NULL),

  ('altorfer-cat',
   'Altorfer CAT', 'dealer', 130.00, 'published',
   'Altorfer standard field rate — $239/hr OT/after-hours',
   'none', 'NONE', NULL, NULL, NULL,
   'CAT Certified',
   'Chicago Heights IL location. Mileage at $4.99/mi. Higher rate than Alta by ~71%.'),

  ('rubberedge',
   'RubberEdge', 'independent', 95.00, 'estimated',
   'Estimated — RubberEdge attachment specialist rate',
   'none', 'NONE', NULL, NULL, NULL,
   NULL,
   NULL),

  ('apex-shear-blades',
   'Apex Shear Blades', 'independent', 95.00, 'estimated',
   'Estimated — Apex attachment specialist rate',
   'none', 'NONE', NULL, NULL, NULL,
   NULL,
   NULL),

  ('sargents-equipment',
   'Sargents Equipment', 'independent', NULL, 'estimated',
   'Rate not yet known — quoted LBX 360X2 blower motor',
   'none', 'NONE', NULL, NULL, NULL,
   NULL,
   'Gilberts / Chicago Heights IL. Quote SAR-QS02195. Disclaimer: may not be the problem.'),

  ('christofano-equipment',
   'Christofano Equipment', 'independent', NULL, 'estimated',
   'Rate not yet known — $1,840 labor with no hourly breakdown',
   'none', 'NONE', NULL, NULL, NULL,
   NULL,
   'Chicago Ridge IL. Mileage $4.00/mi. Parts classified under parts line.'),

  ('ais-construction',
   'AIS Construction Equipment', 'dealer', NULL, 'estimated',
   'Flat-rate PM contract quoted at $8.30/hr ($24,893 for 3000hr)',
   'quoted', 'QUOTED', NULL, NULL, NULL,
   'AIS Fleet Solutions',
   'NVX6030 flat rate quote. Valid through 2/29/26. Contact: 517-449-8612.'),

  ('national-association-supply',
   'National Association Supply', 'other', NULL, 'estimated',
   'Parts and capital equipment supplier — no labor rate',
   'none', 'NONE', NULL, NULL, NULL,
   NULL,
   'Grapple and attachment supplier. Capital purchases only.'),

  ('cummins-bridgeway',
   'Cummins Bridgeway', 'dealer', NULL, 'estimated',
   'Cummins authorized engine service — rate varies',
   'none', 'NONE', NULL, NULL, NULL,
   NULL,
   'Engine rebuild / emissions subcontractor. Often used via Alta sublet.'),

  ('pirtek',
   'Pirtek', 'independent', NULL, 'estimated',
   'Hydraulic hose fabrication specialist',
   'none', 'NONE', NULL, NULL, NULL,
   NULL,
   NULL)

ON CONFLICT (id) DO NOTHING;
