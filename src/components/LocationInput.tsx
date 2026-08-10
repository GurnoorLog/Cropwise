import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, LocateFixed } from "lucide-react";
import { useGoogleMaps } from "../hooks/useGoogleMaps";

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: ReactNode;
}

type GoogleAutocomplete = {
  addListener: (event: string, cb: () => void) => void;
  getPlace: () => { formatted_address?: string; name?: string } | undefined;
};

export default function LocationInput({
  value,
  onChange,
  placeholder = "e.g. Agra, Uttar Pradesh",
  className = "",
  icon,
}: LocationInputProps) {
  const { loaded, error } = useGoogleMaps();
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    if (!loaded || !inputRef.current) return;
    const maps = (window as unknown as { google: any }).google.maps;
    const autocomplete = new maps.places.Autocomplete(inputRef.current, {
      types: ["(regions)"],
      componentRestrictions: { country: "IN" },
    }) as GoogleAutocomplete;

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const name = place?.formatted_address ?? place?.name;
      if (name) onChangeRef.current(name);
    });

    return () => {
      maps.event.clearInstanceListeners(autocomplete);
    };
  }, [loaded]);

  const detect = () => {
    if (!loaded || !("geolocation" in navigator)) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const maps = (window as unknown as { google: any }).google.maps;
        new maps.Geocoder().geocode(
          { location: { lat: pos.coords.latitude, lng: pos.coords.longitude } },
          (results: { formatted_address: string }[] | null, status: string) => {
            setDetecting(false);
            if (status === "OK" && results?.[0]?.formatted_address) {
              onChangeRef.current(results[0].formatted_address);
            }
          },
        );
      },
      () => setDetecting(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className="relative">
      {icon ? (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {icon}
        </span>
      ) : null}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${className} ${icon ? "pl-12" : ""} pr-14`}
      />
      <button
        type="button"
        onClick={detect}
        disabled={!loaded || detecting}
        aria-label="Detect my location"
        title={error ? "Location detection unavailable" : "Detect my location"}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        {detecting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <LocateFixed className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
