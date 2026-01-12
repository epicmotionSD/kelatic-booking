-- Seed GZF Amelia Services
-- This migration replaces existing services with the correct GZF services

-- First, delete existing services (this will cascade to stylist_services and appointment_addons)
-- Only delete if no appointments reference these services
DELETE FROM services WHERE id NOT IN (
    SELECT DISTINCT service_id FROM appointments WHERE service_id IS NOT NULL
);

-- Insert new services from GZF Amelia
-- Duration converted from seconds to minutes
-- Categories assigned based on service name patterns

INSERT INTO services (name, description, category, base_price, duration, price_varies, min_price, max_price, deposit_required, deposit_amount, is_active) VALUES
-- Retwist Services (Locs)
('Shampoo Retwist w/style', 'Shampoo, retwist and styling service', 'locs', 140.00, 90, false, null, null, true, 35.00, true),
('Retwist w/Braided Plaits', 'Retwist with braided plait styling', 'locs', 175.00, 120, false, null, null, true, 40.00, true),
('Retwist-UpDo/Bun', 'Retwist with updo or bun styling', 'locs', 150.00, 135, false, null, null, true, 40.00, true),
('Tender Heads/Sensitive Loc Retwist', 'Gentle retwist for sensitive scalps', 'locs', 140.00, 150, false, null, null, true, 35.00, true),
('Spirals w/Retwist', 'Retwist with spiral styling', 'locs', 275.00, 120, false, null, null, true, 70.00, true),
('Micro Starter Retwist', 'Retwist for micro starter locs', 'locs', 300.00, 150, false, null, null, true, 75.00, true),
('*$hamp/Detox/Retwist*', 'Shampoo, detox treatment, and retwist', 'locs', 200.00, 90, false, null, null, true, 50.00, true),
('Retwist-Braided Plaits', 'Retwist with braided plaits', 'locs', 150.00, 120, false, null, null, true, 40.00, true),
('Retwist & Simple Style', 'Basic retwist with simple styling', 'locs', 140.00, 60, false, null, null, true, 35.00, true),
('Starter Loc Retwist', 'Retwist for starter locs', 'locs', 150.00, 90, false, null, null, true, 40.00, true),
('**3 Months+ Overdue Retwist**', 'Retwist for locs 3+ months overdue', 'locs', 250.00, 90, false, null, null, true, 65.00, true),
('Micro Locs Retwist $200-$350', 'Retwist for micro locs', 'locs', 200.00, 120, true, 200.00, 350.00, true, 50.00, true),
('Shamp/Retwist', 'Shampoo and retwist service', 'locs', 125.00, 60, false, null, null, true, 30.00, true),
('Shamp/Retwist/Simple Style', 'Shampoo, retwist, and simple style', 'locs', 140.00, 60, false, null, null, true, 35.00, true),
('Retwist w/Rope Plaits', 'Retwist with rope plait styling', 'locs', 200.00, 90, false, null, null, true, 50.00, true),
('Deep Conditioning/Retwist Sytle', 'Deep conditioning with retwist and style', 'treatments', 180.00, 90, false, null, null, true, 45.00, true),
('Deep Conditioning/Retwist/Style', 'Deep conditioning, retwist, and styling', 'treatments', 140.00, 90, false, null, null, true, 35.00, true),
('+(3+ Months Overdue Retwist)', 'Add-on for 3+ months overdue', 'locs', 175.00, 120, false, null, null, true, 45.00, true),
('Small Micro Loc Retwist', 'Retwist for small micro locs', 'locs', 200.00, 240, false, null, null, true, 50.00, true),
('+(6+ months over due retwist)', 'Add-on for 6+ months overdue', 'locs', 250.00, 120, false, null, null, true, 65.00, true),
('$75 Shampoo Retwist', 'Budget shampoo and retwist', 'locs', 75.00, 60, false, null, null, false, null, true),
('+Shampoo-Retwist', 'Add-on shampoo and retwist', 'locs', 90.00, 90, false, null, null, false, null, true),
('+Shampoo-Retwist-Style', 'Add-on shampoo, retwist, and style', 'locs', 115.00, 90, false, null, null, false, null, true),
('+Tender Head Retwist', 'Add-on tender head retwist', 'locs', 150.00, 120, false, null, null, true, 40.00, true),
('Medium Micro Loc Retwist', 'Retwist for medium micro locs', 'locs', 225.00, 210, false, null, null, true, 55.00, true),
('Large Micro Loc Retwist', 'Retwist for large micro locs', 'locs', 200.00, 150, false, null, null, true, 50.00, true),
('(StarterLocRetwist)', 'Starter loc retwist service', 'locs', 125.00, 120, false, null, null, true, 30.00, true),
('75 Wednesday W/Style', 'Wednesday special retwist with style', 'locs', 90.00, 90, false, null, null, false, null, true),
('Retwist & Pedals', 'Retwist with pedal styling', 'locs', 150.00, 120, false, null, null, true, 40.00, true),

