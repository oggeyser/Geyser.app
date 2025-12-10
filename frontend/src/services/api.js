console.log("---- VARIABLES DE ENTORNO ----");
console.log("VITE_API_URL =", import.meta.env.VITE_API_URL);
console.log("API =", API);
console.log("-------------------------------");

import axios from "axios";

// Usamos variable de entorno de Vite
// En producción -> viene de Vercel
// En desarrollo -> si no existe, usa localhost
const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
console.log("API URL usada:", API);

/* =====================================================
   VEHÍCULOS
===================================================== */

// Obtener todos los vehículos
export async function getVehicles() {
  const res = await axios.get(`${API}/vehicles`);
  return res.data;
}

// Crear vehículo
export async function createVehicle(vehicleData) {
  const res = await axios.post(`${API}/vehicles`, vehicleData);
  return res.data;
}

// Editar vehículo
export async function updateVehicle(id, vehicleData) {
  const res = await axios.put(`${API}/vehicles/${id}`, vehicleData);
  return res.data;
}

// Eliminar vehículo
export async function deleteVehicle(id) {
  const res = await axios.delete(`${API}/vehicles/${id}`);
  return res.data;
}

/* =====================================================
   HOJA DE RUTA (RouteLog)
===================================================== */

// Obtener todos los logs o logs filtrados por vehículo
export async function getRouteLogs(vehicleId = null) {
  const res = await axios.get(`${API}/routelogs`, {
    params: vehicleId ? { vehicleId } : {},
  });
  return res.data;
}

// Obtener historial por vehículo
export async function getRouteLogsByVehicle(vehicleId) {
  const res = await axios.get(`${API}/routelogs`, {
    params: { vehicleId },
  });
  return res.data;
}

// Crear un inicio de hoja de ruta
export async function createRouteLog(formData) {
  const res = await axios.post(`${API}/routelogs`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// Registrar recepción del vehículo
export async function transferRouteLog(id, formData) {
  const res = await axios.put(`${API}/routelogs/${id}/transfer`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/* =====================================================
   DOCUMENTOS
===================================================== */

// Obtener documentos por vehículo
export async function getDocumentsByVehicle(vehicleId) {
  const res = await axios.get(`${API}/documents/${vehicleId}`);
  return res.data;
}

// Subir documento
export async function uploadDocument(vehicleId, formData) {
  const res = await axios.post(`${API}/documents/${vehicleId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// Eliminar documento
export async function deleteDocument(documentId) {
  const res = await axios.delete(`${API}/documents/${documentId}`);
  return res.data;
}
