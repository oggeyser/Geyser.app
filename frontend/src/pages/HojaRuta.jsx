import { useState, useEffect } from "react";
import axios from "axios";

export default function HojaRuta() {
  const [vehicles, setVehicles] = useState([]);
  const [logs, setLogs] = useState([]);

  // Formulario inicio
  const [vehicleId, setVehicleId] = useState("");
  const [driverName, setDriverName] = useState("");
  const [startMileage, setStartMileage] = useState("");
  const [notesStart, setNotesStart] = useState("");
  const [imagesStart, setImagesStart] = useState([]);

  // Mostrar/ocultar formulario
  const [showForm, setShowForm] = useState(false);

  // Modal de recepción
  const [showModal, setShowModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const [receiverName, setReceiverName] = useState("");
  const [endMileage, setEndMileage] = useState("");
  const [notesEnd, setNotesEnd] = useState("");
  const [imagesEnd, setImagesEnd] = useState([]);

  // Cargar vehículos + último registro por vehículo
  useEffect(() => {
    loadVehicles();
    loadLogs();
  }, []);

  const loadVehicles = () => {
    axios
      .get("http://localhost:4000/api/vehicles")
      .then((res) => setVehicles(res.data))
      .catch((err) => console.error("Error al cargar vehículos:", err));
  };

  const loadLogs = () => {
    axios
      .get("http://localhost:4000/api/routelogs/active")
      .then((res) => setLogs(res.data))
      .catch((err) => console.error("Error cargando logs activos:", err));
  };

  /* =============================
     CREAR NUEVA HOJA DE RUTA
  ============================== */

  const handleCreateRoute = async () => {
    if (!vehicleId || !driverName || !startMileage) {
      alert("Completa todos los campos obligatorios");
      return;
    }

    const formData = new FormData();
    formData.append("driverName", driverName);
    formData.append("startMileage", startMileage);
    formData.append("vehicleId", vehicleId);
    formData.append("notesStart", notesStart);

    for (let img of imagesStart) {
      formData.append("imagesStart", img);
    }

    await axios.post("http://localhost:4000/api/routelogs", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // limpiar formulario
    setVehicleId("");
    setDriverName("");
    setStartMileage("");
    setNotesStart("");
    setImagesStart([]);
    setShowForm(false);

    loadLogs();
  };

  /* =============================
     ABRIR MODAL DE RECEPCIÓN
  ============================== */

  const openTransferModal = (log) => {
    setSelectedLog(log);
    setReceiverName("");
    setEndMileage("");
    setNotesEnd("");
    setImagesEnd([]);
    setShowModal(true);
  };

  /* =============================
     REGISTRAR RECEPCIÓN
  ============================== */

  const handleTransfer = async () => {
    if (!receiverName || !endMileage) {
      alert("Completa los datos de recepción");
      return;
    }

    const formData = new FormData();
    formData.append("receiverName", receiverName);
    formData.append("endMileage", endMileage);
    formData.append("notesEnd", notesEnd);

    for (let img of imagesEnd) {
      formData.append("photos", img);
    }

    await axios.put(
      `http://localhost:4000/api/routelogs/${selectedLog.id}/transfer`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    alert("Recepción registrada correctamente");

    setShowModal(false);
    loadLogs();
  };

  return (
    <div className="p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Hoja de Ruta</h1>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 text-white px-4 py-2 rounded-xl shadow hover:bg-orange-600"
        >
          {showForm ? "Cerrar formulario" : "Generar nuevo registro"}
        </button>
      </div>

      {/* FORMULARIO DE INICIO */}
      {showForm && (
        <div className="bg-white shadow-xl rounded-2xl p-6 mb-6 space-y-4">

          <div>
            <label className="font-semibold">Vehículo *</label>
            <select
              className="w-full p-3 border rounded"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">Seleccione vehículo</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold">Conductor *</label>
            <input
              type="text"
              className="w-full p-3 border rounded"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
          </div>

          <div>
            <label className="font-semibold">KM inicial *</label>
            <input
              type="number"
              className="w-full p-3 border rounded"
              value={startMileage}
              onChange={(e) => setStartMileage(e.target.value)}
            />
          </div>

          <div>
            <label className="font-semibold">Notas de inicio</label>
            <textarea
              className="w-full p-3 border rounded"
              value={notesStart}
              onChange={(e) => setNotesStart(e.target.value)}
            />
          </div>

          <div>
            <label className="font-semibold">Fotos del inicio</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImagesStart(Array.from(e.target.files))}
            />
          </div>

          <button
            onClick={handleCreateRoute}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600"
          >
            Crear hoja de ruta
          </button>
        </div>
      )}

      {/* LISTADO DE REGISTROS ACTIVOS */}
      <h2 className="text-2xl font-bold mb-3">Registros activos</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {logs.map((log) => (
          <div key={log.id} className="bg-white border rounded-xl p-5 shadow">

            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold">{log.vehicle?.plateNumber}</h3>
              <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-xs uppercase">
                {log.status}
              </span>
            </div>

            <p><strong>Inicio:</strong> {new Date(log.startDate).toLocaleString()}</p>
            <p><strong>Conductor:</strong> {log.driverName}</p>
            <p><strong>KM Inicio:</strong> {log.startMileage} km</p>

            <button
              onClick={() => openTransferModal(log)}
              className="mt-4 w-full bg-orange-500 text-white py-2 rounded-lg font-bold hover:bg-orange-600"
            >
              Registrar recepción
            </button>
          </div>
        ))}
        {logs.length === 0 && (
          <p className="text-gray-500 col-span-full">
            No hay registros activos. Crea una nueva hoja de ruta.
          </p>
        )}
      </div>

      {/* MODAL DE RECEPCIÓN */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">

            <h2 className="text-xl font-bold mb-4">Recepción del vehículo</h2>

            <label className="font-semibold">Nombre receptor *</label>
            <input
              type="text"
              className="w-full p-3 border rounded mb-3"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
            />

            <label className="font-semibold">KM recepción *</label>
            <input
              type="number"
              className="w-full p-3 border rounded mb-3"
              value={endMileage}
              onChange={(e) => setEndMileage(e.target.value)}
            />

            <label className="font-semibold">Notas recepción</label>
            <textarea
              className="w-full p-3 border rounded mb-3"
              value={notesEnd}
              onChange={(e) => setNotesEnd(e.target.value)}
            />

            <label className="font-semibold">Fotos recepción</label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="mb-3"
              onChange={(e) => setImagesEnd(Array.from(e.target.files))}
            />

            <div className="flex justify-end gap-3">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>

              <button
                className="bg-orange-500 text-white px-4 py-2 rounded"
                onClick={handleTransfer}
              >
                Registrar recepción
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
