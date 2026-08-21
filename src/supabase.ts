import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://jqhuwlxxoluwiobbqwfd.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxaHV3bHh4b2x1d2lvYmJxd2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyOTk5ODAsImV4cCI6MjEwMjg3NTk4MH0.3QoqRcpQ2HQztlxCiekVcDkPFMoQzpJBS9cscUBk9Lg";

export const supabase = createClient(SUPABASE_URL, supabaseAnonKey);
