// mobile-app/src/services/api.js

const RAW =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://geyser-backend.onrender.com/api";

const BASE_URL = RAW.replace(/\/+$/, "");

console.log("🌐 API BASE_URL (fetch):", BASE_URL);

async function request(path, options = {}) {
  const url = `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${txt}`);
  }

  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
export async function getRouteLogsByVehicle(vehicleId) {
  return request(`/routelogs?vehicleId=${vehicleId}`, { method: "GET" });
}
export async function createRouteLogMultipart({ vehicleId, driverName, startMileage, notesStart, images }) {
  const form = new FormData();
  form.append("vehicleId", String(vehicleId));
  form.append("driverName", driverName);
  form.append("startMileage", String(startMileage));
  if (notesStart) form.append("notesStart", notesStart);

  (images || []).forEach((img, idx) => {
    form.append("imagesStart", {
      uri: img.uri,
      name: img.name || `start_${idx}.jpg`,
      type: img.type || "image/jpeg",
    });
  });

  const url = `${BASE_URL}/routelogs`;
  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function transferRouteLogMultipart(id, { receiverName, endMileage, notesEnd, images }) {
  const form = new FormData();
  form.append("receiverName", receiverName);
  form.append("endMileage", String(endMileage));
  if (notesEnd) form.append("notesEnd", notesEnd);

  (images || []).forEach((img, idx) => {
    form.append("photos", {
      uri: img.uri,
      name: img.name || `end_${idx}.jpg`,
      type: img.type || "image/jpeg",
    });
  });

  const url = `${BASE_URL}/routelogs/${id}/transfer`;
  const res = await fetch(url, { method: "PUT", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// VEHICLES
export async function getVehicles() {
  return request("/vehicles", { method: "GET" });
}
export async function createVehicle(payload) {
  return request("/vehicles", { method: "POST", body: JSON.stringify(payload) });
}

// ROUTELOGS
export async function getActiveRouteLogs() {
  return request("/routelogs/active", { method: "GET" });
}
export async function createRouteLog(payload) {
  // (por ahora sin fotos; después armamos multipart)
  return request("/routelogs", { method: "POST", body: JSON.stringify(payload) });
} 
export async function transferRouteLog(id, payload) {
  return request(`/routelogs/${id}/transfer`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
