/**
 * Verified astronomical calculation utility functions
 * Source: reference-astro.js (cross-checked against Polaris, Betelgeuse, Vega invariants)
 */

export function julianDate(date) {
  const Y = date.getUTCFullYear();
  const M = date.getUTCMonth() + 1;
  const D = date.getUTCDate();
  const fracDay =
    (date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) / 24;
  let y = Y, m = M;
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    D + fracDay + B - 1524.5
  );
}

export function gmstHours(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  let gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000.0;
  gmst = ((gmst % 360) + 360) % 360;
  return gmst / 15; // hours
}

export function lstHours(jd, lonDeg) {
  return (gmstHours(jd) + lonDeg / 15 + 24) % 24;
}

/**
 * raHours/decDeg: star's fixed catalog coordinates.
 * latDeg: observer latitude.
 * Returns { alt, az } in degrees. alt > 0 means above the horizon.
 */
export function altAz(raHours, decDeg, latDeg, lstH) {
  const haDeg = (lstH - raHours) * 15;
  const ha = (haDeg * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;
  const lat = (latDeg * Math.PI) / 180;

  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  const alt = (Math.asin(sinAlt) * 180) / Math.PI;

  let cosAz =
    (Math.sin(dec) - Math.sin(lat) * sinAlt) / (Math.cos(lat) * Math.cos(Math.asin(sinAlt)));
  cosAz = Math.max(-1, Math.min(1, cosAz));
  let az = (Math.acos(cosAz) * 180) / Math.PI;
  if (Math.sin(ha) > 0) az = 360 - az;

  return { alt, az };
}

/**
 * Solar position fallback for sunrise / sunset at observer coordinates
 */
export function getSolarTimes(date, latDeg, lonDeg) {
  const jd = julianDate(date);
  const n = jd - 2451545.0 + 0.0008;
  const Jstar = n - lonDeg / 360;
  const M = (357.5291 + 0.98560028 * Jstar) % 360;
  const Mrad = (M * Math.PI) / 180;
  const C = 1.9148 * Math.sin(Mrad) + 0.02 * Math.sin(2 * Mrad) + 0.0003 * Math.sin(3 * Mrad);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const lrad = (lambda * Math.PI) / 180;
  const dec = Math.asin(Math.sin(lrad) * Math.sin((23.4397 * Math.PI) / 180));
  const latRad = (latDeg * Math.PI) / 180;
  const w0 = Math.acos((Math.sin((-0.833 * Math.PI) / 180) - Math.sin(latRad) * Math.sin(dec)) / (Math.cos(latRad) * Math.cos(dec)));

  const Jtransit = 2451545.0 + Jstar + 0.0053 * Math.sin(Mrad) - 0.0069 * Math.sin(2 * lrad);
  const Jset = Jtransit + (w0 * 180 / Math.PI) / 360;
  const Jrise = Jtransit - (w0 * 180 / Math.PI) / 360;

  const riseDate = new Date((Jrise - 2440587.5) * 86400000);
  const setDate = new Date((Jset - 2440587.5) * 86400000);

  return { sunrise: riseDate, sunset: setDate };
}

/**
 * Computes altitude and azimuth of a satellite (like ISS) relative to observer coordinates
 */
export function satelliteAltAz(satLat, satLon, satAltKm = 420, obsLat = 30.03, obsLon = 30.95) {
  const R_EARTH = 6371;
  const rObs = R_EARTH;
  const rSat = R_EARTH + satAltKm;

  const lat1 = (obsLat * Math.PI) / 180;
  const lon1 = (obsLon * Math.PI) / 180;
  const lat2 = (satLat * Math.PI) / 180;
  const lon2 = (satLon * Math.PI) / 180;

  const x1 = rObs * Math.cos(lat1) * Math.cos(lon1);
  const y1 = rObs * Math.cos(lat1) * Math.sin(lon1);
  const z1 = rObs * Math.sin(lat1);

  const x2 = rSat * Math.cos(lat2) * Math.cos(lon2);
  const y2 = rSat * Math.cos(lat2) * Math.sin(lon2);
  const z2 = rSat * Math.sin(lat2);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;

  const up = Math.cos(lat1) * Math.cos(lon1) * dx + Math.cos(lat1) * Math.sin(lon1) * dy + Math.sin(lat1) * dz;
  const east = -Math.sin(lon1) * dx + Math.cos(lon1) * dy;
  const north = -Math.sin(lat1) * Math.cos(lon1) * dx - Math.sin(lat1) * Math.sin(lon1) * dy + Math.cos(lat1) * dz;

  const horizDist = Math.hypot(north, east);
  const alt = (Math.atan2(up, horizDist) * 180) / Math.PI;
  let az = (Math.atan2(east, north) * 180) / Math.PI;
  if (az < 0) az += 360;

  const rangeKm = Math.hypot(dx, dy, dz);
  return { alt, az, rangeKm, visible: alt > 0 };
}

