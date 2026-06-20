-- ============================================================
-- Migration 050: Kelatic Vitality House — Product Commerce
-- Adds product catalog + order/checkout layer on the existing
-- multi-tenant businesses model and seeds the Vitality House
-- tenant (pickup-only). Purely additive / idempotent.
-- ============================================================
-- ============================================
-- 1. PRODUCT CATEGORIES  (menu sections)
--    e.g. Herbal Teas, Detox Lemonades, Sea Moss, Coffee, Breakfast
-- ============================================
CREATE TABLE IF NOT EXISTS product_categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    name        TEXT NOT NULL,                 -- "Herbal Teas"
    slug        TEXT NOT NULL,                 -- "herbal-teas"
    description TEXT,
    image_url   TEXT,
    sort_order  INTEGER DEFAULT 0,
    is_active   BOOLEAN DEFAULT true,

    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(business_id, slug)
);

-- ============================================
-- 2. PRODUCTS  (menu items / retail goods)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id   UUID REFERENCES product_categories(id) ON DELETE SET NULL,

    -- Identity
    name          TEXT NOT NULL,               -- "Sea Moss Smoothie"
    slug          TEXT NOT NULL,
    description   TEXT,
    image_url     TEXT,

    -- Pricing (store cents as the source of truth to match Stripe)
    price_cents   INTEGER NOT NULL DEFAULT 0,  -- base price in cents
    currency      TEXT NOT NULL DEFAULT 'usd',

    -- Merchandising
    tags          TEXT[] DEFAULT '{}',         -- ['dairy-free','no-refined-sugar','vegan']
    is_featured   BOOLEAN DEFAULT false,
    is_active     BOOLEAN DEFAULT true,
    sort_order    INTEGER DEFAULT 0,

    -- Inventory (optional per product; cafe items can ignore)
    track_inventory BOOLEAN DEFAULT false,
    stock_quantity  INTEGER,                   -- null = untracked / unlimited

    -- Fulfillment
    fulfillment   TEXT NOT NULL DEFAULT 'pickup'  -- 'pickup' | 'shipping' | 'both'
                  CHECK (fulfillment IN ('pickup','shipping','both')),

    -- Tax / Stripe linkage (optional, for future Stripe Product sync)
    stripe_product_id TEXT,

    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(business_id, slug)
);

-- ============================================
-- 3. PRODUCT OPTION GROUPS + OPTIONS
--    Modifiers for cafe items: Size, Hot/Cold, Add-ins
--    price_delta_cents lets an option adjust the line price.
-- ============================================
CREATE TABLE IF NOT EXISTS product_option_groups (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    name        TEXT NOT NULL,                 -- "Size", "Temperature", "Add-ins"
    min_select  INTEGER DEFAULT 0,             -- 0 = optional
    max_select  INTEGER DEFAULT 1,             -- 1 = single-choice; >1 = multi
    sort_order  INTEGER DEFAULT 0,

    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_options (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id          UUID NOT NULL REFERENCES product_option_groups(id) ON DELETE CASCADE,

    name              TEXT NOT NULL,           -- "Large", "Iced", "Extra Sea Moss"
    price_delta_cents INTEGER NOT NULL DEFAULT 0,
    is_default        BOOLEAN DEFAULT false,
    is_active         BOOLEAN DEFAULT true,
    sort_order        INTEGER DEFAULT 0,

    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ORDERS  (customer product checkout)
--    Mirrors how `appointments` anchors `payments`.
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    -- Customer (guest checkout supported; client_id optional)
    client_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    customer_name  TEXT,
    customer_email TEXT,
    customer_phone TEXT,

    -- Money (cents to match Stripe; subtotal+tax+tip = total)
    subtotal_cents INTEGER NOT NULL DEFAULT 0,
    tax_cents      INTEGER NOT NULL DEFAULT 0,
    tip_cents      INTEGER NOT NULL DEFAULT 0,
    total_cents    INTEGER NOT NULL DEFAULT 0,
    currency       TEXT NOT NULL DEFAULT 'usd',

    -- Lifecycle
    status        TEXT NOT NULL DEFAULT 'pending'   -- pending|paid|preparing|ready|completed|cancelled|refunded
                  CHECK (status IN ('pending','paid','preparing','ready','completed','cancelled','refunded')),

    -- Fulfillment
    fulfillment_type TEXT NOT NULL DEFAULT 'pickup'  -- 'pickup' | 'shipping'
                     CHECK (fulfillment_type IN ('pickup','shipping')),
    pickup_time      TIMESTAMPTZ,
    shipping_address JSONB,
    notes            TEXT,

    -- Stripe linkage (online card via Payment Intent / Checkout Session)
    stripe_payment_intent_id   TEXT,
    stripe_checkout_session_id TEXT,
    stripe_receipt_url         TEXT,

    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. ORDER ITEMS (line items, price snapshotted)
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id) ON DELETE SET NULL,

    -- Snapshot fields (so historical orders survive product edits)
    product_name    TEXT NOT NULL,
    unit_price_cents INTEGER NOT NULL,         -- base + selected option deltas
    quantity        INTEGER NOT NULL DEFAULT 1,
    line_total_cents INTEGER NOT NULL,

    -- Selected modifiers, snapshotted as JSON
    -- e.g. [{"group":"Size","option":"Large","delta_cents":150}]
    selected_options JSONB DEFAULT '[]'::jsonb,

    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. LINK PAYMENTS TO ORDERS
--    Extend existing payments table so the proven Stripe/webhook
--    pipeline records product payments too (currently appointment-only).
-- ============================================
ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- ============================================
-- 7. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_product_categories_business ON product_categories(business_id);
CREATE INDEX IF NOT EXISTS idx_products_business           ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category           ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active             ON products(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_option_groups_product       ON product_option_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_options_group               ON product_options(group_id);
CREATE INDEX IF NOT EXISTS idx_orders_business             ON orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_status               ON orders(business_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_pi                   ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order           ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order              ON payments(order_id);

-- ============================================
-- 8. ROW LEVEL SECURITY  (mirror 010 tenant-isolation pattern)
-- ============================================
ALTER TABLE product_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items           ENABLE ROW LEVEL SECURITY;

-- Public can read the active catalog (storefront needs anon read)
CREATE POLICY "Public can view active categories" ON product_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view option groups" ON product_option_groups
    FOR SELECT USING (true);

CREATE POLICY "Public can view options" ON product_options
    FOR SELECT USING (is_active = true);

-- Business admins manage their own catalog
CREATE POLICY "Business admins manage categories" ON product_categories
    FOR ALL USING (
        EXISTS (SELECT 1 FROM business_members m
                WHERE m.business_id = product_categories.business_id
                  AND m.user_id = auth.uid()
                  AND m.role IN ('owner','admin')));

CREATE POLICY "Business admins manage products" ON products
    FOR ALL USING (
        EXISTS (SELECT 1 FROM business_members m
                WHERE m.business_id = products.business_id
                  AND m.user_id = auth.uid()
                  AND m.role IN ('owner','admin')));

-- Orders: staff of the business can view/manage; writes from the public
-- storefront go through the service-role API route (bypasses RLS),
-- exactly like the existing POS create-payment route.
CREATE POLICY "Business staff view orders" ON orders
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM business_members m
                WHERE m.business_id = orders.business_id
                  AND m.user_id = auth.uid()));

CREATE POLICY "Business staff manage orders" ON orders
    FOR ALL USING (
        EXISTS (SELECT 1 FROM business_members m
                WHERE m.business_id = orders.business_id
                  AND m.user_id = auth.uid()
                  AND m.role IN ('owner','admin')));

CREATE POLICY "Business staff view order items" ON order_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM orders o
                JOIN business_members m ON m.business_id = o.business_id
                WHERE o.id = order_items.order_id
                  AND m.user_id = auth.uid()));

