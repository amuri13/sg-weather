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
  CloudSun
} from 'lucide-react';
import { WeatherResponse, ForecastItem, SingaporeRegion } from '../types.ts';
import { WeatherIcon } from './WeatherIcon.tsx';

export type WeatherTab = 'live' | 'air' | 'forecast24' | 'outlook4d';

export const REGION_AREAS: Record<SingaporeRegion, string[]> = {
  North: [
    'Woodlands',
    'Yishun',
    'Sembawang',
    'Mandai',
    'Sungei Kadut',
    'Lim Chu Kang',
    'Seletar',
  ],
  South: [
    'City',
    'Bukit Merah',
    'Queenstown',
    'Sentosa',
    'Southern Islands',
    'Marine Parade',
    'Tanglin',
    'Novena',
  ],
  East: [
    'Bedok',
    'Tampines',
    'Pasir Ris',
    'Changi',
    'Paya Lebar',
    'Geylang',
    'Kallang',
    'Hougang',
    'Serangoon',
    'Sengkang',
    'Punggol',
    'Pulau Ubin',
    'Pulau Tekong',
  ],
  West: [
    'Jurong East',
    'Jurong West',
    'Jurong Island',
    'Boon Lay',
    'Pioneer',
    'Tuas',
    'Clementi',
    'Bukit Batok',
    'Bukit Panjang',
    'Bukit Timah',
    'Choa Chu Kang',
    'Tengah',
    'Jalan Bahar',
    'Toa Payoh',
    'Bishan',
    'Ang Mo Kio',
    'Central Water Catchment',
    'Western Islands',
    'Western Water Catchment',
  ],
};

const REGION_DEFAULT_AREAS: Record<SingaporeRegion, string> = {
  North: 'Woodlands',
  South: 'City',
  East: 'Tampines',
  West: 'Jurong East',
};

function getRegionForArea(area: string): SingaporeRegion {
  const cleanArea = area.replace(/\s*\([^)]*\)/, '').trim().toLowerCase();
  for (const [region, areas] of Object.entries(REGION_AREAS)) {
    if (areas.some((a) => a.toLowerCase() === cleanArea)) {
      return region as SingaporeRegion;
    }
  }
  return 'South';
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

