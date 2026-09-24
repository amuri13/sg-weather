import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Thermometer,
  CloudRain,
  Droplets,
  Wind,
  RefreshCw,
  MapPin,
  Clock,
  AlertTriangle,
  Info,
  Activity,
  Sun,
  ShieldAlert,
  Calendar,
  Layers,
  CloudSun,
  Sparkles,
  Gauge
} from 'lucide-react';
import { WeatherResponse, ForecastItem, SingaporeRegion } from '../types.ts';
import { WeatherIcon } from './WeatherIcon.tsx';

export type WeatherTab = 'live' | 'air' | 'forecast24' | 'outlook4d';

export const REGION_AREAS: Record<SingaporeRegion, string[]> = {
  North: [
    'Woodlands',
    'Yishun',
    'Sembawang',
    'Canberra',
    'Admiralty',
    'Khatib',
    'Mandai',
    'Sungei Kadut',
    'Lim Chu Kang',
    'Seletar',
  ],
  South: [
    'HarbourFront',
    'Sentosa',
    'Telok Blangah',
    'Tiong Bahru',
    'Alexandra',
    'Queenstown',
    'Bukit Merah',
    'Southern Islands',
  ],
  East: [
    'Tampines',
    'Pasir Ris',
    'Bedok',
    'Simei',
    'Changi',
    'Paya Lebar',
    'Katong',
    'Marine Parade',
    'Geylang',
    'Hougang',
    'Serangoon',
    'Sengkang',
    'Punggol',
    'Pulau Ubin',
    'Pulau Tekong',
  ],
  West: [
    'Jurong',
    'Clementi',
    'Bukit Batok',
    'Bukit Panjang',
    'Choa Chu Kang',
    'Boon Lay',
    'Jurong East',
    'Jurong West',
    'Jurong Island',
    'Pioneer',
    'Tuas',
    'Tengah',
    'Bukit Timah',
    'Jalan Bahar',
    'Western Islands',
    'Western Water Catchment',
  ],
  Central: [
    'Orchard',
    'River Valley',
    'Novena',
    'Newton',
    'Bishan',
    'Toa Payoh',
    'Kallang',
    'Bugis',
    'City Hall',
    'Marina Bay',
    'City',
    'Ang Mo Kio',
    'Tanglin',
    'Central Water Catchment',
  ],
};

const REGION_DEFAULT_AREAS: Record<SingaporeRegion, string> = {
  North: 'Woodlands',
  South: 'HarbourFront',
  East: 'Tampines',
  West: 'Jurong',
  Central: 'Orchard',
};

const SECTOR_ACCENTS: Record<
  SingaporeRegion,
  {
    bgActive: string;
    borderActive: string;
    textActive: string;
    dot: string;
    badge: string;
  }
