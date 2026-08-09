import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sprout,
  SunMedium,
  Wheat,
  AlertTriangle,
  CloudRain,
  Loader2,
} from "lucide-react";
import type { CropCalendarRow, CalendarPhase } from "../../lib/schemes";
import { phaseForDay } from "../../lib/schemes";
import type { FarmWeather } from "../../lib/weather";
import type { SpeechLanguageCode } from "../../lib/languages";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PHASE_META: Record<Exclude<CalendarPhase, null>, {
  label: string;
  labelHi: string;
  dot: string;
  legend: string;
}> = {
  sowing: {
    label: "Sowing",
    labelHi: "बुवाई",
    dot: "bg-green-500",
    legend: "bg-green-500",
  },
  growing: {
    label: "Growing",
    labelHi: "बढ़वार",
    dot: "bg-sky-500",
    legend: "bg-sky-500",
  },
  harvest: {
    label: "Harvest",
    labelHi: "कटाई",
    dot: "bg-amber-500",
    legend: "bg-amber-500",
  },
};

interface CalendarResultProps {
  rows: CropCalendarRow[];
  loading?: boolean;
  lang?: SpeechLanguageCode;
  farm?: FarmWeather | null;
  userCrops?: string[];
}

function alertForDate(
  farm: FarmWeather | null,
  month: number,
  day: number,
  year: number,
): "frost" | "rain" | null {
  if (!farm?.weather?.daily) return null;
  const times = farm.weather.daily.time ?? [];
  for (let i = 0; i < times.length; i++) {
    const d = new Date(`${times[i]}T00:00:00`);
    if (
      d.getMonth() + 1 === month &&
      d.getDate() === day &&
      d.getFullYear() === year
    ) {
      const min = farm.weather.daily.temperature_2m_min?.[i];
      const precip = farm.weather.daily.precipitation_probability_max?.[i];
      if (min != null && min <= 4) return "frost";
      if (precip != null && precip >= 60) return "rain";
      return null;
    }
  }
  return null;
}

