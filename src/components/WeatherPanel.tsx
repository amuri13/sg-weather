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
  Compass,
  Activity,
  Sun,
  ShieldAlert,
  Calendar,
  Layers
} from 'lucide-react';
import { WeatherResponse, ForecastItem, SingaporeRegion } from '../types.ts';
import { WeatherIcon } from './WeatherIcon.tsx';

interface WeatherPanelProps {
  onAreasLoaded?: (areas: string[]) => void;
}

// Singapore 4 Cardinal Regions and their associated observation areas
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

/**
 * Calculates 'Updated X min ago' from ISO timestamp (+08:00 offset preserved), rounding down
 */
function formatMinutesAgo(timestamp: string | null | undefined): string {
  if (!timestamp) return '';
  const parsed = new Date(timestamp).getTime();
  if (isNaN(parsed)) return '';
  const diffMs = Math.max(0, Date.now() - parsed);
  const minutes = Math.floor(diffMs / 60000);
  return `Updated ${minutes} min ago`;
}

/**
 * Formats valid period text cleanly
 */
function formatValidPeriod(period: ForecastItem['validPeriod']): string {
  if (!period) return '';
  if (period.text) return period.text;
  return '';
}

export const WeatherPanel: React.FC<WeatherPanelProps> = ({ onAreasLoaded }) => {
  const [selectedRegion, setSelectedRegion] = useState<SingaporeRegion>('South');
  const [selectedArea, setSelectedArea] = useState<string>('City');
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
        if (onAreasLoaded) {
          onAreasLoaded(json.validAreas);
        }
      }
      setSecondsUntilRefresh(60);
    } catch (err: any) {
      setFetchError(err?.message || 'Failed to reach weather service');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onAreasLoaded]);

  // Initial load and area changes
  useEffect(() => {
    fetchWeather(selectedArea);
  }, [selectedArea, fetchWeather]);

  // 60-second periodic refresh interval matching the server cache
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWeather(selectedArea);
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedArea, fetchWeather]);

  // 1-second visual countdown tick
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

  // Safe checks for numeric values (0 is a real number for rainfall!)
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

  // Filter available areas by selected region
  const regionSpecificAreas = availableAreas.length > 0
    ? availableAreas.filter((a) => REGION_AREAS[selectedRegion]?.includes(a))
    : REGION_AREAS[selectedRegion];

  const regions: SingaporeRegion[] = ['North', 'South', 'East', 'West'];

  return (
    <div className="w-full space-y-6">
      {/* 1. Region Selector Bar: North, South, East, West */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                Select Singapore Region
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select North, South, East, or West to explore live weather across sectors
            </p>
          </div>

          {/* 4 Cardinal Region Buttons */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-lg shrink-0">
            {regions.map((reg) => {
              const isActive = selectedRegion === reg;
              return (
                <button
                  key={reg}
                  onClick={() => handleRegionSelect(reg)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {reg}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Area Dropdown for the chosen region */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-slate-700">Observation Area in {selectedRegion}:</span>
            <div className="relative">
              <select
                id="area-select"
                value={selectedArea}
                onChange={handleAreaChange}
                className="bg-white border border-slate-300 text-slate-900 text-xs font-medium rounded-md px-3 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 appearance-none cursor-pointer"
              >
                <optgroup label={`${selectedRegion} Singapore Areas`}>
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
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <MapPin className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Refresh Action */}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
            aria-label="Refresh weather data"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
            <span className="font-mono tabular-nums text-slate-400 text-[11px] ml-0.5">
              ({secondsUntilRefresh}s)
            </span>
          </button>
        </div>
      </div>

      {/* Global Fetch Error Notice */}
      {fetchError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Weather service temporarily degraded</p>
            <p className="text-xs mt-0.5 text-amber-700">{fetchError}</p>
          </div>
        </div>
      )}

      {/* 2. Primary Forecast Hero Banner with Dynamic Weather Icon */}
      <div className="bg-slate-900 text-white rounded-xl p-6 relative overflow-hidden border border-slate-800 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
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
              <div className="h-8 w-48 bg-slate-800 animate-pulse rounded my-1" />
            ) : isForecastValid ? (
              <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white flex items-center gap-3">
                <span>{data?.forecast?.text || data?.forecast?.forecast}</span>
              </h3>
            ) : (
              <p className="text-base text-slate-400 font-normal">
                2-hour forecast not available right now
              </p>
            )}

            {isForecastValid && data?.forecast?.validPeriod && (
              <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Valid period: {formatValidPeriod(data.forecast.validPeriod)}</span>
              </p>
            )}
          </div>

          {/* Dynamic Weather Icon Badge */}
          <div className="shrink-0 flex items-center gap-3">
            <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-inner flex items-center justify-center">
              <WeatherIcon
                text={data?.forecast?.text || data?.forecast?.forecast}
                code={data?.forecast?.code}
                className="w-10 h-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Grid of 4 Live Atmospheric Readings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Air Temperature */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between min-h-[165px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Air Temperature</span>
              <Thermometer className="w-4 h-4 text-rose-500" />
            </div>

            <div className="mt-3">
              {loading && !data ? (
                <div className="h-9 w-24 bg-slate-100 animate-pulse rounded" />
              ) : isTempValid ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-slate-900 font-mono tabular-nums">
                    {(data!.temperature.value as number).toFixed(1)}
                  </span>
                  <span className="text-sm font-medium text-slate-500">°C</span>
                  {data?.temperature?.timestamp && (
                    <span className="text-xs text-slate-400 font-mono tabular-nums ml-auto">
                      {formatMinutesAgo(data.temperature.timestamp)}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-1">
                  Temperature reading not available right now
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
            {isTempValid && (data?.temperature?.areaName || data?.temperature?.stationName) ? (
              <div className="truncate">
                <span className="text-slate-700 font-medium">
                  Area: {data.temperature.areaName || data.temperature.stationName}
                </span>
                {data.temperature.distanceKm !== null && (
                  <span className="text-slate-400 font-mono tabular-nums ml-1">
                    · {data.temperature.distanceKm} km away
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400">Nearest Observation Area lookup</span>
            )}
          </div>
        </div>

        {/* Card 2: Rainfall */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between min-h-[165px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Rainfall</span>
              <CloudRain className="w-4 h-4 text-blue-500" />
            </div>

            <div className="mt-3">
              {loading && !data ? (
                <div className="h-9 w-24 bg-slate-100 animate-pulse rounded" />
              ) : isRainValid ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-slate-900 font-mono tabular-nums">
                    {(data!.rainfall.value as number).toFixed(1)}
                  </span>
                  <span className="text-sm font-medium text-slate-500">mm</span>
                  {data?.rainfall?.timestamp && (
                    <span className="text-xs text-slate-400 font-mono tabular-nums ml-auto">
                      {formatMinutesAgo(data.rainfall.timestamp)}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-1">
                  Rainfall reading not available right now
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
            {isRainValid && (data?.rainfall?.areaName || data?.rainfall?.stationName) ? (
              <div className="truncate">
                <span className="text-slate-700 font-medium">
                  Area: {data.rainfall.areaName || data.rainfall.stationName}
                </span>
                {data.rainfall.distanceKm !== null && (
                  <span className="text-slate-400 font-mono tabular-nums ml-1">
                    · {data.rainfall.distanceKm} km away
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400">Nearest Observation Area lookup</span>
            )}
          </div>
        </div>

        {/* Card 3: Relative Humidity */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between min-h-[165px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Relative Humidity</span>
              <Droplets className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="mt-3">
              {loading && !data ? (
                <div className="h-9 w-24 bg-slate-100 animate-pulse rounded" />
              ) : isHumidityValid ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-slate-900 font-mono tabular-nums">
                    {Math.round(data!.humidity.value as number)}
                  </span>
                  <span className="text-sm font-medium text-slate-500">%</span>
                  {data?.humidity?.timestamp && (
                    <span className="text-xs text-slate-400 font-mono tabular-nums ml-auto">
                      {formatMinutesAgo(data.humidity.timestamp)}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-1">
                  Humidity reading not available right now
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
            {isHumidityValid && (data?.humidity?.areaName || data?.humidity?.stationName) ? (
              <div className="truncate">
                <span className="text-slate-700 font-medium">
                  Area: {data.humidity.areaName || data.humidity.stationName}
                </span>
                {data.humidity.distanceKm !== null && (
                  <span className="text-slate-400 font-mono tabular-nums ml-1">
                    · {data.humidity.distanceKm} km away
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400">Nearest Observation Area lookup</span>
            )}
          </div>
        </div>

        {/* Card 4: Wind Speed */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between min-h-[165px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Wind Speed</span>
              <Wind className="w-4 h-4 text-teal-600" />
            </div>

            <div className="mt-3">
              {loading && !data ? (
                <div className="h-9 w-24 bg-slate-100 animate-pulse rounded" />
              ) : isWindValid ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-slate-900 font-mono tabular-nums">
                    {(data!.windSpeed.value as number).toFixed(1)}
                  </span>
                  <span className="text-sm font-medium text-slate-500">knots</span>
                  {data?.windSpeed?.timestamp && (
                    <span className="text-xs text-slate-400 font-mono tabular-nums ml-auto">
                      {formatMinutesAgo(data.windSpeed.timestamp)}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-1">
                  Wind speed reading not available right now
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
            {isWindValid && (data?.windSpeed?.areaName || data?.windSpeed?.stationName) ? (
              <div className="truncate">
                <span className="text-slate-700 font-medium">
                  Area: {data.windSpeed.areaName || data.windSpeed.stationName}
                </span>
                {data.windSpeed.distanceKm !== null && (
                  <span className="text-slate-400 font-mono tabular-nums ml-1">
                    · {data.windSpeed.distanceKm} km away
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400">Nearest Observation Area lookup</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Air Quality & Environmental Telemetry (PSI, PM2.5, UV) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* PSI Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">24-Hr PSI ({selectedRegion})</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            {isPsiValid ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {data!.psi.psi24Hourly}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {data!.psi.statusDescriptor}
                </span>
                {data?.psi.timestamp && (
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums ml-auto">
                    {formatMinutesAgo(data.psi.timestamp)}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">PSI reading not available right now</p>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Pollutant Standards Index for {selectedRegion} sector
          </p>
        </div>

        {/* 1-Hr PM2.5 Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">1-Hr PM2.5 ({selectedRegion})</span>
            <ShieldAlert className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2">
            {isPm25Valid ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {data!.pm25.pm25OneHourly}
                </span>
                <span className="text-xs font-medium text-slate-500">µg/m³</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 ml-1">
                  {data!.pm25.statusDescriptor}
                </span>
                {data?.pm25.timestamp && (
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums ml-auto">
                    {formatMinutesAgo(data.pm25.timestamp)}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">PM2.5 reading not available right now</p>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Fine particulate concentration in {selectedRegion} sector
          </p>
        </div>

        {/* UV Index Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">UV Index</span>
            <Sun className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            {isUvValid ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {data!.uv.value}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 ml-1">
                  {data!.uv.category}
                </span>
                {data?.uv.timestamp && (
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums ml-auto">
                    {formatMinutesAgo(data.uv.timestamp)}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">UV reading not available right now</p>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Solar ultraviolet radiation level
          </p>
        </div>
      </div>

      {/* 5. 24-Hour Regional Outlook & Period Intervals */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-900">
              24-Hour Forecast ({selectedRegion} Sector & Islandwide)
            </h3>
          </div>
          {data?.twentyFourHr?.general?.validPeriod && (
            <span className="text-xs text-slate-500 font-mono">
              {data.twentyFourHr.general.validPeriod.text}
            </span>
          )}
        </div>

        {isTwentyFourHrValid ? (
          <div className="mt-4 space-y-4">
            {/* General Overview Summary */}
            {data?.twentyFourHr?.general && (
              <div className="p-3.5 bg-slate-50 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <WeatherIcon
                    text={data.twentyFourHr.general.forecast?.text}
                    code={data.twentyFourHr.general.forecast?.code}
                    className="w-6 h-6"
                  />
                  <div>
                    <span className="font-semibold text-slate-900">
                      Islandwide Outlook: {data.twentyFourHr.general.forecast?.text}
                    </span>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Temperature: {data.twentyFourHr.general.temperature?.low}°C –{' '}
                      {data.twentyFourHr.general.temperature?.high}°C · Humidity:{' '}
                      {data.twentyFourHr.general.relativeHumidity?.low}% –{' '}
                      {data.twentyFourHr.general.relativeHumidity?.high}% · Wind:{' '}
                      {data.twentyFourHr.general.wind?.speed?.low}–
                      {data.twentyFourHr.general.wind?.speed?.high} km/h (
                      {data.twentyFourHr.general.wind?.direction})
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Period Breakdown Columns */}
            {data?.twentyFourHr?.periods && data.twentyFourHr.periods.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {data.twentyFourHr.periods.map((period, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 border border-slate-200 rounded-lg bg-white flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        {period.timePeriod.text}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <WeatherIcon
                          text={period.regionForecast?.text}
                          code={period.regionForecast?.code}
                          className="w-5 h-5 shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {period.regionForecast?.text || 'Forecast pending'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      Sector: {selectedRegion} Singapore
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-3">24-hour forecast not available right now</p>
        )}
      </div>

      {/* 6. 4-Day Extended Outlook with Weather Icons */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <Calendar className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">
            4-Day Extended Islandwide Outlook
          </h3>
        </div>

        {isFourDayValid ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {data!.fourDayOutlook.forecasts.map((item, idx) => (
              <div
                key={idx}
                className="p-4 border border-slate-200 rounded-lg bg-slate-50/50 flex flex-col justify-between space-y-3"
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
                  <div className="text-xs font-medium text-slate-800 mt-2">
                    {item.forecast.text}
                  </div>
                  {item.forecast.summary && (
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                      {item.forecast.summary}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/80 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600 font-mono tabular-nums">
                    <span>Temp</span>
                    <span>
                      {item.temperature.low}°C – {item.temperature.high}°C
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-mono tabular-nums text-[11px]">
                    <span>Humidity</span>
                    <span>
                      {item.relativeHumidity.low}% – {item.relativeHumidity.high}%
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-mono tabular-nums text-[11px]">
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
          <p className="text-xs text-slate-500 py-3">4-day outlook not available right now</p>
        )}
      </div>

      {/* Meta context banner */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            Readings computed via Haversine distance from {data?.area || selectedArea} centroid to
            active NEA observation areas. Sourced across 10 official real-time APIs.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
          <span>Sector: {selectedRegion}</span>
          <span aria-hidden="true">·</span>
          <span>{data?.keyConfigured ? 'Authenticated Tier' : 'Anonymous Rate Tier'}</span>
        </div>
      </div>
    </div>
  );
};
