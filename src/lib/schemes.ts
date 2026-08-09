import { supabase } from "../supabase";

export interface CropCalendarRow {
  id: string;
  crop: string;
  crop_hi: string | null;
  sowing_start: string | null;
  sowing_end: string | null;
  harvest_start: string | null;
  harvest_end: string | null;
  region: string | null;
}

export interface MspRateRow {
  id: string;
  crop: string;
  crop_hi: string | null;
  price_per_quintal: number;
  year: number | null;
  unit: string | null;
}

export interface SchemeRow {
  id: string;
  name: string;
  name_hi: string | null;
  ministry: string | null;
  summary: string | null;
  summary_hi: string | null;
  eligibility: string | null;
  eligibility_hi: string | null;
  apply_url: string | null;
  icon: string | null;
  category: string | null;
}

export async function fetchCropCalendar(): Promise<CropCalendarRow[]> {
  const { data } = await supabase.from("crop_calendar").select("*");
  return (data as CropCalendarRow[]) ?? [];
}

export async function fetchMspRates(): Promise<MspRateRow[]> {
  const { data } = await supabase
    .from("msp_rates")
    .select("*")
    .order("price_per_quintal", { ascending: false });
  return (data as MspRateRow[]) ?? [];
}

export async function fetchSchemes(): Promise<SchemeRow[]> {
  const { data } = await supabase.from("schemes").select("*");
  return (data as SchemeRow[]) ?? [];
}

/** Reusable month/day key (1-based: month*100 + day) for window comparisons. */
export function mdKey(date: string | null): number | null {
  if (!date) return null;
  const d = new Date(`${date}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  return (d.getMonth() + 1) * 100 + d.getDate();
}

export type CalendarPhase = "sowing" | "growing" | "harvest" | null;

/** Determine which phase (if any) a given day falls in for a crop window. */
export function phaseForDay(
  row: CropCalendarRow,
  month: number,
  day: number,
): CalendarPhase {
  const key = month * 100 + day;
  const sowStart = mdKey(row.sowing_start);
  const sowEnd = mdKey(row.sowing_end);
  const harStart = mdKey(row.harvest_start);
  const harEnd = mdKey(row.harvest_end);

  if (sowStart != null && sowEnd != null) {
    if (sowStart <= sowEnd) {
      if (key >= sowStart && key <= sowEnd) return "sowing";
    } else {
      if (key >= sowStart || key <= sowEnd) return "sowing";
    }
  }
  if (harStart != null && harEnd != null) {
    if (harStart <= harEnd) {
      if (key >= harStart && key <= harEnd) return "harvest";
    } else {
      if (key >= harStart || key <= harEnd) return "harvest";
    }
  }
  if (sowEnd != null && harStart != null) {
    const growStart = sowEnd + 1;
    const growEnd = harStart - 1;
    if (growStart <= growEnd) {
      if (key >= growStart && key <= growEnd) return "growing";
    } else {
      if (key >= growStart || key <= growEnd) return "growing";
    }
  }
  return null;
}
