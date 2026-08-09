import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Check,
  ChevronDown,
  Globe,
  Languages,
  Loader2,
  MapPin,
  Phone,
  Mail,
  User,
  Sprout,
  Droplets,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { getProfile, saveProfile, setFarmCrops, getFarmCrops, type Profile } from "../lib/profile";
import UserMenu from "../components/UserMenu";
import MobileNav from "../components/MobileNav";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
];

const FARM_TYPES = ["Vegetable", "Specialty", "Fruit", "Mixed"];
const IRRIGATION = ["Drip", "Sprinkler", "Flood", "Rain-fed"];
const CROP_OPTIONS = [
  "Tomatoes",
  "Potatoes",
  "Onions",
  "Heirloom Peppers",
  "Lettuce",
  "Spinach",
  "Chilies",
  "Brinjal",
];
const CONTACT_METHODS = ["Email", "Phone", "WhatsApp"];

const fieldClass =
  "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm outline-none transition-all duration-300 focus:ring-2 focus:ring-black/5 focus:border-black";
const labelClass = "block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2";

function SectionCard({
  icon: Icon,
  iconBg,
  title,
  subtitle,
  children,
}: {
  icon: typeof User;
  iconBg: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-glass p-8 fade-rise">
      <div className="flex items-start gap-4 mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h2 className="font-serif text-2xl">{title}</h2>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [language, setLanguage] = useState("en");
  const [farmName, setFarmName] = useState("");
  const [farmLocation, setFarmLocation] = useState("");
  const [farmType, setFarmType] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [farmSizeUnit, setFarmSizeUnit] = useState("hectares");
  const [irrigation, setIrrigation] = useState("");
  const [contactMethod, setContactMethod] = useState("Email");
  const [crops, setCrops] = useState<string[]>([]);

  const email = (user?.user_metadata?.email as string) ?? user?.email ?? "";

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user) return;
      const p = await getProfile(user.id);
      const farmCrops = await getFarmCrops(user.id);
      if (!mounted) return;
      setProfile(p);
      if (p) {
        setFullName(p.full_name ?? "");
        setPhone(p.phone ?? "");
        setAddress(p.address ?? "");
        setLanguage(p.language ?? "en");
        setFarmName(p.farm_name ?? "");
        setFarmLocation(p.farm_location ?? "");
        setFarmType(p.farm_type ?? "");
        setFarmSize(p.farm_size ? String(p.farm_size) : "");
        setFarmSizeUnit(p.farm_size_unit ?? "hectares");
        setIrrigation(p.irrigation_method ?? "");
        setContactMethod(p.preferred_contact ?? "Email");
      }
      setCrops(farmCrops);
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const toggleCrop = (crop: string) =>
    setCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop],
    );

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      const saved = await saveProfile(user.id, {
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        language,
        farm_name: farmName.trim() || null,
        farm_location: farmLocation.trim() || null,
        farm_type: farmType || null,
        farm_size: farmSize.trim() ? Number(farmSize) : null,
        farm_size_unit: farmSizeUnit,
        irrigation_method: irrigation || null,
        preferred_contact: contactMethod,
      });
      if (!saved) {
        setError("Could not save your profile. Please try again.");
        setSaving(false);
        return;
      }
      await setFarmCrops(user.id, crops);
      setProfile(saved);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    } catch {
      setError("Unexpected error while saving. Please try again.");
    }
    setSaving(false);
  };

  const navLink = (active: boolean) =>
    `text-sm font-medium transition-colors ${active ? "text-white" : "text-white/60 hover:text-white"}`;

  return (
    <div className="min-h-screen relative flex flex-col isolate bg-[#171310]">
      {/* Background Video Layer */}
      <div className="fixed inset-0 w-full h-full -z-20 overflow-hidden">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover">
          <source
            src="https://designerstephen.github.io/public-assets/videos/serene-art-hero.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 video-overlay-dashboard" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 backdrop-blur-md bg-transparent">
        <div className="max-w-[1400px] mx-auto px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="font-serif text-2xl text-white tracking-tight">
              Harvest Window
            </Link>
            <div className="hidden md:flex items-center gap-7">
              <Link to="/dashboard" className={navLink(false)}>
                Overview
              </Link>
              <Link to="/weather" className={navLink(false)}>
                Weather
              </Link>
              <Link to="/news" className={navLink(false)}>
                Markets
              </Link>
              <Link to="/calendar" className={navLink(false)}>
                Calendar
              </Link>
              <Link to="/schemes" className={navLink(false)}>
                Schemes
              </Link>
              <Link to="/app" className={navLink(false)}>
                Ask AI Agent
              </Link>
              <Link to="/settings" className={navLink(true)}>
                Settings
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              aria-label="Notifications"
              className="text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <UserMenu subtitle={profile?.farm_name ?? "Premium Estate"} />
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 w-full max-w-[900px] mx-auto px-8 py-10 pb-28">
        <header className="mb-10 fade-rise stagger-1">
          <h1 className="font-serif text-4xl text-white mb-2">Settings</h1>
          <p className="text-white/50 font-light max-w-xl">
            Manage your personal information, farm profile, language, and platform
            preferences.
          </p>
        </header>

        {loading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white/60" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {/* Personal info */}
            <SectionCard
              icon={User}
              iconBg="bg-sky-50 text-sky-600"
              title="Personal Information"
              subtitle="How we contact you and display your account."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input
                    className={fieldClass}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      className={`${fieldClass} pl-10 bg-slate-50 text-slate-400`}
                      value={email}
                      disabled
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      className={`${fieldClass} pl-10`}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Preferred Contact</label>
                  <div className="relative">
                    <select
                      className={`${fieldClass} appearance-none pr-10`}
                      value={contactMethod}
                      onChange={(e) => setContactMethod(e.target.value)}
                    >
                      {CONTACT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Address</label>
                  <input
                    className={fieldClass}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Farm address / village / town"
                  />
                </div>
              </div>
            </SectionCard>

            {/* Farm profile */}
            <SectionCard
              icon={Sprout}
              iconBg="bg-green-50 text-green-600"
              title="Farm Profile"
              subtitle="Your operation details used for market and harvest insights."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Farm Name</label>
                  <input
                    className={fieldClass}
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="My farm"
                  />
                </div>
                <div>
                  <label className={labelClass}>Farm Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      className={`${fieldClass} pl-10`}
                      value={farmLocation}
                      onChange={(e) => setFarmLocation(e.target.value)}
                      placeholder="Village / district / state"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Farm Type</label>
                  <div className="relative">
                    <select
                      className={`${fieldClass} appearance-none pr-10`}
                      value={farmType}
                      onChange={(e) => setFarmType(e.target.value)}
                    >
                      <option value="">Select type</option>
                      {FARM_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Farm Size</label>
                  <div className="flex gap-3">
                    <input
                      className={fieldClass}
                      type="number"
                      min="0"
                      value={farmSize}
                      onChange={(e) => setFarmSize(e.target.value)}
                      placeholder="10"
                    />
                    <select
                      className={`${fieldClass} w-36 appearance-none pr-10`}
                      value={farmSizeUnit}
                      onChange={(e) => setFarmSizeUnit(e.target.value)}
                    >
                      <option value="hectares">hectares</option>
                      <option value="acres">acres</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Irrigation Method</label>
                  <div className="relative">
                    <select
                      className={`${fieldClass} appearance-none pr-10`}
                      value={irrigation}
                      onChange={(e) => setIrrigation(e.target.value)}
                    >
                      <option value="">Select irrigation</option>
                      {IRRIGATION.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className={labelClass}>
                  Crops Grown
                  <span className="ml-1 font-normal normal-case text-slate-400">
                    (used for market windows & alerts)
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CROP_OPTIONS.map((crop) => (
                    <button
                      key={crop}
                      onClick={() => toggleCrop(crop)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        crops.includes(crop)
                          ? "bg-green-600 text-white shadow-md shadow-green-600/20"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {crop}
                    </button>
                  ))}
                </div>
              </div>
            </SectionCard>

            {/* Language & platform */}
            <SectionCard
              icon={Languages}
              iconBg="bg-violet-50 text-violet-600"
              title="Language & Platform"
              subtitle="App language and platform preferences."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>App Language</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <select
                      className={`${fieldClass} pl-10 appearance-none pr-10`}
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Your AI Agent listens and replies in this language.
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Weather & Alerts</label>
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-3">
                      <Droplets className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Spoilage alerts</p>
                        <p className="text-[11px] text-slate-400">
                          Weather-based, no key required
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-green-100 text-green-700 uppercase tracking-widest">
                      On
                    </span>
                  </div>
                </div>
              </div>
            </SectionCard>

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-black text-white text-sm font-semibold transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : savedFlash ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : null}
                {saving ? "Saving..." : savedFlash ? "Saved" : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* Mobile bottom nav */}
        <MobileNav />
      </main>
    </div>
  );
}
