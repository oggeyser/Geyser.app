// frontend/src/services/api.js
import { http } from "./http";

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
   HOJA DE RUTA
========================= */
export async function getRouteLogs(vehicleId = null) {
  const res = await http.get(`/routelogs`, {
    params: vehicleId ? { vehicleId } : {},
  });
  return res.data;
}

export async function getRouteLogsByVehicle(vehicleId) {
  const res = await http.get(`/routelogs`, { params: { vehicleId } });
  return res.data;
}

// ✅ Activos (lo usa HojaRuta)
export async function getActiveRouteLogs() {
  const res = await http.get(`/routelogs/active`);
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
