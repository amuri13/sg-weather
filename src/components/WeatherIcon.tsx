import React from 'react';
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  Wind,
  CloudFog,
} from 'lucide-react';

interface WeatherIconProps {
  text?: string | null;
  code?: string | null;
  className?: string;
  size?: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  text = '',
  code = '',
  className = 'w-6 h-6',
}) => {
  const normalizedText = (text || '').toLowerCase();
  const normalizedCode = (code || '').toUpperCase();

  // Thundery showers / Thunderstorm
  if (
    normalizedText.includes('thundery') ||
    normalizedText.includes('thunder') ||
    normalizedCode === 'TL' ||
    normalizedCode === 'HT' ||
    normalizedCode === 'HG'
  ) {
    return <CloudLightning className={`${className} text-amber-400`} />;
  }

  // Drizzle / Passing / Light showers
  if (
    normalizedText.includes('light shower') ||
    normalizedText.includes('passing shower') ||
    normalizedText.includes('drizzle') ||
    normalizedText.includes('light rain') ||
    normalizedCode === 'LS' ||
    normalizedCode === 'PS' ||
    normalizedCode === 'DR' ||
    normalizedCode === 'LR'
  ) {
    return <CloudDrizzle className={`${className} text-sky-400`} />;
  }

  // Showers / Rain / Heavy Rain
  if (
    normalizedText.includes('shower') ||
    normalizedText.includes('rain') ||
    normalizedCode === 'SH' ||
    normalizedCode === 'RA' ||
    normalizedCode === 'HR'
  ) {
    return <CloudRain className={`${className} text-blue-400`} />;
  }

  // Windy
  if (normalizedText.includes('wind') || normalizedCode === 'WD') {
    return <Wind className={`${className} text-teal-400`} />;
  }

  // Hazy / Mist / Fog
  if (
    normalizedText.includes('hazy') ||
    normalizedText.includes('haze') ||
    normalizedText.includes('mist') ||
    normalizedText.includes('fog') ||
    normalizedCode === 'HZ'
  ) {
    return <CloudFog className={`${className} text-amber-200/80`} />;
  }

  // Partly Cloudy (Night)
  if (
    normalizedText.includes('partly cloudy (night)') ||
    normalizedCode === 'PN'
  ) {
    return <CloudMoon className={`${className} text-indigo-300`} />;
  }

  // Partly Cloudy (Day or general)
  if (
    normalizedText.includes('partly cloudy') ||
    normalizedCode === 'PC'
  ) {
    return <CloudSun className={`${className} text-sky-400`} />;
  }

  // Cloudy / Overcast
  if (
    normalizedText.includes('cloudy') ||
    normalizedText.includes('overcast') ||
    normalizedCode === 'CL'
  ) {
    return <Cloud className={`${className} text-slate-300`} />;
  }

  // Fair (Night)
  if (
    normalizedText.includes('(night)') ||
    normalizedCode === 'FN'
  ) {
    return <Moon className={`${className} text-indigo-200`} />;
  }

  // Fair / Sunny (Day)
  if (
    normalizedText.includes('fair') ||
    normalizedText.includes('sunny') ||
    normalizedCode === 'FA'
  ) {
    return <Sun className={`${className} text-amber-400`} />;
  }

  // Default fallback
  return <CloudSun className={`${className} text-sky-400`} />;
};
