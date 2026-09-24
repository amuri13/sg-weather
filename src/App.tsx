/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CloudSun, Sun, Moon } from 'lucide-react';
import { WeatherPanel } from './components/WeatherPanel.tsx';

export default function App() {
  const accessDate = '24 September 2026';

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sg_weather_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('sg_weather_theme', theme);
    } catch (_) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden font-sans transition-colors duration-200 selection:bg-sky-500/20">
      {/* Top Bar Header (Shrink-0) */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200/90 dark:border-slate-800 h-13 shrink-0 z-30 px-4 flex items-center justify-between shadow-2xs transition-colors duration-200">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-sky-500 via-indigo-500 to-amber-400 text-white flex items-center justify-center shadow-xs shadow-sky-500/25">
            <CloudSun className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
              <span>Singapore Weather</span>
              <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 font-mono">Live</span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-0.5 hidden xs:block">
              National Environment Agency Telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border transition-all duration-150 cursor-pointer
              bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200/90
              dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 shadow-2xs"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[11px]">Dark Mode</span>
              </>
            )}
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active</span>
          </div>
        </div>
      </header>

      {/* Main Single-Viewport Tabbed View (flex-1, no page scroll) */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden max-w-7xl w-full mx-auto">
        <WeatherPanel isDarkMode={theme === 'dark'} />
      </main>

      {/* Pinned Minimalist Attribution Footer (Shrink-0, no scroll) */}
      <footer className="shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-t border-slate-200 dark:border-slate-800 px-4 py-1.5 text-[10px] text-slate-500 dark:text-slate-400 leading-tight transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <p className="truncate">
            Contains information from the Real-time Weather Readings and Weather Forecast datasets accessed on {accessDate} from data.gov.sg, which is made available under the terms of the Singapore Open Data Licence version 1.0{' '}
            <a
              href="https://data.gov.sg/open-data-licence"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-700 dark:text-slate-300 underline hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              https://data.gov.sg/open-data-licence
            </a>
            . Weather data is provided by the National Environment Agency. This is an SMU course project and is not affiliated with or endorsed by the National Environment Agency or data.gov.sg.
          </p>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono shrink-0 hidden md:inline">
            10 NEA Real-Time Endpoints
          </span>
        </div>
      </footer>
    </div>
  );
}
