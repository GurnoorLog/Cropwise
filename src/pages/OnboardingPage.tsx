import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, MapPin, Phone, Mail, Sprout } from "lucide-react";
import { useAuth } from "../lib/auth";
import { ensureProfile, getProfile, saveProfile, setFarmCrops } from "../lib/profile";
import { LANGUAGES, languageName } from "../lib/languages";
import LocationInput from "../components/LocationInput";

const TOTAL_STEPS = 6;

const STEPS = [
  { title: "Farm Basics", subtitle: "Name & Location" },
  { title: "Language", subtitle: "Voice preference" },
  { title: "Crop Portfolio", subtitle: "Yield selection" },
  { title: "Farm Details", subtitle: "Scale & Infra" },
  { title: "Contact Info", subtitle: "Direct link" },
  { title: "Confirmation", subtitle: "Final Review" },
];

const FARM_TYPES = ["Vegetable", "Specialty", "Fruit", "Mixed"];
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
const IRRIGATION = ["Drip", "Sprinkler", "Flood", "Rain-fed"];
const STORAGE_OPTIONS = ["Cold Storage", "Greenhouse", "Packing Shed", "Processing Unit"];
const CONTACT_METHODS = ["Email", "Phone", "WhatsApp"];

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [farmName, setFarmName] = useState("");
  const [location, setLocation] = useState("");
  const [farmType, setFarmType] = useState("");
  const [language, setLanguage] = useState("en");
  const [crops, setCrops] = useState<string[]>([]);
  const [customCrop, setCustomCrop] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [farmSizeUnit, setFarmSizeUnit] = useState("hectares");
  const [irrigation, setIrrigation] = useState("");
  const [storage, setStorage] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [contactMethod, setContactMethod] = useState("Email");

  const email = (user?.user_metadata?.email as string) ?? user?.email ?? "";

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      if (!user) return;
      const profile = await getProfile(user.id);
      if (mounted && profile?.onboarded) {
        navigate("/dashboard", { replace: true });
      }
    };
    check();
    return () => {
      mounted = false;
    };
  }, [user, navigate]);

  const toggleCrop = (crop: string) =>
    setCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop],
    );

  const toggleStorage = (item: string) =>
    setStorage((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item],
    );

  const stepValid = (): boolean => {
    switch (step) {
      case 1:
        return farmName.trim().length > 0 && location.trim().length > 0 && farmType !== "";
      case 2:
        return true;
      case 3:
        return crops.length > 0;
      case 4:
        return farmSize.trim().length > 0 && Number(farmSize) > 0;
      case 5:
        return email.length > 0;
      default:
        return true;
    }
  };

  const next = () => {
    setError("");
    if (!stepValid()) {
      setError(step === 3 ? "Select at least one crop to continue." : "Please fill in the highlighted fields.");
      return;
    }
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  };

  const back = () => {
    setError("");
    if (step > 1) setStep((s) => s - 1);
  };

  const finalize = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      const profile = await ensureProfile(user);
      if (!profile) {
        setError("Could not create your profile. Please try again.");
        setSaving(false);
        return;
      }

      const allCrops = [...new Set([...crops, ...(customCrop.trim() ? [customCrop.trim()] : [])])];

      const saved = await saveProfile(user.id, {
        farm_name: farmName.trim(),
        farm_location: location.trim(),
        farm_type: farmType,
        language,
        farm_size: Number(farmSize),
        farm_size_unit: farmSizeUnit,
        irrigation_method: irrigation || null,
        storage_facilities: storage,
        phone: phone.trim() || null,
        address: address.trim() || null,
        preferred_contact: contactMethod,
      });

      if (!saved) {
        setError("Could not save your profile. Please try again.");
        setSaving(false);
        return;
      }

      const ok = await setFarmCrops(user.id, allCrops);
      if (!ok) {
        setError("Profile saved, but crop portfolio could not be stored. You can update it from the dashboard.");
      }

      navigate("/dashboard", { replace: true });
    } catch {
      setError("Unexpected error while saving. Please try again.");
      setSaving(false);
    }
  };

  const progressHeight = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  const indicatorClass = (i: number) => {
    if (i < step)
      return "w-10 h-10 rounded-full flex items-center justify-center bg-[#00d084] text-white text-sm font-bold border-2 border-[#00d084] transition-all duration-500";
    if (i === step)
      return "w-10 h-10 rounded-full flex items-center justify-center bg-black text-white text-sm font-bold border-2 border-black transition-all duration-500";
    return "w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white/40 text-sm font-bold border-2 border-white/10 transition-all duration-500";
  };

  const labelClass = (i: number) => {
    if (i < step) return "text-[#00d084] font-semibold text-sm";
    if (i === step) return "text-white font-semibold text-sm";
    return "text-white/40 font-semibold text-sm";
  };

  const inputClass =
    "w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 outline-none transition-all duration-300 focus:ring-2 focus:ring-black/5 focus:border-black";
  const labelClassSmall =
    "block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2";

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
        <div className="absolute inset-0 video-overlay" />
      </div>

      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-transparent border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-8 py-5 flex justify-between items-center">
          <span className="font-serif text-2xl text-white tracking-tight">
            Harvest Window
          </span>
          <div className="text-white/60 text-xs font-bold uppercase tracking-widest">
            Step <span>{step}</span> of {TOTAL_STEPS}
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-8 pt-32 pb-20 flex flex-col lg:flex-row gap-16">
        {/* Progress Sidebar */}
        <aside className="w-full lg:w-1/4 relative hidden lg:block fade-rise stagger-1">
          <div className="sticky top-32">
            <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
              Onboarding Progress
            </h3>
            <div className="relative flex flex-col gap-10">
              <div
                className="step-line-active"
                style={{ height: `${progressHeight}%` }}
              />
              <div className="step-line" />
              {STEPS.map((s, i) => (
                <div key={s.title} className="flex items-center gap-6 relative z-10">
                  <div className={indicatorClass(i + 1)}>
                    {i + 1 < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <div>
                    <p className={labelClass(i + 1)}>{s.title}</p>
                    <p className="text-white/40 text-xs">{s.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Form Card */}
        <div className="flex-1 fade-rise stagger-2">
          <div className="glass-card p-10 md:p-14 rounded-[40px] shadow-2xl overflow-hidden relative min-h-[600px] flex flex-col">
            {/* Step 1: Farm Basics */}
            {step === 1 && (
              <div className="space-y-8 animate-fade-in-up">
                <div className="space-y-4">
                  <h1 className="font-serif text-[40px] md:text-[48px] text-[#0f172a] leading-none tracking-[-2.46px]">
                    Let's start with the basics
                  </h1>
                  <p className="text-slate-500 text-lg">Establish your farm's digital footprint.</p>
                </div>
                <div className="grid gap-6">
                  <div>
                    <label className={labelClassSmall}>Farm Name</label>
                    <input
                      type="text"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      placeholder="e.g. Green Valley Estate"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClassSmall}>Location</label>
                    <LocationInput
                      value={location}
                      onChange={setLocation}
                      placeholder="e.g. Agra, Uttar Pradesh"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClassSmall}>Farm Type</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {FARM_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFarmType(type)}
                          className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                            farmType === type
                              ? "border-black bg-black text-white"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Language */}
            {step === 2 && (
              <div className="space-y-8 animate-fade-in-up">
                <div className="space-y-4">
                  <h1 className="font-serif text-[40px] md:text-[48px] text-[#0f172a] leading-none tracking-[-2.46px]">
                    Which language do you prefer?
                  </h1>
                  <p className="text-slate-500 text-lg">Your AI agent will listen and reply in this language.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLanguage(l.code)}
                      className={`px-5 py-4 rounded-2xl border flex items-center gap-4 transition-all ${
                        language === l.code
                          ? "border-black bg-black text-white"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-2xl leading-none w-14 text-center shrink-0">{l.native}</span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold">{l.name}</span>
                      </span>
                      {language === l.code && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Crop Portfolio */}
            {step === 3 && (
              <div className="space-y-8 animate-fade-in-up">
                <div className="space-y-4">
                  <h1 className="font-serif text-[40px] md:text-[48px] text-[#0f172a] leading-none tracking-[-2.46px]">
                    What do you grow?
                  </h1>
                  <p className="text-slate-500 text-lg">Select the varieties you wish to track.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {CROP_OPTIONS.map((crop) => {
                    const selected = crops.includes(crop);
                    return (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => toggleCrop(crop)}
                        className={`px-5 py-3 rounded-full border text-sm font-medium flex items-center gap-2 transition-all ${
                          selected
                            ? "border-black bg-black text-white"
                            : "border-slate-200 text-slate-600 hover:border-black"
                        }`}
                      >
                        {crop}
                        {selected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customCrop}
                      onChange={(e) => setCustomCrop(e.target.value)}
                      placeholder="+ Add Custom Crop"
                      className="px-5 py-3 rounded-full border border-dashed border-slate-300 text-slate-500 text-sm font-medium bg-transparent outline-none placeholder:text-slate-400 focus:border-slate-500 transition-all w-44"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Farm Details */}
            {step === 4 && (
              <div className="space-y-8 animate-fade-in-up">
                <div className="space-y-4">
                  <h1 className="font-serif text-[40px] md:text-[48px] text-[#0f172a] leading-none tracking-[-2.46px]">
                    Farm scale & infrastructure
                  </h1>
                  <p className="text-slate-500 text-lg">Help us size your operation and capabilities.</p>
                </div>
                <div className="grid gap-6">
                  <div>
                    <label className={labelClassSmall}>Farm Size</label>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        min="0"
                        value={farmSize}
                        onChange={(e) => setFarmSize(e.target.value)}
                        placeholder="e.g. 12"
                        className={inputClass}
                      />
                      <select
                        value={farmSizeUnit}
                        onChange={(e) => setFarmSizeUnit(e.target.value)}
                        className={inputClass + " w-40"}
                      >
                        <option value="hectares">Hectares</option>
                        <option value="acres">Acres</option>
                        <option value="sqm">Square metres</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClassSmall}>Irrigation Method</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {IRRIGATION.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setIrrigation(m)}
                          className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                            irrigation === m
                              ? "border-black bg-black text-white"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClassSmall}>Storage & Processing Facilities</label>
                    <div className="flex flex-wrap gap-3">
                      {STORAGE_OPTIONS.map((s) => {
                        const selected = storage.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleStorage(s)}
                            className={`px-5 py-3 rounded-full border text-sm font-medium flex items-center gap-2 transition-all ${
                              selected
                                ? "border-black bg-black text-white"
                                : "border-slate-200 text-slate-600 hover:border-black"
                            }`}
                          >
                            {s}
                            {selected && <Check className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Contact Info */}
            {step === 5 && (
              <div className="space-y-8 animate-fade-in-up">
                <div className="space-y-4">
                  <h1 className="font-serif text-[40px] md:text-[48px] text-[#0f172a] leading-none tracking-[-2.46px]">
                    Where can we reach you?
                  </h1>
                  <p className="text-slate-500 text-lg">Buyers reach out through these channels.</p>
                </div>
                <div className="grid gap-6">
                  <div>
                    <label className={labelClassSmall}>Email</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        readOnly
                        className={inputClass + " pl-12 opacity-70 cursor-not-allowed"}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClassSmall}>Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className={inputClass + " pl-12"}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClassSmall}>Farm Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-5 top-5 w-4 h-4 text-slate-400" />
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street, village, district, state"
                        rows={2}
                        className={inputClass + " pl-12 resize-none"}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClassSmall}>Preferred Contact Method</label>
                    <div className="grid grid-cols-3 gap-3">
                      {CONTACT_METHODS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setContactMethod(m)}
                          className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                            contactMethod === m
                              ? "border-black bg-black text-white"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Confirmation */}
            {step === 6 && (
              <div className="space-y-8 animate-fade-in-up">
                <div className="space-y-4">
                  <h1 className="font-serif text-[40px] md:text-[48px] text-[#0f172a] leading-none tracking-[-2.46px]">
                    Ready to start growing
                  </h1>
                  <p className="text-slate-500 text-lg">Review your profile and finalize.</p>
                </div>
                <div className="grid gap-4">
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50">
                    <div className="w-10 h-10 bg-green-100 text-green-700 rounded-xl flex items-center justify-center shrink-0">
                      <Sprout className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Farm</p>
                      <p className="text-sm font-bold text-slate-900">
                        {farmName} — {farmType} ({farmSize} {farmSizeUnit})
                      </p>
                      <p className="text-xs text-slate-500">{location}</p>
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Crop Portfolio ({crops.length + (customCrop.trim() ? 1 : 0)})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[...crops, ...(customCrop.trim() ? [customCrop.trim()] : [])].map((c) => (
                        <span
                          key={c}
                          className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                    {irrigation && (
                      <p className="text-xs text-slate-500 mt-3">
                        Irrigation: <span className="font-semibold text-slate-700">{irrigation}</span>
                        {storage.length > 0 && (
                          <>
                            {" · "}Facilities: <span className="font-semibold text-slate-700">{storage.join(", ")}</span>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contact</p>
                    <p className="text-sm font-bold text-slate-900">{email}</p>
                    {phone && <p className="text-sm text-slate-600">{phone}</p>}
                    {address && <p className="text-xs text-slate-500">{address}</p>}
                    <p className="text-xs text-slate-500 mt-1">
                      Preferred: <span className="font-semibold text-slate-700">{contactMethod}</span>
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Language</p>
                    <p className="text-sm font-bold text-slate-900">
                      {languageName(language)}{" "}
                      <span className="text-slate-400 font-medium">
                        {LANGUAGES.find((l) => l.code === language)?.native}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Used by your AI agent for voice.</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="mt-6 text-sm font-medium text-red-500">{error}</p>
            )}

            {/* Footer Navigation */}
            <div className="mt-auto pt-16 flex items-center justify-between">
              <button
                onClick={back}
                className={`px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 border border-black hover:bg-black hover:text-white ${
                  step === 1 ? "opacity-0 pointer-events-none" : "text-black"
                }`}
              >
                Back
              </button>
              {saving ? (
                <button
                  disabled
                  className="px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest bg-black text-white shadow-lg shadow-black/10 flex items-center gap-2 opacity-70 cursor-not-allowed"
                >
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                </button>
              ) : (
                <button
                  onClick={step === TOTAL_STEPS ? finalize : next}
                  className="px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest bg-black text-white shadow-lg shadow-black/10 pill-button"
                >
                  {step === TOTAL_STEPS ? "Finalize Profile" : "Continue"}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="z-10 p-8 text-center">
        <p className="text-white/20 text-[10px] tracking-[0.3em] uppercase">
          Empowering global estates since 2024
        </p>
      </footer>
    </div>
  );
}
