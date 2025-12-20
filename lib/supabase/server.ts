// Re-export server functions from client for cleaner imports
export { createServerSupabaseClient as createClient, createAdminClient } from './client';
