/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// Validate key exists and is not placeholder
export const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseUrl.trim() !== '' && 
  supabaseUrl.indexOf('<project-ref>') === -1 &&
  supabaseAnonKey && 
  supabaseAnonKey.trim() !== '' && 
  supabaseAnonKey.trim() !== 'YOUR_SUPABASE_ANON_KEY' &&
  supabaseAnonKey.trim() !== '<anon-key-from-dashboard>';

// Initialize Supabase Client (handles empty parameters gracefully for safe compilation)
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://example-placeholder-project-ref.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
