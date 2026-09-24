/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CloudSun, Activity } from 'lucide-react';
import { WeatherPanel } from './components/WeatherPanel.tsx';
import { HealthPanel } from './components/HealthPanel.tsx';

type Tab = 'weather' | 'health';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('weather');

  // Formatted date of dataset access for Singapore Open Data Licence
  const accessDate = '24 September 2026';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-200">
      {/* Top Bar Contract (3 zones) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
              Singapore Live Weather Monitor
            </span>
          </div>

          {/* Zone 2: Navigation tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('weather')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'weather'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CloudSun className="w-3.5 h-3.5" />
              <span>Live Weather</span>
            </button>

            <button
              onClick={() => setActiveTab('health')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'health'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>API Diagnostics</span>
            </button>
          </nav>

          {/* Zone 3: Live telemetry indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry Active</span>
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'weather' && <WeatherPanel />}
        {activeTab === 'health' && <HealthPanel />}

        {/* Footer with exact required license attribution */}
        <footer className="mt-16 pt-8 pb-12 border-t border-slate-200 text-xs text-slate-500 leading-relaxed">
          <p>
            Contains information from the Real-time Weather Readings and Weather Forecast datasets
            accessed on {accessDate} from data.gov.sg, which is made available under the terms of
            the Singapore Open Data Licence version 1.0{' '}
            <a
              href="https://data.gov.sg/open-data-licence"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-700 underline hover:text-slate-900 transition-colors"
            >
              https://data.gov.sg/open-data-licence
            </a>
            . Weather data is provided by the National Environment Agency. This is an SMU course
            project and is not affiliated with or endorsed by the National Environment Agency or
            data.gov.sg.
          </p>
        </footer>
      </main>
    </div>
  );
}
