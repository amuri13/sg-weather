/**
 * Singapore Weather Handler - Complete 10 Real-Time Endpoints
 * Sibling of package.json at /api/weather.js
 * Compatible with Vercel Serverless Functions and Express route handlers
 */

// 47 official Singapore forecast areas with label coordinates
const FALLBACK_AREAS = [
  { name: 'Ang Mo Kio', label_location: { latitude: 1.375, longitude: 103.839 } },
  { name: 'Bedok', label_location: { latitude: 1.321, longitude: 103.924 } },
  { name: 'Bishan', label_location: { latitude: 1.35077, longitude: 103.839 } },
  { name: 'Boon Lay', label_location: { latitude: 1.304, longitude: 103.701 } },
  { name: 'Bukit Batok', label_location: { latitude: 1.353, longitude: 103.754 } },
  { name: 'Bukit Merah', label_location: { latitude: 1.277, longitude: 103.819 } },
  { name: 'Bukit Panjang', label_location: { latitude: 1.362, longitude: 103.763 } },
  { name: 'Bukit Timah', label_location: { latitude: 1.325, longitude: 103.791 } },
  { name: 'Central Water Catchment', label_location: { latitude: 1.38, longitude: 103.805 } },
  { name: 'Changi', label_location: { latitude: 1.357, longitude: 103.987 } },
  { name: 'Choa Chu Kang', label_location: { latitude: 1.377, longitude: 103.745 } },
  { name: 'City', label_location: { latitude: 1.292, longitude: 103.844 } },
  { name: 'Clementi', label_location: { latitude: 1.315, longitude: 103.76 } },
  { name: 'Geylang', label_location: { latitude: 1.318, longitude: 103.884 } },
  { name: 'Hougang', label_location: { latitude: 1.361, longitude: 103.886 } },
  { name: 'Jalan Bahar', label_location: { latitude: 1.347, longitude: 103.685 } },
  { name: 'Jurong East', label_location: { latitude: 1.326, longitude: 103.737 } },
  { name: 'Jurong Island', label_location: { latitude: 1.266, longitude: 103.699 } },
  { name: 'Jurong West', label_location: { latitude: 1.34039, longitude: 103.705 } },
  { name: 'Kallang', label_location: { latitude: 1.312, longitude: 103.862 } },
  { name: 'Lim Chu Kang', label_location: { latitude: 1.423, longitude: 103.7 } },
  { name: 'Mandai', label_location: { latitude: 1.419, longitude: 103.812 } },
  { name: 'Marine Parade', label_location: { latitude: 1.301, longitude: 103.901 } },
  { name: 'Novena', label_location: { latitude: 1.327, longitude: 103.826 } },
  { name: 'Pasir Ris', label_location: { latitude: 1.37, longitude: 103.948 } },
  { name: 'Paya Lebar', label_location: { latitude: 1.358, longitude: 103.914 } },
  { name: 'Pioneer', label_location: { latitude: 1.315, longitude: 103.675 } },
  { name: 'Pulau Tekong', label_location: { latitude: 1.403, longitude: 104.053 } },
  { name: 'Pulau Ubin', label_location: { latitude: 1.412, longitude: 103.962 } },
  { name: 'Punggol', label_location: { latitude: 1.401, longitude: 103.902 } },
  { name: 'Queenstown', label_location: { latitude: 1.291, longitude: 103.786 } },
  { name: 'Seletar', label_location: { latitude: 1.404, longitude: 103.869 } },
  { name: 'Sembawang', label_location: { latitude: 1.445, longitude: 103.818 } },
  { name: 'Sengkang', label_location: { latitude: 1.384, longitude: 103.891 } },
  { name: 'Sentosa', label_location: { latitude: 1.243, longitude: 103.832 } },
  { name: 'Serangoon', label_location: { latitude: 1.357, longitude: 103.865 } },
  { name: 'Southern Islands', label_location: { latitude: 1.208, longitude: 103.842 } },
  { name: 'Sungei Kadut', label_location: { latitude: 1.413, longitude: 103.743 } },
  { name: 'Tampines', label_location: { latitude: 1.345, longitude: 103.944 } },
  { name: 'Tanglin', label_location: { latitude: 1.308, longitude: 103.813 } },
  { name: 'Tengah', label_location: { latitude: 1.374, longitude: 103.715 } },
  { name: 'Toa Payoh', label_location: { latitude: 1.334, longitude: 103.856 } },
  { name: 'Tuas', label_location: { latitude: 1.297, longitude: 103.635 } },
  { name: 'Western Islands', label_location: { latitude: 1.205, longitude: 103.746 } },
  { name: 'Western Water Catchment', label_location: { latitude: 1.405, longitude: 103.689 } },
  { name: 'Woodlands', label_location: { latitude: 1.432, longitude: 103.786 } },
  { name: 'Yishun', label_location: { latitude: 1.418, longitude: 103.839 } },
];

