// Database types for KeLatic Booking System
// Auto-generate with: npx supabase gen types typescript --local > types/database.ts

export type UserRole = 'client' | 'stylist' | 'admin' | 'owner';
export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refunded' | 'failed';
export type PaymentMethod = 'card_online' | 'card_terminal' | 'cash' | 'other';
export type ServiceCategory = 'locs' | 'braids' | 'natural' | 'silk_press' | 'color' | 'treatments' | 'other';

// ============================================
// CORE TYPES
// ============================================

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  
  // Client fields
  notes?: string;
  hair_type?: string;
  hair_texture?: string;
  scalp_sensitivity?: string;
  preferred_products?: string[];
  allergies?: string[];
  
  // Stylist fields
  bio?: string;
  specialties?: string[];
  instagram_handle?: string;
  is_active: boolean;
  is_barber?: boolean;
  commission_rate?: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
  last_visit_at?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  category: ServiceCategory;
  
  base_price: number;
  price_varies: boolean;
  min_price?: number;
  max_price?: number;
  
  duration: number; // minutes
  buffer_time: number;
  
  deposit_required: boolean;
  deposit_amount?: number;
  deposit_percentage?: number;
  
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface StylistService {
  id: string;
  stylist_id: string;
  service_id: string;
  custom_price?: number;
  custom_duration?: number;
  is_active: boolean;
  created_at: string;
}

export interface StylistSchedule {
  id: string;
  stylist_id: string;
  day_of_week: number; // 0-6, Sunday = 0
  start_time: string; // HH:MM:SS
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  client_id?: string;
  stylist_id?: string;
  service_id?: string;
  
  start_time: string;
  end_time: string;
  
  status: AppointmentStatus;
  
  quoted_price: number;
  final_price?: number;
  
  client_notes?: string;
  stylist_notes?: string;
  
  is_walk_in: boolean;
  walk_in_name?: string;
  walk_in_phone?: string;
  
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  
  reminder_sent_24h: boolean;
  reminder_sent_2h: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  appointment_id?: string;
  client_id?: string;
  
  amount: number;
  tip_amount: number;
  total_amount: number;
  
  status: PaymentStatus;
  method?: PaymentMethod;
  
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  stripe_receipt_url?: string;
  
  is_deposit: boolean;
  
  refund_amount?: number;
  refunded_at?: string;
  refund_reason?: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// EXTENDED/JOINED TYPES
// ============================================

export interface AppointmentWithDetails extends Appointment {
  client?: Profile;
  stylist?: Profile;
  service?: Service;
  payments?: Payment[];
  addons?: AppointmentAddon[];
}

export interface AppointmentAddon {
  id: string;
  appointment_id: string;
  service_id?: string;
  price: number;
  duration: number;
  service?: Service;
}

export interface StylistWithServices extends Profile {
  services: (StylistService & { service: Service })[];
  schedule: StylistSchedule[];
}

export interface ClientHairHistory {
  id: string;
  client_id: string;
  appointment_id?: string;
  
  service_performed: string;
  products_used?: string[];
  techniques_used?: string[];
  
  notes?: string;
  stylist_recommendations?: string;
  
  before_photo_url?: string;
  after_photo_url?: string;
  
  created_at: string;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface BookingRequest {
  service_id: string;
  stylist_id?: string; // Optional, can be "any available"
  start_time: string;
  client_notes?: string;
  addon_ids?: string[];
}

export interface AvailabilityRequest {
  service_id: string;
  stylist_id?: string;
  date: string; // YYYY-MM-DD
}

export interface TimeSlot {
  time?: string; // HH:MM format for simple display
  start_time: string;
  end_time: string;
  stylist_id: string;
  stylist_name: string;
  available: boolean;
}

export interface AvailabilityResponse {
  date: string;
  slots: TimeSlot[];
}

// ============================================
// AI CHATBOT TYPES
// ============================================

export interface ChatConversation {
  id: string;
  client_id?: string;
  session_id?: string;
  resulted_in_booking: boolean;
  appointment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: Record<string, unknown>;
  created_at: string;
}

// ============================================
// STYLIST VIDEO TYPES
// ============================================

export interface StylistVideo {
  id: string;
  stylist_id: string;
  youtube_url: string;
  title?: string;
  description?: string;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface StylistVideoWithProfile extends StylistVideo {
  stylist: Profile;
}

// ============================================
// ACADEMY TYPES (Phase 3)
// ============================================

export interface AcademyCourse {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_hours: number;
  num_sessions: number;
  max_students?: number;
  prerequisites?: string[];
  supplies_included: boolean;
  supplies_list?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademyEnrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  completed_at?: string;
  certificate_url?: string;
  sessions_attended: number;
  payment_id?: string;
}

// ============================================
// FORM TYPES
// ============================================

export interface ServiceFormData {
  name: string;
  description: string;
  category: ServiceCategory;
  base_price: number;
  duration: number;
  deposit_required: boolean;
  deposit_amount?: number;
}

export interface ClientFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  hair_type?: string;
  notes?: string;
}
