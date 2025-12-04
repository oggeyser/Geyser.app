import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../services/axiosInstance"; // Ajusta si usas otro cliente
import { ArrowLeft } from "lucide-react";

const VehicleHistory = () => {
  const { id } = useParams(); // ID del vehículo
  const [logs, setLogs] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        // Obtener historial (usa tu backend actual)
        const historyRes = await axios.get(`/routelogs/vehicle/${id}`);
        setLogs(historyRes.data);

        // Obtener datos del vehículo
        const vehRes = await axios.get(`/vehicles/${id}`);
        setVehicle(vehRes.data);
      } catch (err) {
        console.error("Error cargando historial", err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [id]);

  if (loading) return <p className='p-4'>Cargando historial...</p>;

  return (
    <div className="p-6">
      <button
        onClick={() => (window.location.href = "/")}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Volver
      </button>

      <h1 className="text-2xl font-bold mb-4">
        Historial del vehículo {vehicle?.plateNumber}
      </h1>

      {logs.length === 0 ? (
        <p className="text-gray-500">No hay registros de uso.</p>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="border border-gray-300 rounded-lg p-4 shadow-sm"
            >
              <p><strong>Chofer:</strong> {log.driverName}</p>
              <p><strong>Kilometraje inicial:</strong> {log.startMileage}</p>
              <p><strong>Kilometraje final:</strong> {log.endMileage ?? "—"}</p>
              <p><strong>Inicio:</strong> {new Date(log.startDate).toLocaleString()}</p>
              <p><strong>Fin:</strong> {log.endDate ? new Date(log.endDate).toLocaleString() : "En uso"}</p>

              {log.transferTo && (
                <p><strong>Transferido a:</strong> {log.transferTo}</p>
              )}

              {log.notes && (
                <p className="mt-1 text-gray-700"><strong>Notas:</strong> {log.notes}</p>
              )}

              <p className="mt-2 font-semibold">
                Estado:{" "}
                <span
                  className={
                    log.status === "IN_USE"
                      ? "text-blue-600"
                      : log.status === "TRANSFERRED"
                      ? "text-yellow-600"
                      : "text-green-600"
                  }
                >
                  {log.status}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VehicleHistory;
