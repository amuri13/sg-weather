import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react';
import { HealthResponse } from '../types.ts';

export const HealthPanel: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) {
        throw new Error(`Health check returned HTTP ${res.status}`);
      }
      const data: HealthResponse = await res.json();
      setHealthData(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to query health endpoint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="w-full space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            System & Upstream Health Diagnostics
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Endpoint connectivity reports and rate limit status from <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">/api/health</code>
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Run Check</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
          {error}
        </div>
      )}

      {/* Top summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="text-xs text-slate-500">Service Status</div>
          <div className="mt-2 flex items-center gap-2">
            {healthData?.allAnswered ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500" />
            )}
            <span className="text-lg font-semibold text-slate-900 uppercase">
              {healthData?.status || (loading ? 'Checking...' : 'Unknown')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {healthData?.allAnswered
              ? 'All 4 data.gov.sg endpoints responding'
              : 'One or more upstream endpoints degraded'}
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="text-xs text-slate-500">API Key Configuration</div>
          <div className="mt-2 flex items-center gap-2">
            {healthData?.keyConfigured ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-slate-500" />
            )}
            <span className="text-base font-semibold text-slate-900">
              {healthData?.keyConfigured ? 'Configured' : 'Anonymous Rate Tier'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {healthData?.keyConfigured
              ? 'Using authenticated quota tier'
              : 'Anonymous tier active (DATA_GOV_SG_API_KEY not set)'}
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="text-xs text-slate-500">Last Health Probe</div>
          <div className="mt-2 text-sm font-mono tabular-nums text-slate-900">
            {healthData?.timestamp
              ? new Date(healthData.timestamp).toLocaleTimeString()
              : '--:--:--'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Live diagnostic timestamp from server
          </p>
        </div>
      </div>

      {/* Detailed Endpoints Table */}
      <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
          Upstream Endpoints (data.gov.sg)
        </div>
        <div className="divide-y divide-slate-200">
          {healthData?.endpoints &&
            Object.entries(healthData.endpoints).map(([endpointKey, details]) => {
              const is2xx = details.status >= 200 && details.status < 300;
              const is429 = details.status === 429;

              return (
                <div key={endpointKey} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{endpointKey}</span>
                      <span className="font-mono text-slate-400 text-[11px] hidden md:inline truncate max-w-sm">
                        {details.url}
                      </span>
                    </div>
                    {details.reason && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">
                        {details.reason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-mono font-bold tabular-nums px-2 py-0.5 rounded text-xs ${
                        is2xx
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : is429
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      HTTP {details.status}
                    </span>
                    <span className="text-slate-500 font-medium">
                      {details.answered ? 'Answered' : 'Unreachable'}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
