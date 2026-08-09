import { getProfile } from "./profile";
import type { SpeechLanguageCode } from "./languages";

export interface GeocodeResult {
  name: string;
  admin1: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  weather_code: number;
  precipitation: number;
  pressure_msl: number;
  visibility: number;
  dew_point_2m: number;
}

export interface HourlySlice {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
  precipitation_probability: number[];
}

export interface DailySlice {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  weather_code: number[];
  precipitation_probability_max: number[];
  uv_index_max: number[];
  wind_speed_10m_max: number[];
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  current: CurrentWeather;
  hourly: HourlySlice;
  daily: DailySlice;
}

export interface FarmWeather {
  locationLabel: string;
  coords: { lat: number; lon: number };
  weather: WeatherData;
}

export function windDir(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

export interface WeatherAlert {
  title: string;
  badge: string;
  body: string;
  duration: string;
}

export function buildAlert(farm: FarmWeather): WeatherAlert | null {
  const daily = farm.weather.daily;
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

export function uvLabel(uv: number): string {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very High";
  return "Extreme";
}

export function weatherCodeMeta(
  code: number,
  language: SpeechLanguageCode,
): { desc: string; icon: string; tint: string } {
  const l = (en: string, hi: string) => (language === "hi" ? hi : en);
  if (code <= 3) return { desc: l("Clear", "साफ"), icon: "Sun", tint: "text-amber-500" };
  if (code <= 48) return { desc: l("Fog", "धुंध"), icon: "CloudFog", tint: "text-slate-300" };
  if (code <= 57) return { desc: l("Drizzle", "बूंदाबांदी"), icon: "CloudDrizzle", tint: "text-blue-400" };
  if (code <= 67) return { desc: l("Rain", "बारिश"), icon: "CloudRain", tint: "text-blue-600" };
  if (code <= 77) return { desc: l("Snow", "बर्फ"), icon: "CloudSnow", tint: "text-slate-300" };
  if (code <= 82) return { desc: l("Heavy Rain", "तेज़ बारिश"), icon: "CloudRain", tint: "text-blue-600" };
  if (code <= 86) return { desc: l("Snow", "बर्फ"), icon: "CloudSnow", tint: "text-slate-300" };
  return { desc: l("Storm", "आंधी"), icon: "CloudLightning", tint: "text-amber-500" };
}

export async function geocodeLocation(location: string): Promise<GeocodeResult | null> {
  const q = encodeURIComponent(location.trim());
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=1&language=en&format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const hit = json?.results?.[0];
    if (!hit) return null;
    return {
      name: hit.name as string,
      admin1: (hit.admin1 as string) ?? null,
      country: (hit.country as string) ?? null,
      latitude: hit.latitude as number,
      longitude: hit.longitude as number,
    };
  } catch {
    return null;
  }
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,weather_code,precipitation,pressure_msl,visibility,dew_point_2m",
    hourly: "temperature_2m,weather_code,precipitation_probability",
    daily:
      "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,uv_index_max,wind_speed_10m_max",
    timezone: "auto",
    forecast_days: "7",
  });
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!res.ok) return null;
    const json = await res.json();
    return {
      latitude: json.latitude,
      longitude: json.longitude,
      current: json.current as CurrentWeather,
      hourly: json.hourly as HourlySlice,
      daily: json.daily as DailySlice,
    };
  } catch {
    return null;
  }
}

export async function fetchFarmWeather(userId: string): Promise<FarmWeather | null> {
  const profile = await getProfile(userId);

  const resolveCoords = async (): Promise<GeocodeResult | null> => {
    if (profile?.farm_location) {
      const geo = await geocodeLocation(profile.farm_location);
      if (geo) return geo;
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            name: "Your Location",
            admin1: null,
            country: null,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        () => resolve(null),
        { timeout: 8000 },
      );
    });
  };

  const coords = await resolveCoords();
  if (!coords) return null;

  const weather = await fetchWeather(coords.latitude, coords.longitude);
  if (!weather) return null;

  const locationLabel =
    coords.admin1 && coords.name !== coords.admin1
      ? `${coords.name}, ${coords.admin1}`
      : coords.name;

  return {
    locationLabel,
    coords: { lat: coords.latitude, lon: coords.longitude },
    weather,
  };
}