const AREA_EXTENSIONS = {
  // North
  Canberra: { mappedArea: 'Sembawang', region: 'north', latitude: 1.443, longitude: 103.829 },
  Admiralty: { mappedArea: 'Woodlands', region: 'north', latitude: 1.440, longitude: 103.801 },
  Khatib: { mappedArea: 'Yishun', region: 'north', latitude: 1.417, longitude: 103.832 },

  // South
  HarbourFront: { mappedArea: 'Bukit Merah', region: 'south', latitude: 1.265, longitude: 103.822 },
  'Telok Blangah': { mappedArea: 'Bukit Merah', region: 'south', latitude: 1.272, longitude: 103.809 },
  'Tiong Bahru': { mappedArea: 'Bukit Merah', region: 'south', latitude: 1.286, longitude: 103.827 },
  Alexandra: { mappedArea: 'Queenstown', region: 'south', latitude: 1.288, longitude: 103.803 },

  // East
  Simei: { mappedArea: 'Tampines', region: 'east', latitude: 1.343, longitude: 103.953 },
  Katong: { mappedArea: 'Marine Parade', region: 'east', latitude: 1.306, longitude: 103.905 },

  // West
  Jurong: { mappedArea: 'Jurong East', region: 'west', latitude: 1.333, longitude: 103.743 },

  // Central
  Orchard: { mappedArea: 'City', region: 'central', latitude: 1.304, longitude: 103.832 },
  'River Valley': { mappedArea: 'City', region: 'central', latitude: 1.293, longitude: 103.835 },
  Newton: { mappedArea: 'Novena', region: 'central', latitude: 1.313, longitude: 103.838 },
  Bugis: { mappedArea: 'City', region: 'central', latitude: 1.300, longitude: 103.856 },
  'City Hall': { mappedArea: 'City', region: 'central', latitude: 1.293, longitude: 103.852 },
  'Marina Bay': { mappedArea: 'City', region: 'central', latitude: 1.280, longitude: 103.854 },
};

const AREA_TO_REGION = {
  // North
  Woodlands: 'north',
  Yishun: 'north',
  Sembawang: 'north',
  Canberra: 'north',
  Admiralty: 'north',
  Khatib: 'north',
  Mandai: 'north',
  'Sungei Kadut': 'north',
  'Lim Chu Kang': 'north',
  Seletar: 'north',

  // South
  HarbourFront: 'south',
  Sentosa: 'south',
  'Telok Blangah': 'south',
  'Tiong Bahru': 'south',
  Alexandra: 'south',
  Queenstown: 'south',
  'Bukit Merah': 'south',
  'Southern Islands': 'south',

  // East
  Tampines: 'east',
  'Pasir Ris': 'east',
  Bedok: 'east',
  Simei: 'east',
  Changi: 'east',
  'Paya Lebar': 'east',
  Katong: 'east',
  'Marine Parade': 'east',
  Geylang: 'east',
  Hougang: 'east',
  Serangoon: 'east',
  Sengkang: 'east',
  Punggol: 'east',
  'Pulau Ubin': 'east',
  'Pulau Tekong': 'east',

  // West
  Jurong: 'west',
  Clementi: 'west',
  'Bukit Batok': 'west',
  'Bukit Panjang': 'west',
  'Choa Chu Kang': 'west',
  'Boon Lay': 'west',
  'Jurong East': 'west',
  'Jurong West': 'west',
  'Jurong Island': 'west',
  Pioneer: 'west',
  Tuas: 'west',
  Tengah: 'west',
  'Bukit Timah': 'west',
  'Jalan Bahar': 'west',
  'Western Islands': 'west',
  'Western Water Catchment': 'west',

  // Central
  Orchard: 'central',
  'River Valley': 'central',
  Novena: 'central',
  Newton: 'central',
  Bishan: 'central',
  'Toa Payoh': 'central',
  Kallang: 'central',
  Bugis: 'central',
  'City Hall': 'central',
  'Marina Bay': 'central',
  City: 'central',
  'Ang Mo Kio': 'central',
  Tanglin: 'central',
  'Central Water Catchment': 'central',
};

