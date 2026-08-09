import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  MapPin,
  ChevronDown,
  RefreshCw,
  Sun,
  CloudSun,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Cloud,
  Eye,
  Gauge,
  Thermometer,
  Droplets,
  Bug,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { fetchFarmWeather, weatherCodeMeta, windDir, type FarmWeather } from "../lib/weather";
import MobileNav from "../components/MobileNav";
import UserMenu from "../components/UserMenu";

const ICONS: Record<string, typeof Sun> = {
  Sun,
  CloudSun,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Cloud,
};

interface AlertCard {
  title: string;
  badge: string;
  body: string;
  duration: string;
}

function buildAlert(farm: FarmWeather): AlertCard | null {
  const { weather } = farm;
  const daily = weather.daily;
  const min0 = daily.temperature_2m_min?.[0];
  const min1 = daily.temperature_2m_min?.[1];
  const precipProb0 = daily.precipitation_probability_max?.[0];
  const wind0 = daily.wind_speed_10m_max?.[0];

  const tonight = Math.min(min0 ?? 99, min1 ?? 99);
  if (tonight <= 4) {
    return {
      title: "Frost Advisory",
      badge: "Caution Required",
      body: `Temperatures expected to dip to ${Math.round(tonight)}°C overnight. Recommended to cover sensitive vegetable seedlings or activate irrigation systems to prevent ground freezing.`,
      duration: "6 Hours",
    };
  }
  if ((precipProb0 ?? 0) >= 60) {
    return {
      title: "Heavy Rain Advisory",
      badge: "High Probability",
      body: `${Math.round(precipProb0 ?? 0)}% chance of precipitation today. Delay spraying or open-field harvesting and clear drainage channels before the rain sets in.`,
      duration: "24 Hours",
    };
  }
  if ((wind0 ?? 0) >= 40) {
    return {
      title: "High Wind Advisory",
      badge: "Gusty Conditions",
      body: `Wind speeds reaching ${Math.round(wind0 ?? 0)} km/h. Secure greenhouse covers, netting and temporary structures before the gusts peak.`,
      duration: "12 Hours",
    };
  }
  return null;
}

function uvLabel(uv: number): string {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very High";
  return "Extreme";
}

function dayName(iso: string, index: number): string {
  if (index === 0) return "Today";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" });
}

function hourLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function WeatherPage() {
  const { user } = useAuth();
  const [farm, setFarm] = useState<FarmWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!user) return;
      if (isRefresh) setRefreshing(true);
      const result = await fetchFarmWeather(user.id);
      if (result) {
        setFarm(result);
        setError(false);
      } else {
        setError(true);
      }
      setLoading(false);
      setRefreshing(false);
    },
    [user],
  );

  useEffect(() => {
    load();
  }, [load]);

  const lang = user?.user_metadata?.language === "hi" ? "hi" : "en";

  const current = farm?.weather.current;
  const daily = farm?.weather.daily;
  const hourly = farm?.weather.hourly;
  const alert = farm ? buildAlert(farm) : null;

  const trend = hourly?.temperature_2m?.slice(0, 12) ?? [];
  const trendMin = trend.length ? Math.min(...trend) : 0;
  const trendMax = trend.length ? Math.max(...trend) : 1;
  const range = Math.max(1, trendMax - trendMin);

  return (
    <div className="min-h-screen relative flex flex-col isolate bg-[#0f172a]">
      {/* Background Video Layer */}
      <div className="fixed inset-0 w-full h-full -z-20 overflow-hidden">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover">
          <source
            src="https://designerstephen.github.io/public-assets/videos/serene-art-hero.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 video-overlay-weather -z-10" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 backdrop-blur-md bg-transparent">
        <div className="max-w-[1400px] mx-auto px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-10">
            <Link to="/dashboard" className="font-serif text-2xl text-white tracking-tight">
              Harvest Window
            </Link>
            <div className="hidden md:flex gap-8 items-center text-white/60">
              <Link
                to="/dashboard"
                className="text-xs font-bold uppercase tracking-widest hover:text-white transition-all"
              >
                Overview
              </Link>
              <Link
                to="/weather"
                className="text-xs font-bold uppercase tracking-widest text-white"
              >
                Weather
              </Link>
              <Link
                to="/news"
                className="text-xs font-bold uppercase tracking-widest hover:text-white transition-all"
              >
                Markets
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div
              className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full cursor-pointer hover:bg-white/10 transition-all"
              title="Farm location"
            >
              <MapPin className="w-4 h-4 text-white/60" />
              <span className="text-white text-xs font-bold">
                {farm?.locationLabel ?? "Locating…"}
              </span>
              <ChevronDown className="w-4 h-4 text-white/40" />
            </div>
            <button
              aria-label="Refresh weather"
              onClick={() => load(true)}
              className="p-2 rounded-full text-white/60 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <UserMenu size="sm" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-8 py-10 space-y-8">
        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white/60" />
          </div>
        ) : error || !farm ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6 text-center">
            <p className="text-white/70 text-sm">
              Couldn't fetch live weather for your farm location.
            </p>
            <button
              onClick={() => load()}
              className="px-8 py-3 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-all cursor-pointer"
            >
              Try Again
            </button>
            <Link
              to="/settings"
              className="text-white/50 text-xs underline underline-offset-4 hover:text-white transition-colors"
            >
              Update farm location in Settings
            </Link>
          </div>
        ) : (
          <>
            {/* Alert Section (Dynamic) */}
            {alert && (
              <div className="fade-rise stagger-1">
                <div className="weather-card p-6 border-l-[6px] border-amber-500 bg-amber-50/95 flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="flex gap-5">
                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="font-bold text-amber-900">{alert.title}</h2>
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[9px] font-black uppercase tracking-tighter rounded">
                          {alert.badge}
                        </span>
                      </div>
                      <p className="text-amber-800/80 text-sm leading-relaxed max-w-2xl">
                        {alert.body}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] font-bold text-amber-900/40 uppercase mb-2">
                      Duration: {alert.duration}
                    </p>
                    <Link
                      to="/app"
                      className="inline-block px-6 py-2 bg-amber-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-black transition-all"
                    >
                      Deploy Countermeasures
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Current Conditions Hero */}
            <div className="fade-rise stagger-2">
              <div className="weather-card p-10 flex flex-col lg:flex-row justify-between gap-12">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
                      Current Intelligence
                    </p>
                    <h1 className="font-serif text-7xl flex items-start gap-2">
                      {Math.round(current?.temperature_2m ?? 0)}°C{" "}
                      <span className="text-2xl text-slate-300 font-sans mt-2">
                        {weatherCodeMeta(current?.weather_code ?? 0, lang).desc}
                      </span>
                    </h1>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Feels Like</p>
                      <p className="text-xl font-medium">
                        {Math.round(current?.apparent_temperature ?? 0)}°C
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Humidity</p>
                      <p className="text-xl font-medium">{Math.round(current?.relative_humidity_2m ?? 0)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Wind Speed</p>
                      <p className="text-xl font-medium">
                        {Math.round(current?.wind_speed_10m ?? 0)} km/h{" "}
                        <span className="text-xs text-slate-400">
                          {windDir(current?.wind_direction_10m ?? 0)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">UV Index</p>
                      <p className="text-xl font-medium text-amber-600">
                        {Math.round(daily?.uv_index_max?.[0] ?? 0)}{" "}
                        <span className="text-xs text-slate-400">{uvLabel(daily?.uv_index_max?.[0] ?? 0)}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                    24-Hour Temperature Trend
                  </p>
                  <div className="chart-container">
                    {trend.map((t, i) => {
                      const h = 25 + ((t - trendMin) / range) * 60;
                      return (
                        <div
                          key={i}
                          className={`chart-bar ${i === 0 ? "bg-black !opacity-60" : ""}`}
                          style={{ height: `${h}%` }}
                          title={`${hourLabel(hourly!.time[i])}: ${Math.round(t)}°C`}
                        />
                      );
                    })}
                    <div className="line-indicator" />
                  </div>
                  <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase">
                    <span>{hourLabel(hourly?.time?.[0] ?? "")}</span>
                    <span>{hourLabel(hourly?.time?.[3] ?? "")}</span>
                    <span>{hourLabel(hourly?.time?.[6] ?? "")}</span>
                    <span>{hourLabel(hourly?.time?.[9] ?? "")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 7-Day Forecast */}
              <div className="lg:col-span-2 fade-rise stagger-3">
                <div className="weather-card p-8 h-full">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="font-serif text-2xl">7-Day Forecast</h2>
                    <button className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-black cursor-pointer">
                      Detailed View
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-4">
                    {(daily?.time ?? []).map((iso, i) => {
                      const meta = weatherCodeMeta(daily?.weather_code?.[i] ?? 0, lang);
                      const Icon = ICONS[meta.icon] ?? Sun;
                      const isToday = i === 0;
                      return (
                        <div
                          key={iso}
                          className="flex flex-col items-center py-4 rounded-2xl bg-slate-50 transition-all hover:bg-black hover:text-white group"
                        >
                          <p className={`text-[10px] font-bold uppercase mb-4 ${isToday ? "" : "opacity-40"}`}>
                            {dayName(iso, i)}
                          </p>
                          <Icon
                            className={`w-6 h-6 mb-4 ${meta.tint} group-hover:text-white ${meta.tint === "text-amber-500" ? "group-hover:text-white" : ""}`}
                          />
                          <p className="text-lg font-bold">
                            {Math.round(daily?.temperature_2m_max?.[i] ?? 0)}°
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {Math.round(daily?.temperature_2m_min?.[i] ?? 0)}°
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Farming Impact */}
              <div className="fade-rise stagger-4">
                <div className="weather-card p-8 bg-black text-white h-full">
                  <h2 className="font-serif text-2xl mb-8">Farming Impact</h2>
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">
                          Irrigation Need
                        </p>
                        <p className="text-lg font-medium">
                          {(daily?.precipitation_probability_max?.[0] ?? 0) < 30
                            ? "Low Probability"
                            : "Elevated Probability"}
                        </p>
                      </div>
                      <Droplets className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex justify-between items-start border-t border-white/10 pt-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">
                          Pest Risk Score
                        </p>
                        <p className="text-lg font-medium text-amber-400">
                          {(current?.relative_humidity_2m ?? 0) >= 60
                            ? "Moderate (High Humidity)"
                            : "Low (Dry Conditions)"}
                        </p>
                      </div>
                      <Bug className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex justify-between items-start border-t border-white/10 pt-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">
                          Harvest Readiness
                        </p>
                        <p className="text-lg font-medium text-green-400">
                          {(daily?.precipitation_probability_max?.[0] ?? 0) < 50
                            ? "Peak Window Reaching"
                            : "Delay Until Rain Clears"}
                        </p>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <button className="w-full mt-6 py-4 rounded-xl bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:scale-[1.02] cursor-pointer">
                      View Full Advisory
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Atmospheric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 fade-rise stagger-4 pb-20">
              <div className="weather-card p-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Precipitation
                </p>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-serif">
                    {Math.round(daily?.precipitation_probability_max?.[0] ?? 0)}%{" "}
                    <span className="text-sm font-sans text-slate-400">Chance</span>
                  </div>
                  <CloudRain className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-[10px] text-slate-400 mt-4">
                  Today · {weatherCodeMeta(daily?.weather_code?.[0] ?? 0, lang).desc}
                </p>
              </div>
              <div className="weather-card p-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Visibility
                </p>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-serif">
                    {((current?.visibility ?? 0) / 1000).toFixed(1)}{" "}
                    <span className="text-sm font-sans text-slate-400">km</span>
                  </div>
                  <Eye className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-[10px] text-slate-400 mt-4">
                  {(current?.visibility ?? 0) < 5000 ? "Reduced visibility conditions" : "Clear line of sight"}
                </p>
              </div>
              <div className="weather-card p-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Pressure
                </p>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-serif">
                    {Math.round(current?.pressure_msl ?? 0)}{" "}
                    <span className="text-sm font-sans text-slate-400">mb</span>
                  </div>
                  <Gauge className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-[10px] text-slate-400 mt-4">
                  {(current?.pressure_msl ?? 0) >= 1010
                    ? "Stable atmospheric conditions"
                    : "Falling pressure signals change"}
                </p>
              </div>
              <div className="weather-card p-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Dew Point
                </p>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-serif">
                    {Math.round(current?.dew_point_2m ?? 0)}°C{" "}
                    <span className="text-sm font-sans text-slate-400">Level</span>
                  </div>
                  <Thermometer className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-[10px] text-slate-400 mt-4">
                  {(current?.dew_point_2m ?? 0) >= 15
                    ? "High moisture content detected"
                    : "Moderate moisture content"}
                </p>
              </div>
            </div>
          </>
        )}
        {/* Mobile bottom nav */}
        <MobileNav />
      </main>

      {/* Footer */}
      <footer className="z-10 p-12 text-center border-t border-white/5">
        <p className="text-white/20 text-[10px] tracking-[0.4em] uppercase font-bold">
          © {new Date().getFullYear()} HARVEST WINDOW INTELLIGENCE
        </p>
      </footer>
    </div>
  );
}
