-- ============================================
-- SETUP TEST USER FOR X3O.AI DASHBOARD
-- ============================================
-- Follow these steps to create a test user and business:

-- STEP 1: Create User in Supabase Dashboard
-- ==========================================
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" > "Create new user"
-- 3. Email: test@kelatic.com
-- 4. Password: TestPassword123!
-- 5. Auto Confirm User: YES (check this box!)
-- 6. After creation, COPY the user UUID (e.g., "a1b2c3d4-...")
-- 7. Keep this tab open - you'll need the UUID in the next step

-- STEP 2: Run This SQL Script
-- ============================
-- Replace USER_UUID_HERE with the actual UUID from Step 1
-- Then run this entire script in Supabase SQL Editor

DO $$
DECLARE
    v_user_id UUID := 'USER_UUID_HERE'; -- REPLACE THIS WITH YOUR USER UUID
    v_business_id UUID;
BEGIN
    -- Create test business
    INSERT INTO businesses (
        slug,
        name,
        email,
        phone,
        timezone,
        primary_color,
        plan,
        plan_status,
        is_active,
        created_by
    ) VALUES (
        'kelatic-test',
        'KeLatic Hair Lounge',
        'info@kelatic.com',
        '(305) 555-1234',
        'America/Chicago',
        '#f59e0b',
        'free',
        'active',
        true,
        v_user_id
    )
    ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name
    RETURNING id INTO v_business_id;

    -- Link user to business as owner
    INSERT INTO business_members (
        business_id,
        user_id,
        role
    ) VALUES (
        v_business_id,
        v_user_id,
        'owner'
    )
    ON CONFLICT (business_id, user_id) DO NOTHING;

    -- Show success message
    RAISE NOTICE 'SUCCESS! Test user setup complete.';
    RAISE NOTICE 'Business ID: %', v_business_id;
    RAISE NOTICE 'User ID: %', v_user_id;
END $$;

-- STEP 3: Verify Setup
-- =====================
-- Run this query to confirm everything is linked correctly:

SELECT
    b.id as business_id,
    b.name as business_name,
    b.slug,
    b.plan,
    b.plan_status,
    bm.role,
    bm.user_id
FROM businesses b
JOIN business_members bm ON b.id = bm.business_id
WHERE b.slug = 'kelatic-test';

-- You should see:
-- business_name: KeLatic Hair Lounge
-- slug: kelatic-test
-- plan: free
-- plan_status: active
-- role: owner
-- user_id: (your UUID from Step 1)

-- STEP 4: Login
-- =============
-- 1. Go to http://localhost:3000/login
-- 2. Email: test@kelatic.com
-- 3. Password: TestPassword123!
-- 4. After login, go to http://localhost:3000/dashboard/billing
-- 5. You should now see the billing page without 401 errors!
