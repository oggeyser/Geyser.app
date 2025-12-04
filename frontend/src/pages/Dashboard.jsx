import React, { useState, useEffect } from "react";
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getRouteLogsByVehicle,
  getDocumentsByVehicle,
  uploadDocument,
  deleteDocument,
} from "../services/api";
import { Plus, X, Edit, Trash2, History, FileText, Upload, Trash } from "lucide-react";

// Mapeo de tipos de documento a nombre visible
const DOCUMENT_TYPES = {
  PERMISO: "Permiso de Circulación",
  REVISION_TECNICA: "Revisión Técnica",
  SOAP: "Seguro Obligatorio (SOAP)",
  GASES: "Revisión de Gases",
  OTRO: "Otro documento",
};

// Badge para vencimientos
const DocumentBadge = ({ name, date }) => {
  const d = new Date(date);
  const now = new Date();
  const isExpired = d < now;
  const daysLeft = Math.ceil((d - now) / (1000 * 60 * 60 * 24));

  let color = "bg-green-100 text-green-700";
  if (isExpired) color = "bg-red-100 text-red-700";
  else if (daysLeft <= 30) color = "bg-yellow-100 text-yellow-700";

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
      {name}: {d.toISOString().slice(0, 10)}
    </span>
  );
};

export default function Dashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState("");

  // Modal crear/editar vehículo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit
  const [currentVehicle, setCurrentVehicle] = useState(null);

  // Modal detalle (documentos + historial)
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailVehicle, setDetailVehicle] = useState(null);
  const [activeTab, setActiveTab] = useState("docs"); // docs | history

  // Documentos
  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState("");
  const [docType, setDocType] = useState("PERMISO");
  const [docIssueDate, setDocIssueDate] = useState("");
  const [docExpirationDate, setDocExpirationDate] = useState("");
  const [docFile, setDocFile] = useState(null);

  // Historial
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchVehicles();
  }, []);

  async function fetchVehicles() {
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error("Error cargando vehículos:", err);
    }
  }

  /* =============================
     MODAL CREAR / EDITAR VEHÍCULO
  ============================== */

  const openCreateModal = () => {
    setCurrentVehicle({
      plateNumber: "",
      circulationPermitDate: "",
      technicalReviewDate: "",
      insuranceDate: "",
      gasesReviewDate: "",
    });
    setModalMode("create");
    setIsModalOpen(true);
    setError("");
  };

  const openEditModal = (vehicle) => {
    setCurrentVehicle(vehicle);
    setModalMode("edit");
    setIsModalOpen(true);
    setError("");
  };

  async function handleSave(e) {
    e.preventDefault();

    try {
      const vehicleData = {
        plateNumber: currentVehicle.plateNumber,
        circulationPermitDate: new Date(currentVehicle.circulationPermitDate),
        technicalReviewDate: new Date(currentVehicle.technicalReviewDate),
        insuranceDate: new Date(currentVehicle.insuranceDate),
        gasesReviewDate: new Date(currentVehicle.gasesReviewDate),
      };

      if (modalMode === "create") {
        await createVehicle(vehicleData);
      } else {
        await updateVehicle(currentVehicle.id, vehicleData);
      }

      await fetchVehicles();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setError("Error guardando vehículo");
    }
  }

  async function handleDeleteVehicle(id) {
    if (!window.confirm("¿Seguro que deseas eliminar este vehículo?")) return;
    try {
      await deleteVehicle(id);
      await fetchVehicles();
    } catch (err) {
      console.error("Error eliminando vehículo:", err);
      alert("Error eliminando vehículo");
    }
  }

  /* =============================
     MODAL DETALLE (DOCS + HISTORIAL)
  ============================== */

  async function openDetailModal(vehicle) {
    setDetailVehicle(vehicle);
    setActiveTab("docs");
    setDetailOpen(true);

    // Cargar documentos
    await loadDocuments(vehicle.id);
    // Cargar historial
    await loadHistory(vehicle.id);
  }

  async function loadDocuments(vehicleId) {
    try {
      setDocLoading(true);
      setDocError("");
      const docs = await getDocumentsByVehicle(vehicleId);
      setDocuments(docs);
    } catch (err) {
      console.error("Error cargando documentos:", err);
      setDocError("Error cargando documentos");
    } finally {
      setDocLoading(false);
    }
  }

  async function loadHistory(vehicleId) {
    try {
      setHistoryLoading(true);
      const logs = await getRouteLogsByVehicle(vehicleId);
      setHistoryLogs(logs.sort((a, b) => new Date(b.startDate) - new Date(a.startDate)));
    } catch (err) {
      console.error("Error obteniendo historial:", err);
      alert("No se pudo cargar el historial");
    } finally {
      setHistoryLoading(false);
    }
  }

  const filteredHistory = historyLogs.filter((log) => {
    const matchSearch =
      log.driverName.toLowerCase().includes(search.toLowerCase()) ||
      (log.receiverName || "").toLowerCase().includes(search.toLowerCase());

    const start = new Date(log.startDate);
    const afterStart = dateFrom ? start >= new Date(dateFrom) : true;
    const beforeEnd = dateTo ? start <= new Date(dateTo) : true;

    return matchSearch && afterStart && beforeEnd;
  });

  const activeRoute = historyLogs.find((l) => l.status === "ACTIVE");

  /* =============================
     SUBIR DOCUMENTO
  ============================== */

  async function handleUploadDocument(e) {
    e.preventDefault();
    if (!detailVehicle) return;

    if (!docFile || !docIssueDate || !docExpirationDate) {
      alert("Completa tipo, fechas y selecciona un archivo.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("type", docType);
      formData.append("issueDate", docIssueDate);
      formData.append("expirationDate", docExpirationDate);
      formData.append("file", docFile);

      await uploadDocument(detailVehicle.id, formData);

      // Reset
      setDocFile(null);
      setDocIssueDate("");
      setDocExpirationDate("");

      await loadDocuments(detailVehicle.id);
    } catch (err) {
      console.error("Error subiendo documento:", err);
      alert("Error subiendo documento");
    }
  }

  async function handleDeleteDocument(id) {
    if (!window.confirm("¿Eliminar este documento?")) return;
    try {
      await deleteDocument(id);
      if (detailVehicle) {
        await loadDocuments(detailVehicle.id);
      }
    } catch (err) {
      console.error("Error eliminando documento:", err);
      alert("Error eliminando documento");
    }
  }

  /* =============================
     RENDER
  ============================== */

  const renderVehicleForm = () => (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Patente</label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          value={currentVehicle?.plateNumber || ""}
          onChange={(e) =>
            setCurrentVehicle({ ...currentVehicle, plateNumber: e.target.value.toUpperCase() })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Permiso de Circulación</label>
        <input
          type="date"
          className="w-full p-2 border rounded"
          value={currentVehicle?.circulationPermitDate?.slice(0, 10) || ""}
          onChange={(e) =>
            setCurrentVehicle({ ...currentVehicle, circulationPermitDate: e.target.value })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Revisión Técnica</label>
        <input
          type="date"
          className="w-full p-2 border rounded"
          value={currentVehicle?.technicalReviewDate?.slice(0, 10) || ""}
          onChange={(e) =>
            setCurrentVehicle({ ...currentVehicle, technicalReviewDate: e.target.value })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium">SOAP</label>
        <input
          type="date"
          className="w-full p-2 border rounded"
          value={currentVehicle?.insuranceDate?.slice(0, 10) || ""}
          onChange={(e) =>
            setCurrentVehicle({ ...currentVehicle, insuranceDate: e.target.value })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Revisión de Gases</label>
        <input
          type="date"
          className="w-full p-2 border rounded"
          value={currentVehicle?.gasesReviewDate?.slice(0, 10) || ""}
          onChange={(e) =>
            setCurrentVehicle({ ...currentVehicle, gasesReviewDate: e.target.value })
          }
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setIsModalOpen(false)}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-orange-500 text-white rounded"
        >
          Guardar
        </button>
      </div>
    </form>
  );

  return (
    <div className="p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Flota de Vehículos</h1>
        <button
          onClick={openCreateModal}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar Vehículo
        </button>
      </div>

      {/* TARJETAS DE VEHÍCULOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {vehicles.map((v) => (
          <div key={v.id} className="bg-white shadow rounded-xl p-4 border flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">{v.plateNumber}</h2>

              <div className="mt-2 space-y-1">
                <DocumentBadge name="Permiso" date={v.circulationPermitDate} />
                <DocumentBadge name="Revisión Técnica" date={v.technicalReviewDate} />
              </div>
            </div>

            <div className="flex justify-between gap-2 mt-4">
              <button
                onClick={() => openDetailModal(v)}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center justify-center gap-1"
              >
                <History className="w-4 h-4" />
                Detalle / Historial
              </button>

              <button
                onClick={() => openEditModal(v)}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>

              <button
                onClick={() => handleDeleteVehicle(v.id)}
                className="px-2 py-2 bg-red-500 text-white rounded-lg text-sm flex items-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {vehicles.length === 0 && (
          <p className="text-gray-500 col-span-full text-center mt-8">
            No hay vehículos registrados.
          </p>
        )}
      </div>

      {/* MODAL CREAR / EDITAR VEHÍCULO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-6 z-50">
          <div className="bg-white p-6 rounded-xl max-w-lg w-full shadow-xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-bold mb-4">
              {modalMode === "create" ? "Nuevo Vehículo" : "Editar Vehículo"}
            </h2>

            {renderVehicleForm()}
          </div>
        </div>
      )}

      {/* MODAL DETALLE VEHÍCULO (DOCS + HISTORIAL) */}
      {detailOpen && detailVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-6xl shadow-xl max-h-[90vh] overflow-auto relative">
            <button
              onClick={() => setDetailOpen(false)}
              className="absolute right-4 top-4 text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold mb-2">
              Detalle vehículo — {detailVehicle.plateNumber}
            </h2>

            {/* TABS */}
            <div className="flex border-b mb-4 gap-2">
              <button
                className={`px-3 py-2 text-sm font-semibold ${
                  activeTab === "docs"
                    ? "border-b-2 border-orange-500 text-orange-600"
                    : "text-gray-600"
                }`}
                onClick={() => setActiveTab("docs")}
              >
                Documentos
              </button>
              <button
                className={`px-3 py-2 text-sm font-semibold ${
                  activeTab === "history"
                    ? "border-b-2 border-orange-500 text-orange-600"
                    : "text-gray-600"
                }`}
                onClick={() => setActiveTab("history")}
              >
                Historial de rutas
              </button>
            </div>

            {/* CONTENIDO DE TABS */}
            {activeTab === "docs" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documentos del vehículo
                </h3>

                {/* Form subir documento */}
                <form
                  className="bg-gray-50 border rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
                  onSubmit={handleUploadDocument}
                >
                  <div>
                    <label className="block text-xs font-medium">Tipo</label>
                    <select
                      className="w-full border rounded p-2 text-sm"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                    >
                      {Object.entries(DOCUMENT_TYPES).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Fecha emisión</label>
                    <input
                      type="date"
                      className="w-full border rounded p-2 text-sm"
                      value={docIssueDate}
                      onChange={(e) => setDocIssueDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Fecha vencimiento</label>
                    <input
                      type="date"
                      className="w-full border rounded p-2 text-sm"
                      value={docExpirationDate}
                      onChange={(e) => setDocExpirationDate(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                      className="text-xs"
                    />
                    <button
                      type="submit"
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-orange-500 text-white rounded text-sm"
                    >
                      <Upload className="w-4 h-4" />
                      Subir documento
                    </button>
                  </div>
                </form>

                {docError && <p className="text-red-500 text-sm">{docError}</p>}

                {/* Lista de documentos */}
                {docLoading ? (
                  <p className="text-gray-500 text-sm">Cargando documentos...</p>
                ) : documents.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay documentos registrados.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="border rounded-lg p-3 flex flex-col justify-between bg-white shadow-sm"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold">
                              {DOCUMENT_TYPES[doc.type] || doc.type}
                            </span>
                            <DocumentBadge name="Vence" date={doc.expirationDate} />
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            {doc.fileName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Emisión: {new Date(doc.issueDate).toISOString().slice(0, 10)}
                          </p>
                        </div>

                        <div className="flex justify-between items-center mt-3">
                          <button
                            className="text-xs text-blue-600 underline flex items-center gap-1"
                            type="button"
                            onClick={() => window.open(doc.filePath, "_blank")}
                          >
                            Ver archivo
                          </button>
                          <button
                            className="text-xs text-red-500 flex items-center gap-1"
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash className="w-3 h-3" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Historial de rutas
                </h3>

                {/* Ruta activa */}
                {activeRoute && (
                  <div className="bg-orange-50 border border-orange-200 rounded p-3 text-sm mb-2">
                    <p>
                      <strong>Ruta activa:</strong> {activeRoute.driverName} — KM inicio{" "}
                      {activeRoute.startMileage} km — desde{" "}
                      {new Date(activeRoute.startDate).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* FILTROS */}
                <div className="flex flex-wrap gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Buscar por conductor..."
                    className="p-2 border rounded text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <input
                    type="date"
                    className="p-2 border rounded text-sm"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <input
                    type="date"
                    className="p-2 border rounded text-sm"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>

                {/* TABLA HISTORIAL */}
                {historyLoading ? (
                  <p className="text-gray-500 text-sm">Cargando historial...</p>
                ) : filteredHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay registros para mostrar.</p>
                ) : (
                  <div className="overflow-auto border rounded">
                    <table className="w-full text-xs md:text-sm border-collapse">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 border">Inicio</th>
                          <th className="p-2 border">Recepción</th>
                          <th className="p-2 border">Conductor</th>
                          <th className="p-2 border">Receptor</th>
                          <th className="p-2 border">KM Inicio</th>
                          <th className="p-2 border">KM Fin</th>
                          <th className="p-2 border">Notas Inicio</th>
                          <th className="p-2 border">Notas Fin</th>
                          <th className="p-2 border">Imágenes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHistory.map((l) => (
                          <tr key={l.id} className="odd:bg-white even:bg-gray-50">
                            <td className="p-2 border">
                              {new Date(l.startDate).toLocaleString()}
                            </td>
                            <td className="p-2 border">
                              {l.endDate ? new Date(l.endDate).toLocaleString() : "-"}
                            </td>
                            <td className="p-2 border">{l.driverName}</td>
                            <td className="p-2 border">{l.receiverName || "-"}</td>
                            <td className="p-2 border">{l.startMileage}</td>
                            <td className="p-2 border">{l.endMileage || "-"}</td>
                            <td className="p-2 border">{l.notesStart || "-"}</td>
                            <td className="p-2 border">{l.notesEnd || "-"}</td>
                            <td className="p-2 border">
                              <div className="flex gap-1 flex-wrap">
                                {l.imagesStart?.map((img, idx) => (
                                  <img
                                    key={`start-${idx}`}
                                    src={img}
                                    alt="inicio"
                                    className="w-10 h-10 object-cover rounded cursor-pointer border"
                                    onClick={() => window.open(img, "_blank")}
                                  />
                                ))}
                                {l.imagesEnd?.map((img, idx) => (
                                  <img
                                    key={`end-${idx}`}
                                    src={img}
                                    alt="fin"
                                    className="w-10 h-10 object-cover rounded cursor-pointer border"
                                    onClick={() => window.open(img, "_blank")}
                                  />
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
