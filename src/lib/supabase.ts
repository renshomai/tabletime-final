import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'customer' | 'staff' | 'manager';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string;
  table_number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  created_at: string;
  updated_at: string;
}

export interface QueueEntry {
  id: string;
  customer_id: string;
  party_size: number;
  status: 'waiting' | 'notified' | 'seated' | 'cancelled' | 'no_show';
  qr_code: string;
  position: number | null;
  estimated_wait_time: number;
  joined_at: string;
  notified_at: string | null;
  seated_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  customer?: {
    full_name: string;
    phone?: string;
  };
}

export interface Reservation {
  id: string;
  queue_entry_id: string | null;
  table_id: string | null;
  customer_id: string;
  staff_id: string | null;
  party_size: number;
  seated_at: string;
  completed_at: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  queue_entry_id: string | null;
  type: 'table_ready' | 'position_update' | 'cancelled' | 'general';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}
