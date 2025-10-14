import React, { useState, useEffect } from "react";
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from "../services/api";import { Truck, Plus, X, Edit, Trash2 } from "lucide-react";

// Datos iniciales opcionales mientras carga la BD
const initialVehicles = [];

const DocumentBadge = ({ name, date }) => {
  const isExpired = new Date(date) < new Date();
  const daysUntilExpiry = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));

  let color = "bg-green-100 text-green-700";
  if (isExpired) color = "bg-red-100 text-red-700";
  else if (daysUntilExpiry <= 30) color = "bg-yellow-100 text-yellow-700";

  return (
    <div className={`px-3 py-1 text-sm font-medium rounded-full ${color} flex justify-between items-center`}>
      <span>{name}</span>
      <span className="ml-2 font-bold">{isExpired ? "¡VENCIDO!" : new Date(date).toISOString().slice(0, 10)}</span>
    </div>
  );
};

const Dashboard = () => {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [currentVehicle, setCurrentVehicle] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Carga vehículos desde backend
  const fetchVehicles = async () => {
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error("Error al cargar vehículos:", err);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const openCreateModal = () => {
    setCurrentVehicle({
      patente: "",
      permisoCirculacion: "",
      revisionTecnica: "",
      seguroObligatorio: "",
      revisionGases: "",
    });
    setModalMode("create");
    setIsModalOpen(true);
    setErrorMsg("");
  };

  const openViewModal = (vehicle) => {
    setCurrentVehicle(vehicle);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle) => {
    setCurrentVehicle(vehicle);
    setModalMode("edit");
    setIsModalOpen(true);
    setErrorMsg("");
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!currentVehicle.patente.trim()) {
      setErrorMsg("La patente no puede estar vacía");
      return;
    }

    try {
      // Convertir fechas a Date
      const vehicleToSend = {
  patente: currentVehicle.patente, // <-- cambio clave
  permisoCirculacion: new Date(currentVehicle.permisoCirculacion),
  revisionTecnica: new Date(currentVehicle.revisionTecnica),
  seguroObligatorio: new Date(currentVehicle.seguroObligatorio),
  revisionGases: new Date(currentVehicle.revisionGases),
  brand: currentVehicle.brand || null,
  model: currentVehicle.model || null,
  year: currentVehicle.year ? Number(currentVehicle.year) : null,
};



      if (modalMode === "create") {
        await createVehicle(vehicleToSend);
      } else if (modalMode === "edit") {
        await updateVehicle(currentVehicle.id, vehicleToSend);
      }

      await fetchVehicles();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Ocurrió un error al guardar el vehículo:", err);
      setErrorMsg(err.response?.data?.error || "Ocurrió un error al guardar el vehículo. Revisa los datos.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este vehículo?")) return;
    try {
      await deleteVehicle(id);
      fetchVehicles();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error al eliminar vehículo:", err);
      setErrorMsg("Error al eliminar vehículo");
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Patente</label>
        <input
          type="text"
          value={currentVehicle?.patente || ""}
          onChange={(e) =>
            setCurrentVehicle({ ...currentVehicle, patente: e.target.value.toUpperCase() })
          }
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Vencimiento Permiso de Circulación</label>
        <input
          type="date"
          value={currentVehicle?.permisoCirculacion?.slice(0,10) || ""}
          onChange={(e) =>
            setCurrentVehicle({ ...currentVehicle, permisoCirculacion: e.target.value })
          }
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Vencimiento Revisión Técnica</label>
        <input
          type="date"
          value={currentVehicle?.revisionTecnica?.slice(0,10) || ""}
          onChange={(e) =>
            setCurrentVehicle({ ...currentVehicle, revisionTecnica: e.target.value })
          }
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Vencimiento Seguro Obligatorio (SOAP)</label>
        <input
          type="date"
          value={currentVehicle?.seguroObligatorio?.slice(0,10) || ""}
          onChange={(e) =>
            setCurrentVehicle({ ...currentVehicle, seguroObligatorio: e.target.value })
          }
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Vencimiento Revisión de Gases</label>
        <input
          type="date"
          value={currentVehicle?.revisionGases?.slice(0,10) || ""}
          onChange={(e) =>
            setCurrentVehicle({ ...currentVehicle, revisionGases: e.target.value })
          }
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      {errorMsg && <p className="text-red-500 font-medium">{errorMsg}</p>}

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={() => setIsModalOpen(false)}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition"
        >
          {modalMode === "create" ? "Crear Vehículo" : "Guardar Cambios"}
        </button>
      </div>
    </form>
  );

  const renderDetails = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{currentVehicle?.patente}</h3>
      <div className="space-y-3">
        <DocumentBadge name="Permiso de Circulación" date={currentVehicle.permisoCirculacion} />
        <DocumentBadge name="Revisión Técnica" date={currentVehicle.revisionTecnica} />
        <DocumentBadge name="Seguro Obligatorio" date={currentVehicle.seguroObligatorio} />
        <DocumentBadge name="Revisión de Gases" date={currentVehicle.revisionGases} />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
        <button
          onClick={() => openEditModal(currentVehicle)}
          className="flex items-center px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition"
        >
          Editar
        </button>
        <button
          onClick={() => handleDelete(currentVehicle.id)}
          className="flex items-center px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition"
        >
          Eliminar
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6 border-b pb-3">
        <h2 className="text-2xl font-bold text-gray-800">Flota de Vehículos</h2>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 text-white bg-orange-500 rounded-lg shadow hover:bg-orange-600 transition"
        >
          ➕ Agregar Vehículo
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            onClick={() => openViewModal(vehicle)}
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-md cursor-pointer transition transform hover:shadow-lg hover:scale-[1.02]"
          >
            <h3 className="text-2xl font-extrabold text-gray-900 mb-1">
              {vehicle.patente}
            </h3>
            <p className="text-sm font-medium text-gray-500 mb-3">
              Vehículo en flota
            </p>

            <div className="mt-3 space-y-2">
              <DocumentBadge name="Permiso" date={vehicle.permisoCirculacion} />
              <DocumentBadge name="Revisión Técnica" date={vehicle.revisionTecnica} />
            </div>
          </div>
        ))}
        {vehicles.length === 0 && (
          <p className="col-span-full text-center text-gray-500 mt-10">No hay vehículos registrados. Agrega uno para empezar.</p>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
              {modalMode === "create" && "Crear Nuevo Vehículo"}
              {modalMode === "edit" && `Editar Vehículo: ${currentVehicle?.patente}`}
              {modalMode === "view" && `Documentos del Vehículo`}
            </h2>

            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ❌
            </button>

            {modalMode === "view" ? renderDetails() : renderForm()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
