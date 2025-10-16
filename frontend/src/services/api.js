import axios from "axios";

const API_BASE_URL = "https://geyser-backend.onrender.com";

// === RouteLogs ===
export const getRouteLogs = async () => {
  const res = await fetch('/api/route-logs');
  return res.json();
};

export const createRouteLog = async (data) => {
  const res = await fetch('/api/route-logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteRouteLog = async (id) => {
  await fetch(`/api/route-logs/${id}`, { method: 'DELETE' });
};

export const getVehicles = async () => {
  const res = await axios.get(`${API_BASE_URL}/vehicles`);
  return res.data;
};

export const createVehicle = async (vehicle) => {
  const res = await axios.post(`${API_BASE_URL}/vehicles`, vehicle);
  return res.data;
};

export const updateVehicle = async (id, vehicle) => {
  const res = await axios.put(`${API_BASE_URL}/vehicles/${id}`, vehicle);
  return res.data;
};

export const deleteVehicle = async (id) => {
  const res = await axios.delete(`${API_BASE_URL}/vehicles/${id}`);
  return res.data;
};
