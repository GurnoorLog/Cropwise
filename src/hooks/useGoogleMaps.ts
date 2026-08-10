import { useEffect, useState } from "react";

const API_KEY: string | undefined = import.meta.env.VITE_GOOGLE_MAPS_KEY as
  | string
  | undefined;

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  if (!API_KEY) {
    scriptPromise = Promise.reject(new Error("VITE_GOOGLE_MAPS_KEY is not set"));
    return scriptPromise;
  }
  if (typeof window !== "undefined" && (window as { google?: unknown }).google) {
    scriptPromise = Promise.resolve();
    return scriptPromise;
  }
  scriptPromise = new Promise((resolve, reject) => {
    const w = window as unknown as { __googleMapsLoaded?: () => void };
    w.__googleMapsLoaded = () => resolve();
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&loading=async&callback=__googleMapsLoaded`;
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export interface GoogleMapsState {
  loaded: boolean;
  error: string | null;
}

export function useGoogleMaps(): GoogleMapsState {
  const [state, setState] = useState<GoogleMapsState>({ loaded: false, error: null });

  useEffect(() => {
    let mounted = true;
    loadScript()
      .then(() => {
        if (mounted) setState({ loaded: true, error: null });
      })
      .catch((e: unknown) => {
        if (mounted)
          setState({ loaded: false, error: e instanceof Error ? e.message : String(e) });
      });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
