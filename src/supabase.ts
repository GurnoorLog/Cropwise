import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pvklidugpajqqwofnogg.supabase.co";
const supabaseAnonKey =
  "sb_publishable_24YdXy7hL1NsoThOoTVlvQ_tTOWmq1P";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
