-- KeLatic Hair Lounge Database Schema
-- Supabase PostgreSQL Migration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('client', 'stylist', 'admin', 'owner');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partial', 'refunded', 'failed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM ('card_online', 'card_terminal', 'cash', 'other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_category') THEN
        CREATE TYPE service_category AS ENUM ('locs', 'braids', 'natural', 'silk_press', 'color', 'treatments', 'other');
    END IF;
END $$;

-- ============================================
-- CORE TABLES
-- ============================================

-- Profiles (extends Supabase auth.users)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        CREATE TABLE profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT UNIQUE NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone TEXT,
            avatar_url TEXT,

            -- Client-specific fields
            notes TEXT,                          -- Internal notes about client
            hair_type TEXT,                      -- e.g., "4C", "3B"
            hair_texture TEXT,                   -- e.g., "Coarse", "Fine"
            scalp_sensitivity TEXT,              -- e.g., "Normal", "Sensitive"
            preferred_products TEXT[],           -- Array of product preferences
            allergies TEXT[],                    -- Known allergies

            -- Stylist-specific fields
            bio TEXT,
            specialties TEXT[],
            instagram_handle TEXT,
            is_active BOOLEAN DEFAULT true,
            commission_rate DECIMAL(5,2),        -- e.g., 60.00 for 60%

            -- Metadata
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            last_visit_at TIMESTAMPTZ,

            -- Amelia migration tracking
            amelia_user_id INTEGER,              -- Original Amelia ID for migration
            migrated_at TIMESTAMPTZ
        );
    END IF;
END $$;

-- Services offered
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category service_category NOT NULL,
    
    -- Pricing
    base_price DECIMAL(10,2) NOT NULL,
    price_varies BOOLEAN DEFAULT false,  -- True if price depends on length/complexity
    min_price DECIMAL(10,2),
    
    -- Duration (in minutes)
    duration INTEGER NOT NULL,           -- Base duration
    buffer_time INTEGER DEFAULT 15,      -- Time between appointments
    
    -- Deposit
    deposit_required BOOLEAN DEFAULT false,
    deposit_amount DECIMAL(10,2),
    deposit_percentage DECIMAL(5,2),     -- Alternative: percentage of total
    
    -- Display
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Amelia migration
);

-- Which stylists can perform which services
CREATE TABLE stylist_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stylist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    
    -- Stylist-specific pricing override (optional)
    custom_price DECIMAL(10,2),
    custom_duration INTEGER,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(stylist_id, service_id)
);

-- Stylist availability/schedule
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stylist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(stylist_id, day_of_week)
);

-- Time-off / blocked time
CREATE TABLE stylist_time_off (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stylist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT,
    is_recurring BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- APPOINTMENTS
-- ============================================

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who
    client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    stylist_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- What
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    
    -- When
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    
    -- Status
    status appointment_status DEFAULT 'pending',
    
    -- Pricing at time of booking (snapshot)
    quoted_price DECIMAL(10,2) NOT NULL,
    final_price DECIMAL(10,2),           -- May differ after service
    
    -- Notes
    client_notes TEXT,                   -- Notes from client during booking
    stylist_notes TEXT,                  -- Internal notes from stylist
    
    -- Walk-in support
    is_walk_in BOOLEAN DEFAULT false,
    walk_in_name TEXT,                   -- For walk-ins without account
    walk_in_phone TEXT,
    
    -- Cancellation
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES profiles(id),
    cancellation_reason TEXT,
    
    -- Reminders
    reminder_sent_24h BOOLEAN DEFAULT false,
    reminder_sent_2h BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    amelia_appointment_id INTEGER
);

-- Appointment add-ons (e.g., deep conditioning added to loc retwist)
CREATE TABLE appointment_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    
    price DECIMAL(10,2) NOT NULL,
    duration INTEGER NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    amount DECIMAL(10,2) NOT NULL,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    status payment_status DEFAULT 'pending',
    method payment_method,
    
    -- Stripe
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,
    stripe_receipt_url TEXT,
    
    -- For deposits
    is_deposit BOOLEAN DEFAULT false,
    
    -- Refund tracking
    refund_amount DECIMAL(10,2),
    refunded_at TIMESTAMPTZ,
    refund_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Amelia migration
    amelia_payment_id INTEGER
);

-- ============================================
-- CLIENT EXPERIENCE
-- ============================================

