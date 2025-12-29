// frontend/src/services/api.js
import axios from "axios";

// 1) Runtime env (PRODUCCIÓN y DEV)
const RUNTIME_API = window.__ENV__?.API_URL;

// 2) Build env (por si quieres mantener compatibilidad)
const BUILD_API = import.meta.env?.VITE_API_URL;

// 3) Fallback local (solo para desarrollo real)
const FALLBACK_LOCAL = "http://localhost:4000/api";

const API = RUNTIME_API || BUILD_API || FALLBACK_LOCAL;

console.log("✅ API BASE EN USO:", API);

const http = axios.create({
  baseURL: API,
});

/* =========================
   VEHÍCULOS
========================= */
export async function getVehicles() {
  const res = await http.get(`/vehicles`);
  return res.data;
}

export async function createVehicle(vehicleData) {
  const res = await http.post(`/vehicles`, vehicleData);
  return res.data;
}

export async function updateVehicle(id, vehicleData) {
  const res = await http.put(`/vehicles/${id}`, vehicleData);
  return res.data;
}

export async function deleteVehicle(id) {
  const res = await http.delete(`/vehicles/${id}`);
  return res.data;
}

/* =========================
   HOJA DE RUTA (RouteLog)
========================= */
export async function getRouteLogs(vehicleId = null) {
  const res = await http.get(`/routelogs`, {
    params: vehicleId ? { vehicleId } : {},
  });
  return res.data;
}

export async function getRouteLogsByVehicle(vehicleId) {
  const res = await http.get(`/routelogs`, {
    params: { vehicleId },
  });
  return res.data;
}

export async function createRouteLog(formData) {
  const res = await http.post(`/routelogs`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function transferRouteLog(id, formData) {
  const res = await http.put(`/routelogs/${id}/transfer`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/* =========================
   DOCUMENTOS
========================= */
export async function getDocumentsByVehicle(vehicleId) {
  const res = await http.get(`/documents/${vehicleId}`);
  return res.data;
}

export async function uploadDocument(vehicleId, formData) {
  const res = await http.post(`/documents/${vehicleId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteDocument(documentId) {
  const res = await http.delete(`/documents/${documentId}`);
  return res.data;
}
