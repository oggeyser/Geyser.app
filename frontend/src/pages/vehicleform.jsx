import React, { useState } from "react";
import api from "../services/api";

export default function VehicleForm() {
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/vehicles", { plateNumber: plate, brand, model, year: Number(year) });
      alert("Vehículo creado");
    } catch (err) {
      console.error(err);
      alert("Error creando vehículo");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Patente" value={plate} onChange={e => setPlate(e.target.value)} />
      <input placeholder="Marca" value={brand} onChange={e => setBrand(e.target.value)} />
      <input placeholder="Modelo" value={model} onChange={e => setModel(e.target.value)} />
      <input placeholder="Año" type="number" value={year} onChange={e => setYear(e.target.value)} />
      <button type="submit">Crear Vehículo</button>
    </form>
  );
}