-- Client hair history / visit log
CREATE TABLE client_hair_history (
    
    service_performed TEXT NOT NULL,
    products_used TEXT[],
    techniques_used TEXT[],
    
    -- Results
    notes TEXT,
    stylist_recommendations TEXT,
    
    -- Photos
    before_photo_url TEXT,
    after_photo_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rebooking reminders
CREATE TABLE rebooking_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    
    last_appointment_at TIMESTAMPTZ NOT NULL,
    recommended_interval_days INTEGER NOT NULL,  -- e.g., 42 for 6-week retwist
    reminder_date DATE NOT NULL,
    
    sent_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI CHATBOT
-- ============================================

CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- For anonymous chats
    session_id TEXT,
    
    -- Outcome
    resulted_in_booking BOOLEAN DEFAULT false,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
    
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    
    -- Tool usage tracking
    tool_calls JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACADEMY (Phase 3)
-- ============================================

CREATE TABLE academy_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    name TEXT NOT NULL,
    description TEXT,
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL,
    
    -- Duration
    duration_hours INTEGER NOT NULL,
    num_sessions INTEGER DEFAULT 1,
    
    -- Capacity
    max_students INTEGER,
    
    -- Requirements
    prerequisites TEXT[],
    supplies_included BOOLEAN DEFAULT false,
    supplies_list TEXT[],
    
    is_active BOOLEAN DEFAULT true,

CREATE TABLE academy_class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES academy_courses(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    
    location TEXT,
    max_students INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE academy_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES academy_courses(id) ON DELETE CASCADE,
    
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    certificate_url TEXT,
    
    -- Progress tracking
    sessions_attended INTEGER DEFAULT 0,
    
    -- Payment
    payment_id UUID REFERENCES payments(id),
    
    UNIQUE(student_id, course_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_stylist ON appointments(stylist_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);

CREATE INDEX idx_payments_appointment ON payments(appointment_id);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_intent_id);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_active ON services(is_active);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_hair_history ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'owner')
        )
    );

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Appointments: Clients see their own, stylists see assigned, admins see all
CREATE POLICY "Clients view own appointments" ON appointments
    FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Stylists view assigned appointments" ON appointments
    FOR SELECT USING (stylist_id = auth.uid());

CREATE POLICY "Admins view all appointments" ON appointments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'owner', 'stylist')
        )
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to check stylist availability
CREATE OR REPLACE FUNCTION check_stylist_availability(
    p_stylist_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
) RETURNS BOOLEAN AS $$
DECLARE
    v_day_of_week INTEGER;
    v_start_time TIME;
    v_end_time TIME;
    v_conflict_count INTEGER;
BEGIN
    -- Get day of week and times
    v_day_of_week := EXTRACT(DOW FROM p_start_time);
    v_start_time := p_start_time::TIME;
    v_end_time := p_end_time::TIME;
    
    -- Check if stylist works this day
    IF NOT EXISTS (
        SELECT 1 FROM stylist_schedules
        WHERE stylist_id = p_stylist_id
        AND day_of_week = v_day_of_week
        AND is_active = true
        AND v_start_time >= start_time
        AND v_end_time <= end_time
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Check for time-off
    IF EXISTS (
        SELECT 1 FROM stylist_time_off
        WHERE stylist_id = p_stylist_id
        AND p_start_time < end_datetime
        AND p_end_time > start_datetime
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Check for existing appointments
    SELECT COUNT(*) INTO v_conflict_count
    FROM appointments
    WHERE stylist_id = p_stylist_id
    AND status NOT IN ('cancelled', 'no_show')
    AND p_start_time < end_time
    AND p_end_time > start_time;
    
    RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA (Services)
-- ============================================

INSERT INTO services (name, description, category, base_price, duration, deposit_required, deposit_amount) VALUES
-- Locs
('Loc Retwist', 'Maintenance retwist for existing locs', 'locs', 85.00, 90, true, 25.00),
('Starter Locs', 'Begin your loc journey with traditional or interlocking method', 'locs', 200.00, 180, true, 50.00),
('Loc Repair', 'Repair broken or thinning locs', 'locs', 75.00, 60, false, null),
('Loc Styling', 'Updos, barrel curls, and styles for locs', 'locs', 65.00, 60, false, null),

-- Braids
('Box Braids', 'Classic box braids, includes hair', 'braids', 180.00, 240, true, 50.00),
('Knotless Braids', 'Knotless box braids for less tension', 'braids', 220.00, 300, true, 75.00),
('Goddess Locs', 'Faux locs with curly ends', 'braids', 250.00, 360, true, 75.00),
('Cornrows', 'Traditional cornrow styles', 'braids', 75.00, 90, false, null),

-- Natural Hair
('Wash & Style', 'Shampoo, condition, and style for natural hair', 'natural', 65.00, 75, false, null),
('Twist Out', 'Two-strand twist set and style', 'natural', 85.00, 90, false, null),
('Silk Press', 'Straightening for natural hair', 'silk_press', 95.00, 120, true, 25.00),

-- Treatments
('Deep Conditioning', 'Intensive moisture treatment', 'treatments', 35.00, 30, false, null),
('Scalp Treatment', 'Treatment for dry or irritated scalp', 'treatments', 45.00, 45, false, null),
('Protein Treatment', 'Strengthening treatment for damaged hair', 'treatments', 50.00, 45, false, null);