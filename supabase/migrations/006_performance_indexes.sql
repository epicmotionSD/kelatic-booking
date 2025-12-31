-- Performance optimization indexes
-- Migration: 006_performance_indexes

-- ============================================
-- PAYMENT INDEXES
-- ============================================

-- For revenue queries that filter by created_at and status
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Composite index for common revenue query pattern
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON payments(status, created_at DESC)
  WHERE status = 'paid';

-- ============================================
-- PROFILE INDEXES
-- ============================================

-- For "new clients this month" queries
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Composite index for client queries ordered by last visit
CREATE INDEX IF NOT EXISTS idx_profiles_role_last_visit ON profiles(role, last_visit_at DESC NULLS LAST)
  WHERE role = 'client';

-- ============================================
-- APPOINTMENT INDEXES
-- ============================================

-- Composite for common dashboard queries (date range + status filtering)
CREATE INDEX IF NOT EXISTS idx_appointments_start_status ON appointments(start_time, status);

-- For upcoming appointments queries
CREATE INDEX IF NOT EXISTS idx_appointments_upcoming ON appointments(start_time ASC)
  WHERE status NOT IN ('cancelled', 'no_show', 'completed');

-- ============================================
-- ANALYZE TABLES
-- ============================================

-- Update statistics for query planner
ANALYZE profiles;
ANALYZE appointments;
ANALYZE payments;
ANALYZE services;
