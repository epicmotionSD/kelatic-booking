-- Migration 014: Add 'barber' to service_category enum
-- This fixes the mismatch between database enum and TypeScript types

-- Add 'barber' value to the service_category enum
ALTER TYPE service_category ADD VALUE IF NOT EXISTS 'barber';
