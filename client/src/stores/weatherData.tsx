import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { GeocodeMatch, WeatherResponse } from "@weathergpt/shared";
import { api, ApiError } from "@/lib/api";

export type WeatherState =
  | { status: "idle" }
  | { status: "loading"; label: string }
  | { status: "success"; data: WeatherResponse; label: string }
  | { status: "error"; code: string; message: string; retry: () => void };

export interface ActiveLocation {
  label: string;
  lat: number;
  lon: number;
}

export interface SavedPlace extends ActiveLocation {
  id: string;
  savedAt: number;
}

interface CachedWeather {
  data: WeatherResponse;
  at: number;
}

interface WeatherDataContextValue {
  state: WeatherState;
  retry: () => void;
  /** Coordinates-first select once a geocoded match is chosen. */
  setActive: (location: ActiveLocation) => void;
  active: ActiveLocation | null;
  usingMyLocation: boolean;
  locate: () => void;
  locating: boolean;
  geoError: string | null;
  search: (query: string) => void;
  searching: boolean;
  results: GeocodeMatch[];
  searchError: string | null;
  clearResults: () => void;
  savedPlaces: SavedPlace[];
  savePlace: (location: ActiveLocation) => void;
  removePlace: (id: string) => void;
  refresh: () => void;
  clearCache: () => void;
}

const WeatherDataContext = createContext<WeatherDataContextValue | null>(null);

const CACHE_TTL_MS = 10 * 60_000;
const PLACES_KEY = "weathergpt-places";
const CACHE_KEY = "weathergpt-cache";

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(3)},${lon.toFixed(3)}`;
}

function readPlaces(): SavedPlace[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PLACES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedPlace[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (place) =>
        typeof place.id === "string" &&
        typeof place.label === "string" &&
        typeof place.lat === "number" &&
        typeof place.lon === "number",
    );
  } catch {
    return [];
  }
}

export function WeatherDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WeatherState>({ status: "idle" });
  const [active, setActiveState] = useState<ActiveLocation | null>(null);
  const [usingMyLocation, setUsingMyLocation] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<GeocodeMatch[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>(readPlaces);

  const cacheRef = useRef<Map<string, CachedWeather>>(new Map());
  const loadFnRef = useRef<((label: string, request: () => Promise<WeatherResponse>) => void) | null>(null);
  const activeRef = useRef<ActiveLocation | null>(null);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, CachedWeather>;
        if (parsed && typeof parsed === "object") {
          cacheRef.current = new Map(Object.entries(parsed));
        }
      }
    } catch {
      // corrupt cache is ignored
    }
  }, []);

  const load = useCallback(async (label: string, request: () => Promise<WeatherResponse>) => {
    setState({ status: "loading", label });
    try {
      const data = await request();
      setState({ status: "success", data, label });
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      setState({
        status: "error",
        code: apiError?.code ?? "UNKNOWN_ERROR",
        message: apiError?.message ?? "Something went wrong while fetching the weather.",
        retry: () => {
          if (loadFnRef.current) loadFnRef.current(label, request);
        },
      });
    }
  }, []);

  useEffect(() => {
    loadFnRef.current = load;
  }, [load]);

  const fetchByCoords = useCallback(
    (location: ActiveLocation) => {
      const key = cacheKey(location.lat, location.lon);
      const cached = cacheRef.current.get(key);
      if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
        setState({ status: "success", data: cached.data, label: location.label });
        return;
      }
      void load(location.label, async () => {
        const data = await api.getWeatherByCoords({ lat: location.lat, lon: location.lon });
        cacheRef.current.set(key, { data, at: Date.now() });
        try {
          window.localStorage.setItem(
            CACHE_KEY,
            JSON.stringify(Object.fromEntries(cacheRef.current.entries())),
          );
        } catch {
          // storage full — the in-memory cache still works for this session
        }
        return data;
      });
    },
    [load],
  );

  const setActive = useCallback(
    (location: ActiveLocation) => {
      setActiveState(location);
      setUsingMyLocation(false);
      setGeoError(null);
      fetchByCoords(location);
    },
    [fetchByCoords],
  );

  const retry = useCallback(() => {
    if (activeRef.current) fetchByCoords(activeRef.current);
  }, [fetchByCoords]);

  const refresh = useCallback(() => {
    if (!activeRef.current) return;
    const key = cacheKey(activeRef.current.lat, activeRef.current.lon);
    cacheRef.current.delete(key);
    fetchByCoords(activeRef.current);
  }, [fetchByCoords]);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoError("This browser does not support geolocation.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const label = "Your location";
        setUsingMyLocation(true);
        setActive({ label, lat: position.coords.latitude, lon: position.coords.longitude });
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError("Location access was denied. Allow it in your browser, or search instead.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGeoError("Your location is unavailable right now.");
        } else if (error.code === error.TIMEOUT) {
          setGeoError("Locating you took too long. Please try again.");
        } else {
          setGeoError("Could not determine your location.");
        }
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 120_000 },
    );
  }, [setActive]);

  const clearResults = useCallback(() => {
    setResults([]);
    setSearchError(null);
    setSearching(false);
  }, []);

  const search = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setResults([]);
        setSearchError(null);
        setSearching(false);
        return;
      }
      setSearching(true);
      setSearchError(null);
      void api
        .geocode(trimmed)
        .then((matches) => {
          setResults(matches.slice(0, 6));
          setSearching(false);
        })
        .catch((error) => {
          const apiError = error instanceof ApiError ? error : null;
          setSearchError(apiError?.message ?? "Search failed.");
          setResults([]);
          setSearching(false);
        });
    },
    [],
  );

  const savePlace = useCallback(
    (location: ActiveLocation) => {
      setSavedPlaces((current) => {
        const exists = current.some(
          (place) => Math.abs(place.lat - location.lat) < 0.001 && Math.abs(place.lon - location.lon) < 0.001,
        );
        if (exists) return current;
        const next: SavedPlace[] = [
          ...current,
          { ...location, id: `${location.lat.toFixed(4)},${location.lon.toFixed(4)}`, savedAt: Date.now() },
        ];
        try {
          window.localStorage.setItem(PLACES_KEY, JSON.stringify(next));
        } catch {
          // best effort
        }
        return next;
      });
    },
    [],
  );

  const removePlace = useCallback((id: string) => {
    setSavedPlaces((current) => {
      const next = current.filter((place) => place.id !== id);
      try {
        window.localStorage.setItem(PLACES_KEY, JSON.stringify(next));
      } catch {
        // best effort
      }
      return next;
    });
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current = new Map();
    try {
      window.localStorage.removeItem(CACHE_KEY);
    } catch {
      // best effort
    }
  }, []);

  const value = useMemo<WeatherDataContextValue>(
    () => ({
      state,
      retry,
      setActive,
      active,
      usingMyLocation,
      locate,
      locating,
      geoError,
      search,
      searching,
      results,
      searchError,
      clearResults,
      savedPlaces,
      savePlace,
      removePlace,
      refresh,
      clearCache,
    }),
    [
      state,
      retry,
      setActive,
      active,
      usingMyLocation,
      locate,
      locating,
      geoError,
      search,
      searching,
      results,
      searchError,
      clearResults,
      savedPlaces,
      savePlace,
      removePlace,
      refresh,
      clearCache,
    ],
  );

  return <WeatherDataContext.Provider value={value}>{children}</WeatherDataContext.Provider>;
}

export function useWeatherData(): WeatherDataContextValue {
  const context = useContext(WeatherDataContext);
  if (!context) {
    throw new Error("useWeatherData must be used inside a WeatherDataProvider");
  }
  return context;
}