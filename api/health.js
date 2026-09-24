/**
 * Health Check Serverless Handler - Probing all 10 data.gov.sg endpoints
 * Vercel Serverless Function / Express Handler
 */

export default async function handler(req, res) {
  const setStatus = (code) => {
    if (typeof res.status === 'function') {
      res.status(code);
    } else {
      res.statusCode = code;
    }
    return res;
  };

  const sendJson = (data) => {
    if (typeof res.json === 'function') {
      return res.json(data);
    }
    if (typeof res.setHeader === 'function') {
      res.setHeader('Content-Type', 'application/json');
    }
    return res.end(JSON.stringify(data));
  };

  const apiKey = process.env.DATA_GOV_SG_API_KEY;
  const keyConfigured = typeof apiKey === 'string' && apiKey.trim().length > 0;
  const headers = {};
  if (keyConfigured) {
    headers['x-api-key'] = apiKey.trim();
  }

  const endpoints = {
    'two-hr-forecast': 'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast',
    'twenty-four-hr-forecast': 'https://api-open.data.gov.sg/v2/real-time/api/twenty-four-hr-forecast',
    'four-day-outlook': 'https://api-open.data.gov.sg/v2/real-time/api/four-day-outlook',
    'air-temperature': 'https://api-open.data.gov.sg/v2/real-time/api/air-temperature',
    'rainfall': 'https://api-open.data.gov.sg/v2/real-time/api/rainfall',
    'psi': 'https://api-open.data.gov.sg/v2/real-time/api/psi',
    'pm25': 'https://api-open.data.gov.sg/v2/real-time/api/pm25',
    'uv': 'https://api-open.data.gov.sg/v2/real-time/api/uv',
    'relative-humidity': 'https://api-open.data.gov.sg/v2/real-time/api/relative-humidity',
    'wind-speed': 'https://api-open.data.gov.sg/v2/real-time/api/wind-speed',
  };

  const checkEndpoint = async (url) => {
    try {
      const resp = await fetch(url, { headers });
      let reason = null;
      if (!resp.ok) {
        reason = resp.status === 429
          ? 'Rate limited by data.gov.sg'
          : `HTTP ${resp.status}`;
      } else {
        const json = await resp.json();
        if (json.code !== 0) {
          reason = json.errorMsg || `API code ${json.code}`;
        }
      }
      return {
        url,
        status: resp.status,
        answered: true,
        ok: resp.ok && !reason,
        reason,
      };
    } catch (err) {
      return {
        url,
        status: 0,
        answered: false,
        ok: false,
        reason: err?.message || 'Connection failed',
      };
    }
  };

  const results = {};
  const entries = Object.entries(endpoints);
  const checks = await Promise.allSettled(entries.map(([, url]) => checkEndpoint(url)));

  let allAnswered = true;
  entries.forEach(([key], index) => {
    const check = checks[index];
    if (check.status === 'fulfilled') {
      results[key] = check.value;
      if (!check.value.answered) {
        allAnswered = false;
      }
    } else {
      results[key] = {
        url: entries[index][1],
        status: 0,
        answered: false,
        ok: false,
        reason: check.reason?.message || 'Check failed',
      };
      allAnswered = false;
    }
  });

  if (typeof res.setHeader === 'function') {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
  }
  setStatus(200);
  return sendJson({
    status: allAnswered ? 'ok' : 'degraded',
    keyConfigured,
    allAnswered,
    endpointCount: entries.length,
    endpoints: results,
    timestamp: new Date().toISOString(),
  });
}