> = {
  North: {
    bgActive: 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs shadow-emerald-500/20',
    borderActive: 'border-emerald-500 dark:border-emerald-400',
    textActive: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  South: {
    bgActive: 'bg-sky-600 dark:bg-sky-500 text-white shadow-xs shadow-sky-500/20',
    borderActive: 'border-sky-500 dark:border-sky-400',
    textActive: 'text-sky-700 dark:text-sky-400',
    dot: 'bg-sky-500',
    badge: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  East: {
    bgActive: 'bg-amber-600 dark:bg-amber-500 text-white shadow-xs shadow-amber-500/20',
    borderActive: 'border-amber-500 dark:border-amber-400',
    textActive: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  West: {
    bgActive: 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-xs shadow-indigo-500/20',
    borderActive: 'border-indigo-500 dark:border-indigo-400',
    textActive: 'text-indigo-700 dark:text-indigo-400',
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  Central: {
    bgActive: 'bg-rose-600 dark:bg-rose-500 text-white shadow-xs shadow-rose-500/20',
    borderActive: 'border-rose-500 dark:border-rose-400',
    textActive: 'text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
};

function getRegionForArea(area: string): SingaporeRegion {
  const cleanArea = area.replace(/\s*\([^)]*\)/, '').trim().toLowerCase();
  for (const [region, areas] of Object.entries(REGION_AREAS)) {
    if (areas.some((a) => a.toLowerCase() === cleanArea)) {
      return region as SingaporeRegion;
    }
  }
  return 'Central';
}

function formatMinutesAgo(timestamp: string | null | undefined): string {
  if (!timestamp) return '';
  const parsed = new Date(timestamp).getTime();
  if (isNaN(parsed)) return '';
  const diffMs = Math.max(0, Date.now() - parsed);
  const minutes = Math.floor(diffMs / 60000);
  return `Updated ${minutes} min ago`;
}

function formatValidPeriod(period: ForecastItem['validPeriod']): string {
  if (!period) return '';
  if (period.text) return period.text;
  return '';
}

interface WeatherPanelProps {
  isDarkMode?: boolean;
}

export const WeatherPanel: React.FC<WeatherPanelProps> = () => {
  const [selectedRegion, setSelectedRegion] = useState<SingaporeRegion>('Central');
  const [selectedArea, setSelectedArea] = useState<string>('Orchard');
  const [activeTab, setActiveTab] = useState<WeatherTab>('live');

  const [data, setData] = useState<WeatherResponse | null>(null);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState<number>(60);

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchWeather = useCallback(async (areaName: string, isManual = false) => {
    if (isManual) {
      setRefreshing(true);
    }
    setFetchError(null);

    try {
      const encoded = encodeURIComponent(areaName);
      const res = await fetch(`/api/weather?Area=${encoded}`);
      const json: WeatherResponse = await res.json();

      if (!res.ok) {
        if (res.status === 400 && json.validAreas) {
          setAvailableAreas(json.validAreas);
          setFetchError(`Unknown area "${areaName}". Please choose from the list.`);
        } else {
          setFetchError(json.error || `Error fetching weather (HTTP ${res.status})`);
        }
        return;
      }

      setData(json);
      if (Array.isArray(json.validAreas) && json.validAreas.length > 0) {
        setAvailableAreas(json.validAreas);
      }
      if (json.region) {
        const reg = json.region as SingaporeRegion;
        if (['North', 'South', 'East', 'West', 'Central'].includes(reg)) {
          setSelectedRegion(reg);
        }
      }
      setSecondsUntilRefresh(60);
    } catch (err: any) {
      setFetchError(err?.message || 'Failed to reach weather service');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(selectedArea);
  }, [selectedArea, fetchWeather]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchWeather(selectedArea);
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedArea, fetchWeather]);

  useEffect(() => {
    countdownTimerRef.current = setInterval(() => {
      setSecondsUntilRefresh((prev) => (prev > 1 ? prev - 1 : 60));
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  const handleRegionSelect = (region: SingaporeRegion) => {
    setSelectedRegion(region);
    const defaultArea = REGION_DEFAULT_AREAS[region];
    setSelectedArea(defaultArea);
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextArea = e.target.value;
    setSelectedArea(nextArea);
    const region = getRegionForArea(nextArea);
    setSelectedRegion(region);
  };

  const handleManualRefresh = () => {
    fetchWeather(selectedArea, true);
  };

  const isTempValid =
    data?.temperature?.value !== null &&
    data?.temperature?.value !== undefined &&
    typeof data.temperature.value === 'number' &&
    !Number.isNaN(data.temperature.value);

  const isRainValid =
    data?.rainfall?.value !== null &&
    data?.rainfall?.value !== undefined &&
    typeof data.rainfall.value === 'number' &&
    !Number.isNaN(data.rainfall.value);

  const isHumidityValid =
    data?.humidity?.value !== null &&
    data?.humidity?.value !== undefined &&
    typeof data.humidity.value === 'number' &&
    !Number.isNaN(data.humidity.value);

  const isWindValid =
    data?.windSpeed?.value !== null &&
    data?.windSpeed?.value !== undefined &&
    typeof data.windSpeed.value === 'number' &&
    !Number.isNaN(data.windSpeed.value);

  const isForecastValid =
    data?.forecast &&
    Boolean(data.forecast.text || data.forecast.forecast) &&
    !data.forecast.error;

  const isPsiValid =
    data?.psi?.psi24Hourly !== null &&
    data?.psi?.psi24Hourly !== undefined &&
    !data.psi.error;

  const isPm25Valid =
    data?.pm25?.pm25OneHourly !== null &&
    data?.pm25?.pm25OneHourly !== undefined &&
    !data.pm25.error;

  const isUvValid =
    data?.uv?.value !== null &&
    data?.uv?.value !== undefined &&
    !data.uv.error;

  const isTwentyFourHrValid =
    data?.twentyFourHr &&
    (Boolean(data.twentyFourHr.general) || data.twentyFourHr.periods.length > 0) &&
    !data.twentyFourHr.error;

  const isFourDayValid =
    data?.fourDayOutlook &&
    Array.isArray(data.fourDayOutlook.forecasts) &&
    data.fourDayOutlook.forecasts.length > 0 &&
    !data.fourDayOutlook.error;

  const regionSpecificAreas = availableAreas.length > 0
    ? REGION_AREAS[selectedRegion]?.filter((a) => availableAreas.includes(a)) || REGION_AREAS[selectedRegion]
    : REGION_AREAS[selectedRegion];

  const regions: SingaporeRegion[] = ['North', 'South', 'East', 'West', 'Central'];
  const activeSectorTheme = SECTOR_ACCENTS[selectedRegion] || SECTOR_ACCENTS.Central;

  // Compute dynamic hero background style based on forecast
  const forecastText = (data?.forecast?.text || data?.forecast?.forecast || '').toLowerCase();
  let heroGradient = 'from-slate-900 via-indigo-950 to-slate-900 border-indigo-900/40';
  if (forecastText.includes('thunder') || forecastText.includes('thundery')) {
    heroGradient = 'from-slate-900 via-blue-950 to-indigo-950 border-cyan-800/40';
  } else if (forecastText.includes('fair') || forecastText.includes('sun')) {
    heroGradient = 'from-sky-900 via-indigo-950 to-amber-950 border-amber-800/40';
  } else if (forecastText.includes('cloud') || forecastText.includes('overcast')) {
    heroGradient = 'from-slate-900 via-slate-850 to-sky-950 border-sky-900/40';
  } else if (forecastText.includes('rain') || forecastText.includes('shower')) {
    heroGradient = 'from-slate-900 via-blue-950 to-slate-900 border-blue-800/40';
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden transition-colors duration-200">
      {/* Persistent Sector Buttons, Area Selector, Refresh Action */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-4 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-2xs transition-colors duration-200">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* 5-Sector Segmented Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 hidden md:inline">
              Sector:
            </span>
            {regions.map((reg) => {
              const isActive = selectedRegion === reg;
              const sectorStyle = SECTOR_ACCENTS[reg];
              return (
                <button
                  key={reg}
                  onClick={() => handleRegionSelect(reg)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                    isActive
                      ? sectorStyle.bgActive
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-white' : sectorStyle.dot
                      }`}
                    />
                    <span>{reg}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Area Dropdown with Sector Color Hint */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
              Area:
            </span>
            <div className="relative">
              <select
                id="area-select"
                value={selectedArea}
                onChange={handleAreaChange}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 appearance-none cursor-pointer shadow-2xs transition-colors duration-150"
              >
                <optgroup label={`${selectedRegion} Sector Areas`}>
                  {regionSpecificAreas.map((areaName) => (
                    <option key={areaName} value={areaName}>
                      {areaName}
                    </option>
                  ))}
                </optgroup>
                {availableAreas.length > 0 && (
                  <optgroup label="All Other Singapore Areas">
                    {availableAreas
                      .filter((a) => !regionSpecificAreas.includes(a))
                      .map((areaName) => (
                        <option key={areaName} value={areaName}>
                          {areaName}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-sky-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Refresh & Countdown Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
            aria-label="Refresh live data"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/70 hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-150 disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-sky-500 ${
                refreshing ? 'animate-spin' : ''
              }`}
            />
            <span className="hidden sm:inline">Refresh</span>
            <span className="font-mono tabular-nums text-slate-400 dark:text-slate-500 text-[11px]">
              {secondsUntilRefresh}s
            </span>
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation Bar */}
      <div className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-4 py-1.5 shrink-0 flex items-center justify-between gap-2 overflow-x-auto transition-colors duration-200">
        <nav className="flex items-center gap-1" aria-label="Weather panels">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
              activeTab === 'live'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/90 dark:border-slate-700 ring-1 ring-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <CloudSun className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            <span>Live Weather</span>
          </button>

          <button
            onClick={() => setActiveTab('air')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
              activeTab === 'air'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/90 dark:border-slate-700 ring-1 ring-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Air Quality & UV</span>
          </button>

          <button
            onClick={() => setActiveTab('forecast24')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
              activeTab === 'forecast24'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/90 dark:border-slate-700 ring-1 ring-indigo-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>24-Hour Forecast</span>
          </button>

          <button
            onClick={() => setActiveTab('outlook4d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
              activeTab === 'outlook4d'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/90 dark:border-slate-700 ring-1 ring-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>4-Day Outlook</span>
          </button>
        </nav>

        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          <span>SGT (UTC+8)</span>
        </div>
      </div>

      {/* Global Fetch Error Notice if upstream fails */}
      {fetchError && (
        <div className="mx-4 mt-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200 shrink-0 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="truncate">{fetchError}</span>
        </div>
      )}

      {/* Single Viewport Tab Content Container (No Page Scroll) */}
      <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-hidden flex flex-col justify-start">
        {/* ========================================================================= */}
        {/* TAB 1: LIVE WEATHER */}
        {/* ========================================================================= */}
        {activeTab === 'live' && (
          <div className="h-full flex flex-col justify-between space-y-3">
            {/* Primary Forecast Hero Banner with Dynamic Gradient */}
            <div
              className={`bg-gradient-to-r ${heroGradient} text-white rounded-2xl p-4 sm:p-5 relative overflow-hidden border shadow-sm shrink-0 transition-all duration-300`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-300 text-xs font-medium">
                    <span className="px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-xs font-semibold text-white">
                      {selectedRegion} Sector
                    </span>
                    <span className="text-white font-semibold">
                      {data?.area || selectedArea}
                    </span>
                    <span aria-hidden="true" className="text-slate-400">·</span>
                    <span>2-Hour Forecast</span>
                    {data?.forecast?.timestamp && (
                      <>
                        <span aria-hidden="true" className="text-slate-400">·</span>
                        <span className="font-mono tabular-nums text-slate-300">
                          {formatMinutesAgo(data.forecast.timestamp)}
                        </span>
                      </>
                    )}
                  </div>

                  {loading && !data ? (
                    <div className="h-8 w-48 bg-white/20 animate-pulse rounded my-1" />
                  ) : isForecastValid ? (
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                      <span>{data?.forecast?.text || data?.forecast?.forecast}</span>
                    </h2>
                  ) : (
                    <p className="text-sm text-slate-300 font-normal">
                      2-hour forecast not available right now
                    </p>
                  )}

                  {isForecastValid && data?.forecast?.validPeriod && (
                    <p className="text-xs text-slate-300 flex items-center gap-1.5 pt-0.5">
                      <Clock className="w-3.5 h-3.5 text-sky-300" />
                      <span>Valid period: {formatValidPeriod(data.forecast.validPeriod)}</span>
                    </p>
                  )}
                </div>

                <div className="shrink-0 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner flex items-center justify-center">
                  <WeatherIcon
                    text={data?.forecast?.text || data?.forecast?.forecast}
                    code={data?.forecast?.code}
                    className="w-10 h-10 text-white drop-shadow"
                  />
                </div>
              </div>
            </div>

            {/* 4 Live Metric Readings with Colorful Gradient Backplates */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1 min-h-0">
              {/* 1. Air Temperature (Rose/Orange) */}
              <div className="bg-gradient-to-br from-rose-50/70 via-white to-orange-50/30 dark:from-rose-950/20 dark:via-slate-900 dark:to-orange-950/10 border border-rose-200/80 dark:border-rose-900/40 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs transition-colors duration-200">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400">
                      Air Temperature
                    </span>
                    <div className="p-1.5 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                      <Thermometer className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    {loading && !data ? (
                      <div className="h-8 w-20 bg-rose-100/60 dark:bg-rose-950/40 animate-pulse rounded" />
                    ) : isTempValid ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                          {(data!.temperature.value as number).toFixed(1)}
                        </span>
                        <span className="text-sm font-bold text-rose-600 dark:text-rose-400">°C</span>
                        {data?.temperature?.timestamp && (
                          <span className="text-[10px] text-slate-400 font-mono tabular-nums ml-auto">
                            {formatMinutesAgo(data.temperature.timestamp)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Temperature reading not available right now
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-rose-100 dark:border-rose-900/40 text-[11px] text-slate-600 dark:text-slate-400 truncate">
                  {isTempValid && (data?.temperature?.areaName || data?.temperature?.stationName) ? (
                    <span>
                      <strong className="text-slate-800 dark:text-slate-200 font-medium">Area:</strong>{' '}
                      {data.temperature.areaName || data.temperature.stationName}
                      {data.temperature.distanceKm !== null && ` · ${data.temperature.distanceKm} km`}
                    </span>
                  ) : (
                    <span className="text-slate-400">Nearest Observation Area lookup</span>
                  )}
                </div>
              </div>

              {/* 2. Rainfall (Blue/Cyan) */}
              <div className="bg-gradient-to-br from-blue-50/70 via-white to-cyan-50/30 dark:from-blue-950/20 dark:via-slate-900 dark:to-cyan-950/10 border border-blue-200/80 dark:border-blue-900/40 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs transition-colors duration-200">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                      Rainfall
                    </span>
                    <div className="p-1.5 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                      <CloudRain className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    {loading && !data ? (
                      <div className="h-8 w-20 bg-blue-100/60 dark:bg-blue-950/40 animate-pulse rounded" />
                    ) : isRainValid ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                          {(data!.rainfall.value as number).toFixed(1)}
                        </span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">mm</span>
                        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-300 ml-1">
                          {(data!.rainfall.value as number) === 0 ? 'No rain' : 'Active rain'}
                        </span>
                        {data?.rainfall?.timestamp && (
                          <span className="text-[10px] text-slate-400 font-mono tabular-nums ml-auto">
                            {formatMinutesAgo(data.rainfall.timestamp)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Rainfall reading not available right now
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-blue-100 dark:border-blue-900/40 text-[11px] text-slate-600 dark:text-slate-400 truncate">
                  {isRainValid && (data?.rainfall?.areaName || data?.rainfall?.stationName) ? (
                    <span>
                      <strong className="text-slate-800 dark:text-slate-200 font-medium">Area:</strong>{' '}
                      {data.rainfall.areaName || data.rainfall.stationName}
                      {data.rainfall.distanceKm !== null && ` · ${data.rainfall.distanceKm} km`}
                    </span>
                  ) : (
                    <span className="text-slate-400">Nearest Observation Area lookup</span>
                  )}
                </div>
              </div>

              {/* 3. Relative Humidity (Teal/Emerald) */}
              <div className="bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/30 dark:from-teal-950/20 dark:via-slate-900 dark:to-emerald-950/10 border border-teal-200/80 dark:border-teal-900/40 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs transition-colors duration-200">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                      Relative Humidity
                    </span>
                    <div className="p-1.5 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400">
                      <Droplets className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    {loading && !data ? (
                      <div className="h-8 w-20 bg-teal-100/60 dark:bg-teal-950/40 animate-pulse rounded" />
                    ) : isHumidityValid ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                          {Math.round(data!.humidity.value as number)}
                        </span>
                        <span className="text-sm font-bold text-teal-600 dark:text-teal-400">%</span>
                        <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-300 ml-1">
                          {(data!.humidity.value as number) > 85
                            ? 'High Tropical'
                            : (data!.humidity.value as number) >= 70
                            ? 'Humid'
                            : 'Moderate'}
                        </span>
                        {data?.humidity?.timestamp && (
                          <span className="text-[10px] text-slate-400 font-mono tabular-nums ml-auto">
                            {formatMinutesAgo(data.humidity.timestamp)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Humidity reading not available right now
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-teal-100 dark:border-teal-900/40 text-[11px] text-slate-600 dark:text-slate-400 truncate">
                  {isHumidityValid && (data?.humidity?.areaName || data?.humidity?.stationName) ? (
                    <span>
                      <strong className="text-slate-800 dark:text-slate-200 font-medium">Area:</strong>{' '}
                      {data.humidity.areaName || data.humidity.stationName}
                      {data.humidity.distanceKm !== null && ` · ${data.humidity.distanceKm} km`}
                    </span>
                  ) : (
                    <span className="text-slate-400">Nearest Observation Area lookup</span>
                  )}
                </div>
              </div>

              {/* 4. Wind Speed (Indigo/Sky) */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/30 dark:from-indigo-950/20 dark:via-slate-900 dark:to-sky-950/10 border border-indigo-200/80 dark:border-indigo-900/40 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs transition-colors duration-200">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                      Wind Speed
                    </span>
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                      <Wind className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    {loading && !data ? (
                      <div className="h-8 w-20 bg-indigo-100/60 dark:bg-indigo-950/40 animate-pulse rounded" />
                    ) : isWindValid ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                          {(data!.windSpeed.value as number).toFixed(1)}
                        </span>
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">knots</span>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 ml-1">
                          (~{((data!.windSpeed.value as number) * 1.852).toFixed(1)} km/h)
                        </span>
                        {data?.windSpeed?.timestamp && (
                          <span className="text-[10px] text-slate-400 font-mono tabular-nums ml-auto">
                            {formatMinutesAgo(data.windSpeed.timestamp)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Wind speed reading not available right now
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-600 dark:text-slate-400 truncate">
                  {isWindValid && (data?.windSpeed?.areaName || data?.windSpeed?.stationName) ? (
                    <span>
                      <strong className="text-slate-800 dark:text-slate-200 font-medium">Area:</strong>{' '}
                      {data.windSpeed.areaName || data.windSpeed.stationName}
                      {data.windSpeed.distanceKm !== null && ` · ${data.windSpeed.distanceKm} km`}
                    </span>
                  ) : (
                    <span className="text-slate-400">Nearest Observation Area lookup</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Meta Ribbon */}
            <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0 shadow-2xs transition-colors duration-200">
              <div className="flex items-center gap-2 truncate">
                <Info className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="truncate">
                  Readings computed via Haversine distance from {data?.area || selectedArea} centroid to nearest observation Area.
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-slate-500 dark:text-slate-400 shrink-0 ml-2 hidden sm:flex">
                <span className={`w-2 h-2 rounded-full ${activeSectorTheme.dot}`} />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {selectedRegion} Sector
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: AIR QUALITY & UV */}
        {/* ========================================================================= */}
        {activeTab === 'air' && (
          <div className="h-full flex flex-col justify-between space-y-3">
            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
              {/* PSI Card (Emerald) */}
              <div className="bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 dark:from-emerald-950/25 dark:via-slate-900 dark:to-teal-950/15 border border-emerald-200/80 dark:border-emerald-900/50 rounded-xl p-4 shadow-2xs transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    24-Hour PSI ({selectedRegion})
                  </span>
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  {isPsiValid ? (
                    <>
                      <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                        {data!.psi.psi24Hourly}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                        {data!.psi.statusDescriptor}
                      </span>
                      {data?.psi.timestamp && (
                        <span className="text-[10px] text-slate-400 font-mono tabular-nums ml-auto">
                          {formatMinutesAgo(data.psi.timestamp)}
                        </span>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">PSI reading not available right now</p>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Pollutant Standards Index for {selectedRegion} sector
                </p>
              </div>

              {/* PM2.5 Card (Sky/Cyan) */}
              <div className="bg-gradient-to-br from-sky-50/70 via-white to-blue-50/40 dark:from-sky-950/25 dark:via-slate-900 dark:to-blue-950/15 border border-sky-200/80 dark:border-sky-900/50 rounded-xl p-4 shadow-2xs transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-800 dark:text-sky-300">
                    1-Hour PM2.5 ({selectedRegion})
                  </span>
                  <div className="p-1.5 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  {isPm25Valid ? (
                    <>
                      <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                        {data!.pm25.pm25OneHourly}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">µg/m³</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-700 ml-1">
                        {data!.pm25.statusDescriptor}
                      </span>
                      {data?.pm25.timestamp && (
                        <span className="text-[10px] text-slate-400 font-mono tabular-nums ml-auto">
                          {formatMinutesAgo(data.pm25.timestamp)}
                        </span>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">PM2.5 reading not available right now</p>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Fine particulate matter for {selectedRegion} sector
                </p>
              </div>

              {/* UV Index Card (Amber/Sun) */}
              <div className="bg-gradient-to-br from-amber-50/70 via-white to-yellow-50/40 dark:from-amber-950/25 dark:via-slate-900 dark:to-yellow-950/15 border border-amber-200/80 dark:border-amber-900/50 rounded-xl p-4 shadow-2xs transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    Solar UV Index
                  </span>
                  <div className="p-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <Sun className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  {isUvValid ? (
                    <>
                      <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                        {data!.uv.value}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 ml-1">
                        {data!.uv.category}
                      </span>
                      {data?.uv.timestamp && (
                        <span className="text-[10px] text-slate-400 font-mono tabular-nums ml-auto">
                          {formatMinutesAgo(data.uv.timestamp)}
                        </span>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">UV reading not available right now</p>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Solar ultraviolet radiation level across Singapore
                </p>
              </div>
            </div>

            {/* Regional 5-Sector Comparison Matrix (North, South, East, West, Central) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex-1 flex flex-col justify-between shadow-2xs transition-colors duration-200">
              <div className="text-xs font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-sky-500" />
                  <span>Islandwide Regional Breakdown (5 Sectors)</span>
                </span>
                <span className="font-normal text-[11px] text-slate-400">
                  data.gov.sg real-time telemetry
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 my-auto py-2">
                {(['north', 'south', 'east', 'west', 'central'] as const).map((sec) => {
                  const psiVal = data?.psi?.readingsByRegion?.[sec];
                  const pmVal = data?.pm25?.readingsByRegion?.[sec];
                  const isCurrent = selectedRegion.toLowerCase() === sec;
                  const secCapitalized = (sec.charAt(0).toUpperCase() + sec.slice(1)) as SingaporeRegion;
                  const themeForSec = SECTOR_ACCENTS[secCapitalized];

                  return (
                    <div
                      key={sec}
                      className={`p-2.5 rounded-xl border text-center transition-all duration-200 ${
                        isCurrent
                          ? 'bg-slate-900 text-white dark:bg-slate-800 border-sky-500 dark:border-sky-400 shadow-md ring-2 ring-sky-500/30'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${themeForSec.dot}`} />
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            isCurrent ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {sec}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="text-[10px] text-slate-400">PSI</div>
                        <div className="text-base font-extrabold font-mono tabular-nums">
                          {psiVal !== undefined ? psiVal : '--'}
                        </div>
                      </div>
                      <div className="mt-1 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="text-[10px] text-slate-400">PM2.5</div>
                        <div className="text-xs font-bold font-mono tabular-nums">
                          {pmVal !== undefined ? `${pmVal} µg` : '--'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-1">
                <span>PSI scale: 0-50 Good · 51-100 Moderate · 101-200 Unhealthy</span>
                <span>PM2.5 scale: 0-55 Normal · 56-150 Elevated</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: 24-HOUR FORECAST */}
        {/* ========================================================================= */}
        {activeTab === 'forecast24' && (
          <div className="h-full flex flex-col justify-between space-y-3">
            {/* General 24-Hour Overview */}
            {data?.twentyFourHr?.general ? (
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 border border-indigo-900/40 shadow-sm shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shrink-0">
                    <WeatherIcon
                      text={data.twentyFourHr.general.forecast?.text}
                      code={data.twentyFourHr.general.forecast?.code}
                      className="w-8 h-8 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-sky-300">
                      24-Hour Islandwide Outlook
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      {data.twentyFourHr.general.forecast?.text || 'Forecast Available'}
                    </h3>
                    <p className="text-[11px] text-slate-300 mt-0.5 font-mono">
                      {data.twentyFourHr.general.validPeriod?.text}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-200 shrink-0 border-t sm:border-t-0 sm:border-l border-white/15 pt-2 sm:pt-0 sm:pl-4">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-center min-w-20">
                    <span className="text-[10px] text-rose-300 uppercase block font-sans font-bold">Temp</span>
                    <span className="text-white font-extrabold text-sm">
                      {data.twentyFourHr.general.temperature?.low}° – {data.twentyFourHr.general.temperature?.high}°C
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-center min-w-20">
                    <span className="text-[10px] text-teal-300 uppercase block font-sans font-bold">Humidity</span>
                    <span className="text-white font-extrabold text-sm">
                      {data.twentyFourHr.general.relativeHumidity?.low}% – {data.twentyFourHr.general.relativeHumidity?.high}%
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-center min-w-24">
                    <span className="text-[10px] text-sky-300 uppercase block font-sans font-bold">Wind</span>
                    <span className="text-white font-extrabold text-xs">
                      {data.twentyFourHr.general.wind?.speed?.low}–{data.twentyFourHr.general.wind?.speed?.high} km/h
                    </span>
                    <span className="text-[10px] text-slate-300 block">
                      {data.twentyFourHr.general.wind?.direction}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">24-hour forecast general overview unavailable</p>
            )}

            {/* 3 6-Hour Period Intervals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 min-h-0">
              {data?.twentyFourHr?.periods && data.twentyFourHr.periods.length > 0 ? (
                data.twentyFourHr.periods.map((period, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 flex flex-col justify-between shadow-2xs transition-colors duration-200"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                          {period.timePeriod.text}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${activeSectorTheme.badge}`}>
                          {selectedRegion} Sector
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                          <WeatherIcon
                            text={period.regionForecast?.text}
                            code={period.regionForecast?.code}
                            className="w-7 h-7"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {period.regionForecast?.text || 'Forecast pending'}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Expected in {selectedRegion} sector
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-mono">
                      Interval: 6 Hours
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  Detailed 6-hour periods not available right now
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: 4-DAY OUTLOOK */}
        {/* ========================================================================= */}
        {activeTab === 'outlook4d' && (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0 px-1">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>4-Day Extended Islandwide Outlook</span>
              </span>
              <span>Updated daily by NEA</span>
            </div>

            {isFourDayValid ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1 min-h-0">
                {data!.fourDayOutlook.forecasts.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 flex flex-col justify-between shadow-2xs hover:border-amber-400/50 dark:hover:border-amber-500/50 transition-all duration-200"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {item.day}
                        </span>
                        <div className="p-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20">
                          <WeatherIcon
                            text={item.forecast.text}
                            code={item.forecast.code}
                            className="w-6 h-6 text-amber-500"
                          />
                        </div>
                      </div>

                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2.5">
                        {item.forecast.text}
                      </div>
                      {item.forecast.summary && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {item.forecast.summary}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1.5 font-mono tabular-nums">
                      <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                        <span className="text-[11px] text-slate-400 font-sans">Temp</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {item.temperature.low}°C – {item.temperature.high}°C
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 text-[11px]">
                        <span className="font-sans">Humidity</span>
                        <span className="font-semibold text-teal-600 dark:text-teal-400">
                          {item.relativeHumidity.low}% – {item.relativeHumidity.high}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-[11px]">
                        <span className="font-sans">Wind</span>
                        <span className="font-semibold">
                          {item.wind.speed.low}-{item.wind.speed.high} km/h {item.wind.direction}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                4-day outlook not available right now
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