const REGION_MAPPING = {
  north: 'Woodlands',
  south: 'HarbourFront',
  east: 'Tampines',
  west: 'Jurong',
  central: 'Orchard',
};

/**
 * Haversine formula to compute great-circle distance between two coordinates in km
 */
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Fetch a single endpoint with error handling and rate limit detection
 */
async function fetchEndpoint(url, headers) {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const reason =
        res.status === 429
          ? 'Rate limited by data.gov.sg'
          : `HTTP ${res.status}`;
      return { ok: false, status: res.status, reason, data: null };
    }
    const json = await res.json();
    if (json.code !== 0) {
      return {
        ok: false,
        status: res.status,
        reason: json.errorMsg || `API error code ${json.code}`,
        data: null,
      };
    }
    return { ok: true, status: 200, reason: null, data: json.data };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      reason: err?.message || 'Upstream request failed',
      data: null,
    };
  }
}

/**
 * Find nearest observation Area separately for reading endpoints (air-temp, rainfall, humidity, wind-speed)
 */
function extractNearestReading(endpointResult, targetLocation) {
  if (!endpointResult.ok || !endpointResult.data) {
    return {
      value: null,
      areaName: null,
      stationName: null,
      distanceKm: null,
      timestamp: null,
      error: endpointResult.reason || 'Reading not available right now',
    };
  }

  const { stations, readings } = endpointResult.data;
  if (!Array.isArray(readings) || readings.length === 0) {
    return {
      value: null,
      areaName: null,
      stationName: null,
      distanceKm: null,
      timestamp: null,
      error: 'Reading not available right now',
    };
  }

  // Pick the most recent entry in readings by timestamp
  let latestReading = null;
  let latestTime = -Infinity;
  for (const r of readings) {
    if (r.timestamp) {
      const t = new Date(r.timestamp).getTime();
      if (!isNaN(t) && t > latestTime) {
        latestTime = t;
        latestReading = r;
      }
    }
  }
  if (!latestReading) {
    latestReading = readings[readings.length - 1];
  }

  if (!latestReading || !Array.isArray(latestReading.data)) {
    return {
      value: null,
      areaName: null,
      stationName: null,
      distanceKm: null,
      timestamp: latestReading?.timestamp || null,
      error: 'Reading not available right now',
    };
  }

  // Build Area observation map
  const areaLookupMap = new Map();
  if (Array.isArray(stations)) {
    for (const s of stations) {
      if (s.id) areaLookupMap.set(s.id, s);
      if (s.deviceId) areaLookupMap.set(s.deviceId, s);
    }
  }

  let nearestAreaRecord = null;
  let nearestValue = null;
  let minDistance = Infinity;

  for (const item of latestReading.data) {
    // A reading of 0 (e.g. 0mm rain) is valid; explicitly check null / undefined / NaN
    if (item.value === null || item.value === undefined || typeof item.value !== 'number' || Number.isNaN(item.value)) {
      continue;
    }
    const st = areaLookupMap.get(item.stationId);
    if (!st || !st.location || typeof st.location.latitude !== 'number' || typeof st.location.longitude !== 'number') {
      continue;
    }
    const dist = haversineDistanceKm(
      targetLocation.latitude,
      targetLocation.longitude,
      st.location.latitude,
      st.location.longitude
    );
    if (dist < minDistance) {
      minDistance = dist;
      nearestAreaRecord = st;
      nearestValue = item.value;
    }
  }

  if (nearestAreaRecord === null || nearestValue === null) {
    return {
      value: null,
      areaName: null,
      stationName: null,
      distanceKm: null,
      timestamp: latestReading.timestamp || null,
      error: 'Reading not available right now',
    };
  }

  const observationAreaName = nearestAreaRecord.name || nearestAreaRecord.id;

  return {
    value: nearestValue,
    areaName: observationAreaName,
    stationName: observationAreaName,
    distanceKm: Math.round(minDistance * 10) / 10,
    timestamp: latestReading.timestamp,
    error: null,
  };
}

/**
 * Extract 2-hour forecast for target area
 */