-- Starter Locs
('Traditional Starters $300-$600', 'Traditional starter loc installation', 'locs', 300.00, 90, true, 300.00, 600.00, true, 100.00, true),
('Small Starters', 'Small starter loc installation', 'locs', 400.00, 180, false, null, null, true, 100.00, true),
('Half Head Starters $200-$600', 'Half head starter loc installation', 'locs', 400.00, 180, true, 200.00, 600.00, true, 100.00, true),
('Starter Locs $300-$900', 'Full starter loc installation', 'locs', 300.00, 180, true, 300.00, 900.00, true, 100.00, true),
('Small Long Hair Starters $500-$1000', 'Starter locs for small long hair', 'locs', 500.00, 210, true, 500.00, 1000.00, true, 150.00, true),

-- Loc Extensions
('Loc Extentions $2500-$4500', 'Full loc extension installation', 'locs', 2500.00, 600, true, 2500.00, 4500.00, true, 500.00, true),
('Loc Extensions', 'Loc extension consultation/booking', 'locs', 25.00, 30, false, null, null, false, null, true),

-- Loc Repairs & Maintenance
('Repairs 6+', 'Repair for 6+ broken locs', 'locs', 250.00, 120, false, null, null, true, 65.00, true),
('Loc Maintenance', 'General loc maintenance', 'locs', 15.00, 15, false, null, null, false, null, true),
('Loc Reconstruction', 'Full loc reconstruction service', 'locs', 300.00, 120, false, null, null, true, 75.00, true),
('Loc Replacement $25.00', 'Single loc replacement', 'locs', 25.00, 30, false, null, null, false, null, true),
('Loc Grooming', 'Comprehensive loc grooming service', 'locs', 250.00, 90, false, null, null, true, 65.00, true),

-- Inner Locking
('Inner Locking (traditional locs)', 'Inner locking for traditional locs', 'locs', 200.00, 120, false, null, null, true, 50.00, true),
('Micro (Inner Locking) Retie', 'Inner locking retie for micro locs', 'locs', 300.00, 180, false, null, null, true, 75.00, true),
('Inner Locking Consult', 'Consultation for inner locking', 'locs', 25.00, 30, false, null, null, false, null, true),

-- Two Strand Styles
('Short Hair Two Strand', 'Two strand twist for short hair', 'natural', 150.00, 150, false, null, null, true, 40.00, true),
('Short Hair Two-Strands', 'Two strand twist for short hair', 'natural', 200.00, 90, false, null, null, true, 50.00, true),
('Long Hair Two Strands', 'Two strand twist for long hair', 'natural', 200.00, 150, false, null, null, true, 50.00, true),
('Short Hair Two Strands', 'Two strand twist styling', 'natural', 200.00, 120, false, null, null, true, 50.00, true),

-- Styling
('*Style Only*', 'Styling service only (no wash)', 'other', 75.00, 30, false, null, null, false, null, true),
('Pedals-Fishtails-Updos', 'Advanced styling options', 'other', 175.00, 90, false, null, null, true, 45.00, true),

