// frontend/src/services/api.js
import axios from "axios";

const API = "http://localhost:4000/api";

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

// Crear un inicio de hoja de ruta (desde frontend no lo usamos aún, pero queda listo)
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
   DOCUMENTOS (TIPO FIJO)
===================================================== */

// Obtener documentos de un vehículo
export async function getDocumentsByVehicle(vehicleId) {
  const res = await axios.get(`${API}/documents/${vehicleId}`);
  return res.data;
}

// Subir documento para un vehículo
// formData debe incluir: type, issueDate, expirationDate, file
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
