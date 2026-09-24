export interface ReadingItem {
  value: number | null;
  unit?: string;
  stationId?: string;
  stationName: string | null;
  areaName?: string | null;
  distanceKm: number | null;
  timestamp: string | null;
  error: string | null;
}

export interface ForecastItem {
  forecast: string | null;
  text: string | null;
  code?: string | null;
  validPeriod: {
    start: string;
    end: string;
    text: string;
  } | null;
  timestamp: string | null;
  error: string | null;
}

export interface TwentyFourHrPeriod {
  timePeriod: {
    start: string;
    end: string;
    text: string;
  };
  regionForecast: {
    text: string;
    code: string;
  } | null;
}

export interface TwentyFourHrForecastData {
  general: {
    forecast: {
      text: string;
      code: string;
    } | null;
    temperature: {
      low: number;
      high: number;
      unit: string;
    } | null;
    relativeHumidity: {
      low: number;
      high: number;
      unit: string;
    } | null;
    wind: {
      speed: { low: number; high: number };
      direction: string;
    } | null;
    validPeriod: {
      start: string;
      end: string;
      text: string;
    } | null;
  } | null;
  periods: TwentyFourHrPeriod[];
  timestamp: string | null;
  error: string | null;
}

export interface FourDayOutlookItem {
  day: string;
  timestamp: string;
  forecast: {
    text: string;
    code: string;
    summary: string;
  };
  temperature: {
    low: number;
    high: number;
    unit: string;
  };
  relativeHumidity: {
    low: number;
    high: number;
    unit: string;
  };
  wind: {
    speed: { low: number; high: number };
    direction: string;
  };
}

export interface FourDayOutlookData {
  forecasts: FourDayOutlookItem[];
  timestamp: string | null;
  error: string | null;
}

export interface PsiData {
  psi24Hourly: number | null;
  pm25HourlyMax?: number | null;
  readingsByRegion?: Record<string, number>;
  statusDescriptor?: string;
  timestamp: string | null;
  error: string | null;
}

export interface Pm25Data {
  pm25OneHourly: number | null;
  readingsByRegion?: Record<string, number>;
  statusDescriptor?: string;
  timestamp: string | null;
  error: string | null;
}

export interface UvData {
  value: number | null;
  hour: string | null;
  category?: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';
  timestamp: string | null;
  error: string | null;
}

export interface WeatherResponse {
  area: string;
  region?: string;
  validAreas: string[];
  keyConfigured: boolean;
  forecast: ForecastItem;
  temperature: ReadingItem;
  rainfall: ReadingItem;
  humidity: ReadingItem;
  windSpeed: ReadingItem;
  twentyFourHr: TwentyFourHrForecastData;
  fourDayOutlook: FourDayOutlookData;
  psi: PsiData;
  pm25: Pm25Data;
  uv: UvData;
  error?: string;
  errors?: Record<string, string | null>;
}

export interface HealthEndpointStatus {
  url: string;
  status: number;
  answered: boolean;
  ok: boolean;
  reason: string | null;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  keyConfigured: boolean;
  allAnswered: boolean;
  endpointCount?: number;
  endpoints: Record<string, HealthEndpointStatus>;
  timestamp: string;
}

export type SingaporeRegion = 'North' | 'South' | 'East' | 'West';