-- Color Services
('Color Tips of Locs 300-500', 'Color tips of locs', 'color', 300.00, 90, true, 300.00, 500.00, true, 100.00, true),
('Gray Touch-Up', 'Gray hair touch-up service', 'color', 75.00, 60, false, null, null, false, null, true),
('Color Locs/Full Head', 'Full head loc coloring', 'color', 500.00, 120, false, null, null, true, 150.00, true),

-- Consultations
('Children''s Consultation Services', 'Consultation for children services', 'other', 25.00, 30, false, null, null, false, null, true),
('Consultaton', 'General consultation', 'other', 25.00, 15, false, null, null, false, null, true),
('Loc Breakage Consultation', 'Consultation for loc breakage issues', 'locs', 25.00, 30, false, null, null, false, null, true),
('Starter Loc Consultation', 'Consultation for starting locs', 'locs', 25.00, 30, false, null, null, false, null, true),

-- Treatments
('+Detox Locs', 'Add-on loc detox treatment', 'treatments', 150.00, 90, false, null, null, true, 40.00, true),

-- Kids Services
('Kids Micros', 'Micro locs for children', 'locs', 150.00, 180, false, null, null, true, 40.00, true),
('Tender-Headed Kid', 'Service for tender-headed children', 'locs', 125.00, 150, false, null, null, true, 30.00, true),
('*Kids Retwist', 'Kid retwist service', 'locs', 80.00, 120, false, null, null, false, null, true),
('Kid Retwist & Style', 'Kid retwist with styling', 'locs', 100.00, 150, false, null, null, false, null, true),
('Kids Short Hair Two-Strands', 'Two strand twist for kids with short hair', 'natural', 125.00, 180, false, null, null, true, 30.00, true),
('Kids Long Loc Two-Strand', 'Two strand twist for kids with long locs', 'locs', 150.00, 120, false, null, null, true, 40.00, true),
('Kids Detox & Retwist', 'Detox and retwist for kids', 'locs', 125.00, 120, false, null, null, true, 30.00, true),
('Kids Cuts', 'Haircuts for children', 'other', 25.00, 30, false, null, null, false, null, true),

-- Braids
('Retwist w/Feed-in Braids', 'Retwist with feed-in braids', 'braids', 250.00, 150, false, null, null, true, 65.00, true),
('Feed-In Braided Plaits', 'Feed-in braided plait style', 'braids', 300.00, 150, false, null, null, true, 75.00, true),

-- Micros Category
('Micros', 'Micro loc service', 'locs', 25.00, 30, false, null, null, false, null, true),

-- Training & Specials
('Loc Academy Training', 'Professional loc training session', 'other', 600.00, 240, false, null, null, true, 150.00, true),
('****Loc Model Sign-Up****', 'Sign up to be a loc model', 'other', 50.00, 240, false, null, null, false, null, true),
('Join Waiting List', 'Join waiting list (free)', 'other', 0.00, 30, false, null, null, false, null, true),
('Join Waiting List', 'Join waiting list (deposit)', 'other', 25.00, 90, false, null, null, false, null, true),

-- Pipe Cleaners
('Pipe Cleaners', 'Pipe cleaner loc style', 'locs', 250.00, 180, false, null, null, true, 65.00, true),

-- Barber Services
('Cut w/Beard', 'Haircut with beard trim', 'other', 60.00, 60, false, null, null, false, null, true),
('Full Cut', 'Full haircut service', 'other', 50.00, 30, false, null, null, false, null, true),
('Line-Up', 'Line-up/edge-up service', 'other', 25.00, 30, false, null, null, false, null, true),
('Loc Chop (Tapered Sides)', 'Loc chop with tapered sides', 'locs', 40.00, 30, false, null, null, false, null, true);

-- Note: Some duplicate names exist in original data with different prices/durations
-- These represent different service tiers or variations
