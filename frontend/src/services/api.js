// frontend/src/services/api.js
import axios from "axios";

// Lee variable de Vercel/Vite
//const API = import.meta.env.VITE_API_URL;
const API = window.__ENV__?.VITE_API_URL;

// Si por algún motivo no está, en dev usamos localhost.
// En PRODUCCIÓN preferimos fallar explícitamente para detectar el error rápido.
if (!API) {
  if (import.meta.env.PROD) {
    console.error("❌ VITE_API_URL NO está definida en producción. Revisa variables en Vercel.");
  }
}

const BASE = API || "http://localhost:4000/api";

// Axios instance (opcional pero recomendado)
const http = axios.create({
  baseURL: BASE,
});

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