export const WeatherPanel: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<SingaporeRegion>('South');
  const [selectedArea, setSelectedArea] = useState<string>('City');
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
    ? availableAreas.filter((a) => REGION_AREAS[selectedRegion]?.includes(a))
    : REGION_AREAS[selectedRegion];

  const regions: SingaporeRegion[] = ['North', 'South', 'East', 'West'];

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
      {/* Persistent Compact Controls: Region Buttons, Area Selector, Refresh */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Region Segmented Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase px-2 hidden sm:inline">
              Sector:
            </span>
            {regions.map((reg) => {
              const isActive = selectedRegion === reg;
              return (
                <button
                  key={reg}
                  onClick={() => handleRegionSelect(reg)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {reg}
                </button>
              );
            })}
          </div>

          {/* Area Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium hidden md:inline">Area:</span>
            <div className="relative">
              <select
                id="area-select"
                value={selectedArea}
                onChange={handleAreaChange}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium rounded-md px-2.5 py-1 pr-7 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 appearance-none cursor-pointer"
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
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-500">
                <MapPin className="w-3 h-3" />
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
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="font-mono tabular-nums text-slate-400 text-[10px]">
              {secondsUntilRefresh}s
            </span>
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation Bar */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-1.5 shrink-0 flex items-center justify-between gap-2 overflow-x-auto">
        <nav className="flex items-center gap-1" aria-label="Weather panels">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'live'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <CloudSun className="w-3.5 h-3.5 text-sky-500" />
            <span>Live Weather</span>
          </button>

          <button
            onClick={() => setActiveTab('air')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'air'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Air Quality & UV</span>
          </button>

          <button
            onClick={() => setActiveTab('forecast24')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'forecast24'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>24-Hour Forecast</span>
          </button>

          <button
            onClick={() => setActiveTab('outlook4d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'outlook4d'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <span>4-Day Outlook</span>
          </button>
        </nav>

        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          <span>Singapore Standard Time (+08:00)</span>
        </div>
      </div>

      {/* Global Fetch Error Notice if upstream fails */}
      {fetchError && (
        <div className="mx-4 mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-800 shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
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
            {/* Primary Forecast Hero Banner */}
            <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 relative overflow-hidden border border-slate-800 shadow-sm shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                    <span className="text-slate-200 font-semibold">
                      {selectedRegion} Singapore · {data?.area || selectedArea}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>2-Hour Forecast</span>
                    {data?.forecast?.timestamp && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {formatMinutesAgo(data.forecast.timestamp)}
                        </span>
                      </>
                    )}
                  </div>

                  {loading && !data ? (
                    <div className="h-7 w-48 bg-slate-800 animate-pulse rounded my-1" />
                  ) : isForecastValid ? (
                    <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                      <span>{data?.forecast?.text || data?.forecast?.forecast}</span>
                    </h3>
                  ) : (
                    <p className="text-sm text-slate-400 font-normal">
                      2-hour forecast not available right now
                    </p>
                  )}

                  {isForecastValid && data?.forecast?.validPeriod && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 pt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Valid period: {formatValidPeriod(data.forecast.validPeriod)}</span>
                    </p>
                  )}
                </div>

                <div className="shrink-0 p-3 rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-inner flex items-center justify-center">
                  <WeatherIcon
                    text={data?.forecast?.text || data?.forecast?.forecast}
                    code={data?.forecast?.code}
                    className="w-10 h-10"
                  />
                </div>
              </div>
            </div>

            {/* 4 Live Metric Readings (Grid of 4 in 1 row on desktop) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1 min-h-0">
              {/* 1. Air Temperature */}
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Air Temperature</span>
                    <Thermometer className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="mt-2">
                    {loading && !data ? (
                      <div className="h-8 w-20 bg-slate-100 animate-pulse rounded" />
                    ) : isTempValid ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
                          {(data!.temperature.value as number).toFixed(1)}
                        </span>
                        <span className="text-sm font-semibold text-slate-500">°C</span>
                        {data?.temperature?.timestamp && (
                          <span className="text-[11px] text-slate-400 font-mono tabular-nums ml-auto">
                            {formatMinutesAgo(data.temperature.timestamp)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Temperature reading not available right now
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 truncate">
                  {isTempValid && (data?.temperature?.areaName || data?.temperature?.stationName) ? (
                    <span>
                      <strong className="text-slate-700 font-medium">Area:</strong>{' '}
                      {data.temperature.areaName || data.temperature.stationName}
                      {data.temperature.distanceKm !== null && ` · ${data.temperature.distanceKm} km`}
                    </span>
                  ) : (
                    <span className="text-slate-400">Nearest Observation Area lookup</span>
                  )}
                </div>
              </div>

              {/* 2. Rainfall */}
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Rainfall</span>
                    <CloudRain className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="mt-2">
                    {loading && !data ? (
                      <div className="h-8 w-20 bg-slate-100 animate-pulse rounded" />
                    ) : isRainValid ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
                          {(data!.rainfall.value as number).toFixed(1)}
                        </span>
                        <span className="text-sm font-semibold text-slate-500">mm</span>
                        {data?.rainfall?.timestamp && (
                          <span className="text-[11px] text-slate-400 font-mono tabular-nums ml-auto">
                            {formatMinutesAgo(data.rainfall.timestamp)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Rainfall reading not available right now
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 truncate">
                  {isRainValid && (data?.rainfall?.areaName || data?.rainfall?.stationName) ? (
                    <span>
                      <strong className="text-slate-700 font-medium">Area:</strong>{' '}
                      {data.rainfall.areaName || data.rainfall.stationName}
                      {data.rainfall.distanceKm !== null && ` · ${data.rainfall.distanceKm} km`}
                    </span>
                  ) : (
                    <span className="text-slate-400">Nearest Observation Area lookup</span>
                  )}
                </div>
              </div>

              {/* 3. Relative Humidity */}
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Relative Humidity</span>
                    <Droplets className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="mt-2">
                    {loading && !data ? (
                      <div className="h-8 w-20 bg-slate-100 animate-pulse rounded" />
                    ) : isHumidityValid ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
                          {Math.round(data!.humidity.value as number)}
                        </span>
                        <span className="text-sm font-semibold text-slate-500">%</span>
                        {data?.humidity?.timestamp && (
                          <span className="text-[11px] text-slate-400 font-mono tabular-nums ml-auto">
                            {formatMinutesAgo(data.humidity.timestamp)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Humidity reading not available right now
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 truncate">
                  {isHumidityValid && (data?.humidity?.areaName || data?.humidity?.stationName) ? (
                    <span>
                      <strong className="text-slate-700 font-medium">Area:</strong>{' '}
                      {data.humidity.areaName || data.humidity.stationName}
                      {data.humidity.distanceKm !== null && ` · ${data.humidity.distanceKm} km`}
                    </span>
                  ) : (
                    <span className="text-slate-400">Nearest Observation Area lookup</span>
                  )}
                </div>
              </div>

              {/* 4. Wind Speed */}
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Wind Speed</span>
                    <Wind className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="mt-2">
                    {loading && !data ? (
                      <div className="h-8 w-20 bg-slate-100 animate-pulse rounded" />
                    ) : isWindValid ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
                          {(data!.windSpeed.value as number).toFixed(1)}
                        </span>
                        <span className="text-sm font-semibold text-slate-500">knots</span>
                        {data?.windSpeed?.timestamp && (
                          <span className="text-[11px] text-slate-400 font-mono tabular-nums ml-auto">
                            {formatMinutesAgo(data.windSpeed.timestamp)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Wind speed reading not available right now
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 truncate">
                  {isWindValid && (data?.windSpeed?.areaName || data?.windSpeed?.stationName) ? (
                    <span>
                      <strong className="text-slate-700 font-medium">Area:</strong>{' '}
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
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-[11px] text-slate-500 shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  Readings computed via Haversine distance from {data?.area || selectedArea} centroid to nearest observation Area.
                </span>
              </div>
              <span className="font-mono text-slate-400 shrink-0 ml-2 hidden sm:inline">
                Sector: {selectedRegion}
              </span>
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
              {/* PSI Card */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">
                    24-Hour PSI ({selectedRegion})
                  </span>
                  <Activity className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  {isPsiValid ? (
                    <>
                      <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                        {data!.psi.psi24Hourly}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {data!.psi.statusDescriptor}
                      </span>
                      {data?.psi.timestamp && (
                        <span className="text-[10px] text-slate-400 font-mono tabular-nums ml-auto">
                          {formatMinutesAgo(data.psi.timestamp)}
                        </span>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">PSI reading not available right now</p>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Pollutant Standards Index for {selectedRegion} Singapore
                </p>
              </div>

              {/* PM2.5 Card */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">
                    1-Hour PM2.5 ({selectedRegion})
                  </span>
                  <ShieldAlert className="w-4 h-4 text-sky-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  {isPm25Valid ? (
                    <>
                      <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                        {data!.pm25.pm25OneHourly}
                      </span>
                      <span className="text-xs font-medium text-slate-500">µg/m³</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 ml-1">
                        {data!.pm25.statusDescriptor}
                      </span>
                      {data?.pm25.timestamp && (
                        <span className="text-[10px] text-slate-400 font-mono tabular-nums ml-auto">
                          {formatMinutesAgo(data.pm25.timestamp)}
                        </span>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">PM2.5 reading not available right now</p>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Fine particulate matter for {selectedRegion} Singapore
                </p>
              </div>

              {/* UV Index Card */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Solar UV Index</span>
                  <Sun className="w-4 h-4 text-amber-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  {isUvValid ? (
                    <>
                      <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                        {data!.uv.value}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 ml-1">
                        {data!.uv.category}
                      </span>
                      {data?.uv.timestamp && (
                        <span className="text-[10px] text-slate-400 font-mono tabular-nums ml-auto">
                          {formatMinutesAgo(data.uv.timestamp)}
                        </span>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">UV reading not available right now</p>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Solar ultraviolet radiation level across Singapore
                </p>
              </div>
            </div>

            {/* Regional Comparison Matrix (North, South, East, West, Central) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex-1 flex flex-col justify-between shadow-2xs">
              <div className="text-xs font-semibold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Islandwide Regional Breakdown (data.gov.sg real-time telemetry)</span>
                <span className="font-normal text-[11px] text-slate-400">All 5 Sectors</span>
              </div>

              <div className="grid grid-cols-5 gap-2 my-auto py-2">
                {['north', 'south', 'east', 'west', 'central'].map((sec) => {
                  const psiVal = data?.psi?.readingsByRegion?.[sec];
                  const pmVal = data?.pm25?.readingsByRegion?.[sec];
                  const isCurrent = selectedRegion.toLowerCase() === sec;

                  return (
                    <div
                      key={sec}
                      className={`p-2.5 rounded-lg border text-center transition-colors ${
                        isCurrent
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isCurrent ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {sec}
                      </div>
                      <div className="mt-2">
                        <div className="text-[10px] text-slate-400">PSI</div>
                        <div className="text-base font-bold font-mono tabular-nums">
                          {psiVal !== undefined ? psiVal : '--'}
                        </div>
                      </div>
                      <div className="mt-1 pt-1 border-t border-slate-200/40">
                        <div className="text-[10px] text-slate-400">PM2.5</div>
                        <div className="text-xs font-semibold font-mono tabular-nums">
                          {pmVal !== undefined ? `${pmVal} µg` : '--'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
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
              <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-sm shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 shrink-0">
                    <WeatherIcon
                      text={data.twentyFourHr.general.forecast?.text}
                      code={data.twentyFourHr.general.forecast?.code}
                      className="w-7 h-7"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-400">
                      24-Hour Islandwide Outlook
                    </span>
                    <h4 className="text-lg font-bold text-white">
                      {data.twentyFourHr.general.forecast?.text || 'Forecast Available'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      {data.twentyFourHr.general.validPeriod?.text}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-300 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Temp</span>
                    <span className="text-white font-semibold">
                      {data.twentyFourHr.general.temperature?.low}°C –{' '}
                      {data.twentyFourHr.general.temperature?.high}°C
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Humidity</span>
                    <span className="text-white font-semibold">
                      {data.twentyFourHr.general.relativeHumidity?.low}% –{' '}
                      {data.twentyFourHr.general.relativeHumidity?.high}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Wind</span>
                    <span className="text-white font-semibold">
                      {data.twentyFourHr.general.wind?.speed?.low}–
                      {data.twentyFourHr.general.wind?.speed?.high} km/h (
                      {data.twentyFourHr.general.wind?.direction})
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">24-hour forecast general overview unavailable</p>
            )}

            {/* 3 6-Hour Period Intervals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 min-h-0">
              {data?.twentyFourHr?.periods && data.twentyFourHr.periods.length > 0 ? (
                data.twentyFourHr.periods.map((period, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                          {period.timePeriod.text}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          {selectedRegion} Sector
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 shrink-0">
                          <WeatherIcon
                            text={period.regionForecast?.text}
                            code={period.regionForecast?.code}
                            className="w-7 h-7"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            {period.regionForecast?.text || 'Forecast pending'}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Expected in {selectedRegion} sector
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                      Period interval: 6 Hours
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 p-6 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
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
            <div className="flex items-center justify-between text-xs text-slate-500 shrink-0 px-1">
              <span className="font-semibold text-slate-900">
                4-Day Extended Islandwide Outlook
              </span>
              <span>Updated daily by National Environment Agency</span>
            </div>

            {isFourDayValid ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1 min-h-0">
                {data!.fourDayOutlook.forecasts.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{item.day}</span>
                        <WeatherIcon
                          text={item.forecast.text}
                          code={item.forecast.code}
                          className="w-6 h-6"
                        />
                      </div>

                      <div className="text-xs font-semibold text-slate-800 mt-2">
                        {item.forecast.text}
                      </div>
                      {item.forecast.summary && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {item.forecast.summary}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-xs space-y-1 font-mono tabular-nums">
                      <div className="flex justify-between text-slate-700">
                        <span className="text-[11px] text-slate-400">Temp</span>
                        <span className="font-semibold">
                          {item.temperature.low}°C – {item.temperature.high}°C
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Humidity</span>
                        <span>
                          {item.relativeHumidity.low}% – {item.relativeHumidity.high}%
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Wind</span>
                        <span>
                          {item.wind.speed.low}-{item.wind.speed.high} km/h {item.wind.direction}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
                4-day outlook not available right now
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
