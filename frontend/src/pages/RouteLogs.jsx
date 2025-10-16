import React, { useEffect, useState } from 'react';
import { getRouteLogs, createRouteLog, deleteRouteLog } from '../api';

export default function RouteLogs() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({
    driverName: '',
    vehicleId: '',
    origin: '',
    destination: '',
    distanceKm: '',
    notes: '',
  });

  const fetchLogs = async () => {
    const data = await getRouteLogs();
    setLogs(data);
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createRouteLog(form);
    setForm({ driverName: '', vehicleId: '', origin: '', destination: '', distanceKm: '', notes: '' });
    fetchLogs();
  };

  const handleDelete = async (id) => {
    await deleteRouteLog(id);
    fetchLogs();
  };

  return (
    <div>
      <h2>Registros de Rutas</h2>
      <form onSubmit={handleSubmit}>
        <input name="driverName" placeholder="Conductor" value={form.driverName} onChange={handleChange} required />
        <input name="vehicleId" placeholder="ID Vehículo" value={form.vehicleId} onChange={handleChange} required />
        <input name="origin" placeholder="Origen" value={form.origin} onChange={handleChange} required />
        <input name="destination" placeholder="Destino" value={form.destination} onChange={handleChange} required />
        <input name="distanceKm" type="number" placeholder="Distancia (km)" value={form.distanceKm} onChange={handleChange} />
        <input name="notes" placeholder="Notas" value={form.notes} onChange={handleChange} />
        <button type="submit">Agregar</button>
      </form>

      <ul>
        {logs.map(log => (
          <li key={log.id}>
            <strong>{log.driverName}</strong> — {log.origin} → {log.destination}
            <button onClick={() => handleDelete(log.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
