/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CloudSun } from 'lucide-react';
import { WeatherPanel } from './components/WeatherPanel.tsx';

export default function App() {
  const accessDate = '24 September 2026';

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-900 flex flex-col overflow-hidden font-sans selection:bg-slate-200">
      {/* Top Bar Header (Shrink-0) */}
      <header className="bg-white border-b border-slate-200 h-12 shrink-0 z-30 px-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-slate-900 text-white flex items-center justify-center">
            <CloudSun className="w-4 h-4" />
          </div>
          <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900">
            Singapore Live Weather Monitor
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] hidden sm:inline">Telemetry Active</span>
        </div>
      </header>

      {/* Main Single-Viewport Tabbed View (flex-1, no page scroll) */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden max-w-7xl w-full mx-auto">
        <WeatherPanel />
      </main>

      {/* Pinned Minimalist Attribution Footer (Shrink-0, no scroll) */}
      <footer className="shrink-0 bg-white/95 backdrop-blur-xs border-t border-slate-200 px-4 py-1.5 text-[10px] text-slate-500 leading-tight">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <p className="truncate">
            Contains information from the Real-time Weather Readings and Weather Forecast datasets accessed on {accessDate} from data.gov.sg, which is made available under the terms of the Singapore Open Data Licence version 1.0{' '}
            <a
              href="https://data.gov.sg/open-data-licence"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-700 underline hover:text-slate-900 transition-colors"
            >
              https://data.gov.sg/open-data-licence
            </a>
            . Weather data is provided by the National Environment Agency. This is an SMU course project and is not affiliated with or endorsed by the National Environment Agency or data.gov.sg.
          </p>
          <span className="text-[9px] text-slate-400 font-mono shrink-0 hidden md:inline">
            10 NEA Real-Time Endpoints
          </span>
        </div>
      </footer>
    </div>
  );
}
