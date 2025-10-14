import React, { useState } from 'react';
import api from '../services/api';

export default function DocumentForm() {
  const [vehicleId, setVehicleId] = useState('');
  const [type, setType] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [file, setFile] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return alert('Selecciona un archivo');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('vehicleId', vehicleId);
    fd.append('type', type);
    fd.append('issueDate', issueDate);
    fd.append('expirationDate', expirationDate);

    try {
      const res = await api.post('/documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Documento subido');
      console.log(res.data);
    } catch (err) {
      console.error(err);
      alert('Error subiendo documento');
    }
  }

  return (
    <form onSubmit={submit}>
      <input placeholder="ID Vehículo" value={vehicleId} onChange={e=>setVehicleId(e.target.value)} />
      <input placeholder="Tipo (seguro, revisión)" value={type} onChange={e=>setType(e.target.value)} />
      <label>Fecha emisión</label>
      <input type="date" value={issueDate} onChange={e=>setIssueDate(e.target.value)} />
      <label>Fecha vencimiento</label>
      <input type="date" value={expirationDate} onChange={e=>setExpirationDate(e.target.value)} />
      <input type="file" onChange={e=>setFile(e.target.files[0])} />
      <button type="submit">Subir documento</button>
    </form>
  );
}
