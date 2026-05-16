import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://dgefppmzrbucxuitpxcc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZWZwcG16cmJ1Y3h1aXRweGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODY3MDQsImV4cCI6MjA5NDQ2MjcwNH0.wtdqlj_Sz189JoyzRyhMEWNKLDm3l0dxlE_M5D69hko';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = true;
export default supabase;
