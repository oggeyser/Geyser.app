import axios from "axios";

const API_BASE_URL = "http://192.168.1.246:4000/api";


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