function extractForecast(endpointResult, targetAreaName) {
  if (!endpointResult.ok || !endpointResult.data) {
    return {
      forecast: null,
      text: null,
      validPeriod: null,
      timestamp: null,
      error: endpointResult.reason || '2-hour forecast not available right now',
    };
  }

  const { items } = endpointResult.data;
  if (!Array.isArray(items) || items.length === 0) {
    return {
      forecast: null,
      text: null,
      validPeriod: null,
      timestamp: null,
      error: '2-hour forecast not available right now',
    };
  }

  let latestItem = null;
  let latestTime = -Infinity;
  for (const item of items) {
    const rawTime = item.timestamp || item.update_timestamp;
    if (rawTime) {
      const t = new Date(rawTime).getTime();
      if (!isNaN(t) && t > latestTime) {
        latestTime = t;
        latestItem = item;
      }
    }
  }
  if (!latestItem) {
    latestItem = items[items.length - 1];
  }

  const forecasts = latestItem?.forecasts;
  if (!Array.isArray(forecasts)) {
    return {
      forecast: null,
      text: null,
      validPeriod: latestItem?.valid_period || null,
      timestamp: latestItem?.timestamp || null,
      error: '2-hour forecast not available right now',
    };
  }

  const matched = forecasts.find(
    (f) => f.area && f.area.trim().toLowerCase() === targetAreaName.toLowerCase()
  );

  if (!matched) {
    return {
      forecast: null,
      text: null,
      validPeriod: latestItem?.valid_period || null,
      timestamp: latestItem?.timestamp || null,
      error: `No forecast available for ${targetAreaName}`,
    };
  }

  return {
    forecast: matched.forecast,
    text: matched.forecast,
    code: matched.forecast,
    validPeriod: latestItem?.valid_period || null,
    timestamp: latestItem?.timestamp || null,
    error: null,
  };
}

/**
 * Extract 24-hour forecast
 */
function extractTwentyFourHr(endpointResult, regionKey) {
  if (!endpointResult.ok || !endpointResult.data) {
    return {
      general: null,
      periods: [],
      timestamp: null,
      error: endpointResult.reason || '24-hour forecast not available right now',
    };
  }

  const record = endpointResult.data.records?.[0];
  if (!record) {
    return {
      general: null,
      periods: [],
      timestamp: null,
      error: '24-hour forecast not available right now',
    };
  }

  const periods = (record.periods || []).map((p) => {
    const regForecast = p.regions?.[regionKey] || p.regions?.south || null;
    return {
      timePeriod: p.timePeriod,
      regionForecast: regForecast,
    };
  });

  return {
    general: record.general || null,
    periods,
    timestamp: record.updatedTimestamp || record.date,
    error: null,
  };
}

/**
 * Extract 4-day outlook
 */
function extractFourDay(endpointResult) {
  if (!endpointResult.ok || !endpointResult.data) {
    return {
      forecasts: [],
      timestamp: null,
      error: endpointResult.reason || '4-day outlook not available right now',
    };
  }

  const record = endpointResult.data.records?.[0];
  if (!record || !Array.isArray(record.forecasts)) {
    return {
      forecasts: [],
      timestamp: null,
      error: '4-day outlook not available right now',
    };
  }

  return {
    forecasts: record.forecasts,
    timestamp: record.updatedTimestamp || record.date,
    error: null,
  };
}

/**
 * Extract PSI
 */
function extractPsi(endpointResult, regionKey) {
  if (!endpointResult.ok || !endpointResult.data) {
    return {
      psi24Hourly: null,
      readingsByRegion: {},
      statusDescriptor: 'Unavailable',
      timestamp: null,
      error: endpointResult.reason || 'PSI reading not available right now',
    };
  }

  const item = endpointResult.data.items?.[0];
  const psiMap = item?.readings?.psi_twenty_four_hourly || {};
  const val = psiMap[regionKey] ?? psiMap.south ?? null;

  let statusDescriptor = 'Good';
  if (val !== null) {
    if (val <= 50) statusDescriptor = 'Good';
    else if (val <= 100) statusDescriptor = 'Moderate';
    else if (val <= 200) statusDescriptor = 'Unhealthy';
    else if (val <= 300) statusDescriptor = 'Very Unhealthy';
    else statusDescriptor = 'Hazardous';
  }

  return {
    psi24Hourly: val,
    readingsByRegion: psiMap,
    statusDescriptor,
    timestamp: item?.timestamp || item?.updatedTimestamp || null,
    error: null,
  };
}

/**
 * Extract PM2.5
 */
