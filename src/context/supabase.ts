import { createClient } from '@supabase/supabase-js';

// 🌐 URL ของ Supabase ของหนู 
const SUPABASE_URL = 'https://yrtwfhbdrqtuiirvizne.supabase.co'; 

// 🔑 เอากุญแจที่ขึ้นต้นด้วย ey
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlydHdmaGJkcnF0dWlpcnZpem5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3ODExNDcsImV4cCI6MjA5OTM1NzE0N30.kbEWEIpztsjCwIyS2qpgbighYyGqL-W2KSKsObzlKT4'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
