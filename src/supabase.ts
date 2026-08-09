import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://cbtvpqyqoapnxtzmwqni.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNidHZwcXlxb2Fwbnh0em13cW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMTAzNDYsImV4cCI6MjEwMTc4NjM0Nn0.hWQhZ1tQmZOks5sKP1pNSR_F8bQjGWgUhdrKfOy6Eh8";

export const supabase = createClient(SUPABASE_URL, supabaseAnonKey);