function extractPm25(endpointResult, regionKey) {
  if (!endpointResult.ok || !endpointResult.data) {
    return {
      pm25OneHourly: null,
      readingsByRegion: {},
      statusDescriptor: 'Unavailable',
      timestamp: null,
      error: endpointResult.reason || 'PM2.5 reading not available right now',
    };
  }

  const item = endpointResult.data.items?.[0];
  const pm25Map = item?.readings?.pm25_one_hourly || {};
  const val = pm25Map[regionKey] ?? pm25Map.south ?? null;

  let statusDescriptor = 'Normal';
  if (val !== null) {
    if (val <= 55) statusDescriptor = 'Normal';
    else if (val <= 150) statusDescriptor = 'Elevated';
    else if (val <= 250) statusDescriptor = 'High';
    else statusDescriptor = 'Very High';
  }

  return {
    pm25OneHourly: val,
    readingsByRegion: pm25Map,
    statusDescriptor,
    timestamp: item?.timestamp || item?.updatedTimestamp || null,
    error: null,
  };
}

/**
 * Extract UV Index
 */
function extractUv(endpointResult) {
  if (!endpointResult.ok || !endpointResult.data) {
    return {
      value: null,
      hour: null,
      category: 'Low',
      timestamp: null,
      error: endpointResult.reason || 'UV reading not available right now',
    };
  }

  const record = endpointResult.data.records?.[0];
  const latestEntry = record?.index?.[0];
  const val = latestEntry?.value ?? null;

  let category = 'Low';
  if (val !== null) {
    if (val <= 2) category = 'Low';
    else if (val <= 5) category = 'Moderate';
    else if (val <= 7) category = 'High';
    else if (val <= 10) category = 'Very High';
    else category = 'Extreme';
  }

  return {
    value: val,
    hour: latestEntry?.hour || null,
    category,
    timestamp: record?.updatedTimestamp || latestEntry?.hour || null,
    error: null,
  };
}

/**
 * Main weather request handler
 */