-- ============================================
-- 9. updated_at TRIGGERS (reuse existing update_updated_at fn)
-- ============================================
CREATE TRIGGER update_product_categories_updated_at
    BEFORE UPDATE ON product_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 10. SEED: Kelatic Vitality House tenant
-- ============================================
INSERT INTO businesses (
    slug, name, email, phone,
    city, state, timezone,
    primary_color, secondary_color, accent_color,
    business_type, brand_voice, tagline,
    features, plan, is_active,
    custom_domain, custom_domain_verified
) VALUES (
    'vitality',
    'Kelatic Vitality House',
    'info@kelaticvitalityhouse.com',
    NULL,
    'Houston', 'TX', 'America/Chicago',
    '#3f7d4f',   -- herbal green (placeholder — tune to brand)
    '#a3c585',
    '#1f3d2b',
    'cafe',
    'warm',
    'Nourish Your Body. Feed Your Spirit. Heal From the Inside Out.',
    '{"ai_content": true, "pos_terminal": true, "ecommerce": true, "newsletter": true}'::jsonb,
    'professional',
    true,
    'kelaticvitalityhouse.com',
    false        -- set true after DNS verification
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO business_settings (
    business_id, ai_brand_context, ai_tone,
    meta_title, meta_description
)
SELECT id,
    'Kelatic Vitality House is a plant-based wellness cafe serving handcrafted herbal teas, detox lemonades, sea moss beverages, mushroom coffee, organic smoothies, and dairy-free breakfast options with no refined white sugar. Mission: help the community embrace healthier living through natural, herbal-inspired options. Does not diagnose, treat, or cure disease. Voice: warm, educational, empowering. Tagline: Healing Together.',
    'warm',
    'Kelatic Vitality House | Plant-Based Wellness Cafe',
    'Handcrafted herbal teas, detox lemonades, sea moss drinks, mushroom coffee, and organic breakfast — dairy-free with no refined white sugar. Nourish your body, feed your spirit.'
FROM businesses WHERE slug = 'vitality'
ON CONFLICT (business_id) DO NOTHING;

-- ============================================
-- 11. SEED: starter menu categories (optional)
-- ============================================
INSERT INTO product_categories (business_id, name, slug, sort_order)
SELECT b.id, c.name, c.slug, c.sort_order
FROM businesses b
CROSS JOIN (VALUES
    ('Herbal Teas',          'herbal-teas',        1),
    ('Detox Lemonades',      'detox-lemonades',    2),
    ('Sea Moss Drinks',      'sea-moss-drinks',    3),
    ('Mushroom Coffee & Matcha', 'coffee-matcha',  4),
    ('Organic Smoothies',    'smoothies',          5),
    ('Organic Breakfast',    'breakfast',          6)
) AS c(name, slug, sort_order)
WHERE b.slug = 'vitality'
ON CONFLICT (business_id, slug) DO NOTHING;