export default function CalendarResult({
  rows,
  loading = false,
  lang = "en",
  farm = null,
  userCrops = [],
}: CalendarResultProps) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const { year, month } = cursor;
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = useMemo(() => {
    const list: { month: number; day: number }[] = [];
    for (let i = 0; i < firstDow; i++) {
      const d = new Date(year, month, 1 - (firstDow - i));
      list.push({ month: d.getMonth(), day: d.getDate() });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      list.push({ month, day });
    }
    let trail = 7 - (list.length % 7);
    if (trail === 7) trail = 0;
    for (let i = 0; i < trail; i++) {
      const d = new Date(year, month + 1, 1 + i);
      list.push({ month: d.getMonth(), day: d.getDate() });
    }
    return list;
  }, [year, month, firstDow, daysInMonth]);

  const isToday =
    new Date().getFullYear() === year && new Date().getMonth() === month;

  const phasesByDay = useMemo(() => {
    const map = new Map<string, { phase: CalendarPhase; crops: string[] }>();
    const apply = (phase: CalendarPhase, crops: string[], key: string) => {
      const existing = map.get(key);
      if (existing) {
        existing.phase = existing.phase ?? phase;
        existing.crops = [...existing.crops, ...crops];
      } else {
        map.set(key, { phase, crops });
      }
    };
    for (const row of rows) {
      for (let day = 1; day <= daysInMonth; day++) {
        const phase = phaseForDay(row, month, day);
        if (!phase) continue;
        const key = `${month}-${day}`;
        apply(phase, [row.crop], key);
      }
    }
    return map;
  }, [rows, month, daysInMonth]);

  const matchedCrops = userCrops.length > 0 ? userCrops : rows.map((r) => r.crop);
  const primaryCrop =
    userCrops[0] ??
    rows.find((r) => matchedCrops.includes(r.crop))?.crop ??
    rows[0]?.crop;

  const t = lang === "hi";
  const monthLabel = `${MONTH_NAMES[month]} ${year}`;

  const prev = () => setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }));
  const next = () => setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }));

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Season tip strip */}
      {primaryCrop && (
        <div className="card-glass p-6 fade-rise stagger-1 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 flex-shrink-0">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              {t ? "मौसम टिप" : "Season Tip"}
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {t
                ? `अभी ${primaryCrop} की कटाई/बुवाई का सही समय कैलेंडर पर देखें — अपनी योजना उसी अनुसार बनाएं।`
                : `Track ${primaryCrop} sowing & harvest windows on the calendar and plan your cycle accordingly.`}
            </p>
          </div>
        </div>
      )}

      {/* Calendar card */}
      <div className="card-glass p-8 fade-rise stagger-2">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-serif text-2xl">{t ? "फसल कैलेंडर" : "Crop Calendar"}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              aria-label="Previous month"
              className="w-9 h-9 rounded-full bg-slate-50 hover:bg-black hover:text-white flex items-center justify-center cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold min-w-[130px] text-center">{monthLabel}</span>
            <button
              onClick={next}
              aria-label="Next month"
              className="w-9 h-9 rounded-full bg-slate-50 hover:bg-black hover:text-white flex items-center justify-center cursor-pointer transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {(Object.keys(PHASE_META) as (keyof typeof PHASE_META)[]).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${PHASE_META[k].dot}`} />
              {t ? PHASE_META[k].labelHi : PHASE_META[k].label}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <CloudRain className="w-3.5 h-3.5 text-blue-500" />
            {t ? "मौसम चेतावनी" : "Weather alert"}
          </span>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((c, i) => {
            const inMonth = c.month === month;
            const key = `${c.month}-${c.day}`;
            const info = phasesByDay.get(key);
            const isTodayCell = isToday && c.day === new Date().getDate() && c.month === month;
            const alert = inMonth ? alertForDate(farm, month, c.day, year) : null;

            return (
              <div
                key={i}
                title={info?.crops.join(", ") ?? undefined}
                className={`relative min-h-[52px] rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  inMonth ? "bg-slate-50/70 hover:bg-black hover:text-white group" : "bg-transparent opacity-30"
                } ${alert ? "border-amber-400 ring-2 ring-amber-300/50" : "border-slate-100"} ${
                  isTodayCell ? "border-black ring-2 ring-black/10" : ""
                }`}
              >
                <span className="text-[11px] font-semibold">{c.day}</span>
                <div className="flex items-center gap-0.5 h-1.5">
                  {info?.phase && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${PHASE_META[info.phase].dot} group-hover:opacity-100`}
                    />
                  )}
                  {alert && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 group-hover:opacity-100" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Crop windows summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 fade-rise stagger-3">
        {rows.slice(0, 8).map((row) => {
          const isUserCrop = userCrops.includes(row.crop);
          return (
            <div
              key={row.id}
              className={`card-glass p-6 ${isUserCrop ? "border-l-4 border-l-green-500" : ""}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                    <Wheat className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{row.crop}</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                      {row.region ?? "India"}
                    </p>
                  </div>
                </div>
                {isUserCrop && (
                  <span className="px-2 py-1 bg-green-50 text-green-700 text-[9px] font-bold rounded-full uppercase tracking-widest">
                    {t ? "आपकी फसल" : "Your crop"}
                  </span>
                )}
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-3">
                  <SunMedium className="w-4 h-4 text-green-500" />
                  <span className="text-slate-500 font-medium w-24">
                    {t ? "बुवाई" : "Sowing"}
                  </span>
                  <span className="font-bold">
                    {row.sowing_start && row.sowing_end
                      ? `${new Date(row.sowing_start).toLocaleDateString("en", { month: "short", day: "numeric" })} – ${new Date(row.sowing_end).toLocaleDateString("en", { month: "short", day: "numeric" })}`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Wheat className="w-4 h-4 text-amber-500" />
                  <span className="text-slate-500 font-medium w-24">
                    {t ? "कटाई" : "Harvest"}
                  </span>
                  <span className="font-bold">
                    {row.harvest_start && row.harvest_end
                      ? `${new Date(row.harvest_start).toLocaleDateString("en", { month: "short", day: "numeric" })} – ${new Date(row.harvest_end).toLocaleDateString("en", { month: "short", day: "numeric" })}`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alert note */}
      {farm && (alertForDate(farm, new Date().getMonth() + 1, new Date().getDate(), new Date().getFullYear())) && (
        <div className="card-glass p-4 border-l-4 border-l-amber-500 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-slate-600 leading-relaxed">
            {t
              ? "आज के लिए मौसम चेतावनी सक्रिय है — खेत का काम करने से पहले देख लें।"
              : "A weather alert is active today — review before field work."}
          </p>
        </div>
      )}
    </div>
  );
}