export default async function handler(req, res) {
  let rawArea = req.query?.Area ?? req.query?.area;
  if (!rawArea && req.url) {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      rawArea = parsedUrl.searchParams.get('Area') || parsedUrl.searchParams.get('area');
    } catch (_) {}
  }

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

  const areaQuery = (typeof rawArea === 'string' && rawArea.trim().length > 0)
    ? rawArea.trim()
    : 'City';

  // Read credential
  const apiKey = process.env.DATA_GOV_SG_API_KEY;
  const keyConfigured = typeof apiKey === 'string' && apiKey.trim().length > 0;
  const headers = {};
  if (keyConfigured) {
    headers['x-api-key'] = apiKey.trim();
  }

  const urls = {
    twoHr: 'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast',
    twentyFourHr: 'https://api-open.data.gov.sg/v2/real-time/api/twenty-four-hr-forecast',
    fourDay: 'https://api-open.data.gov.sg/v2/real-time/api/four-day-outlook',
    temperature: 'https://api-open.data.gov.sg/v2/real-time/api/air-temperature',
    rainfall: 'https://api-open.data.gov.sg/v2/real-time/api/rainfall',
    psi: 'https://api-open.data.gov.sg/v2/real-time/api/psi',
    pm25: 'https://api-open.data.gov.sg/v2/real-time/api/pm25',
    uv: 'https://api-open.data.gov.sg/v2/real-time/api/uv',
    humidity: 'https://api-open.data.gov.sg/v2/real-time/api/relative-humidity',
    windSpeed: 'https://api-open.data.gov.sg/v2/real-time/api/wind-speed',
  };

  // Call all 10 endpoints in parallel using Promise.allSettled
  const settled = await Promise.allSettled([
    fetchEndpoint(urls.twoHr, headers),
    fetchEndpoint(urls.twentyFourHr, headers),
    fetchEndpoint(urls.fourDay, headers),
    fetchEndpoint(urls.temperature, headers),
    fetchEndpoint(urls.rainfall, headers),
    fetchEndpoint(urls.psi, headers),
    fetchEndpoint(urls.pm25, headers),
    fetchEndpoint(urls.uv, headers),
    fetchEndpoint(urls.humidity, headers),
    fetchEndpoint(urls.windSpeed, headers),
  ]);

  const resolve = (s) =>
    s.status === 'fulfilled'
      ? s.value
      : { ok: false, status: 500, reason: s.reason?.message || 'Request failed', data: null };

  const [
    twoHrRes,
    twentyFourHrRes,
    fourDayRes,
    tempRes,
    rainRes,
    psiRes,
    pm25Res,
    uvRes,
    humidityRes,
    windSpeedRes,
  ] = settled.map(resolve);

  // Return 502 only if all 10 failed
  const anySuccess =
    twoHrRes.ok ||
    twentyFourHrRes.ok ||
    fourDayRes.ok ||
    tempRes.ok ||
    rainRes.ok ||
    psiRes.ok ||
    pm25Res.ok ||
    uvRes.ok ||
    humidityRes.ok ||
    windSpeedRes.ok;

  if (!anySuccess) {
    setStatus(502);
    return sendJson({
      error: 'All upstream weather endpoints failed',
      keyConfigured,
      errors: {
        twoHr: twoHrRes.reason,
        twentyFourHr: twentyFourHrRes.reason,
        fourDay: fourDayRes.reason,
        temperature: tempRes.reason,
        rainfall: rainRes.reason,
        psi: psiRes.reason,
        pm25: pm25Res.reason,
        uv: uvRes.reason,
        humidity: humidityRes.reason,
        windSpeed: windSpeedRes.reason,
      },
    });
  }

  // Obtain area metadata from two-hr response or fall back
  const areaMetadata =
    twoHrRes.ok && Array.isArray(twoHrRes.data?.area_metadata) && twoHrRes.data.area_metadata.length > 0
      ? twoHrRes.data.area_metadata
      : FALLBACK_AREAS;

  const validAreas = Array.from(
    new Set([...areaMetadata.map((a) => a.name), ...Object.keys(AREA_EXTENSIONS)])
  );

  const isRegionQuery = Object.prototype.hasOwnProperty.call(REGION_MAPPING, areaQuery.toLowerCase());
  const effectiveAreaQuery = isRegionQuery ? REGION_MAPPING[areaQuery.toLowerCase()] : areaQuery;

  // Check extensions first (for sub-neighborhoods requested by user)
  const extensionEntry = Object.entries(AREA_EXTENSIONS).find(
    ([name]) => name.trim().toLowerCase() === effectiveAreaQuery.toLowerCase()
  );

  let displayAreaName;
  let forecastAreaName;
  let targetLocation;
  let regionKey;

  if (extensionEntry) {
    const [name, meta] = extensionEntry;
    displayAreaName = name;
    forecastAreaName = meta.mappedArea;
    targetLocation = { latitude: meta.latitude, longitude: meta.longitude };
    regionKey = isRegionQuery ? areaQuery.toLowerCase() : meta.region;
  } else {
    const matchedArea = areaMetadata.find(
      (a) => a.name.trim().toLowerCase() === effectiveAreaQuery.toLowerCase()
    );

    if (!matchedArea) {
      setStatus(400);
      return sendJson({
        error: 'Unknown area',
        validAreas,
      });
    }

    displayAreaName = matchedArea.name;
    forecastAreaName = matchedArea.name;
    targetLocation = matchedArea.label_location;
    regionKey = isRegionQuery
      ? areaQuery.toLowerCase()
      : AREA_TO_REGION[matchedArea.name] || 'central';
  }

  // Extract readings using nearest observation Area calculation
  const forecastData = extractForecast(twoHrRes, forecastAreaName);
  const temperatureData = extractNearestReading(tempRes, targetLocation);
  const rainfallData = extractNearestReading(rainRes, targetLocation);
  const humidityData = extractNearestReading(humidityRes, targetLocation);
  const windSpeedData = extractNearestReading(windSpeedRes, targetLocation);

  // Extract higher-level outlooks & atmospheric indices
  const twentyFourHrData = extractTwentyFourHr(twentyFourHrRes, regionKey);
  const fourDayData = extractFourDay(fourDayRes);
  const psiData = extractPsi(psiRes, regionKey);
  const pm25Data = extractPm25(pm25Res, regionKey);
  const uvData = extractUv(uvRes);

  if (typeof res.setHeader === 'function') {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  }

  setStatus(200);
  const regionCapitalized = regionKey.charAt(0).toUpperCase() + regionKey.slice(1).toLowerCase();
  return sendJson({
    area: isRegionQuery
      ? `${regionCapitalized} (${displayAreaName})`
      : displayAreaName,
    region: regionCapitalized,
    validAreas,
    keyConfigured,
    forecast: forecastData,
    temperature: {
      ...temperatureData,
      unit: '°C',
    },
    rainfall: {
      ...rainfallData,
      unit: 'mm',
    },
    humidity: {
      ...humidityData,
      unit: '%',
    },
    windSpeed: {
      ...windSpeedData,
      unit: 'knots',
    },
    twentyFourHr: twentyFourHrData,
    fourDayOutlook: fourDayData,
    psi: psiData,
    pm25: pm25Data,
    uv: uvData,
  });
}
