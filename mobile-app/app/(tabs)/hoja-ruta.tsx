import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

// ✅ Importa funciones (NO default api)
import {
  getVehicles,
  getActiveRouteLogs,
  createRouteLogMultipart,
  transferRouteLogMultipart,
} from "../../src/services/api";

type Vehicle = {
  id: number;
  plateNumber?: string;
  status?: string;
};

type RouteLog = {
  id: number;
  vehicleId: number;
  status: "ACTIVE" | "FINISHED";
  driverName: string;
  receiverName?: string | null;
  startMileage: number;
  endMileage?: number | null;
  notesStart?: string | null;
  notesEnd?: string | null;
  startDate?: string;
  endDate?: string | null;
  vehicle?: Vehicle; // si backend lo incluye
};

type PickedImage = { uri: string; name?: string; type?: string };

function guessMime(uri: string) {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function fileNameFromUri(uri: string, prefix: string) {
  const last = uri.split("/").pop() || `${prefix}.jpg`;
  if (last.includes(".")) return last;
  return `${last}.jpg`;
}

export default function HojaRutaScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeLogs, setActiveLogs] = useState<RouteLog[]>([]);

  // -------------------------
  // MODAL: INICIO HOJA DE RUTA
  // -------------------------
  const [startOpen, setStartOpen] = useState(false);
  const [startVehicleId, setStartVehicleId] = useState<number | null>(null);
  const [startDriverName, setStartDriverName] = useState("");
  const [startMileage, setStartMileage] = useState("");
  const [startNotes, setStartNotes] = useState("");
  const [startImages, setStartImages] = useState<PickedImage[]>([]);
  const startImagesCount = startImages.length;

  // -------------------------
  // MODAL: RECEPCIÓN / TRANSFER
  // -------------------------
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<RouteLog | null>(null);
  const [receiverName, setReceiverName] = useState("");
  const [endMileage, setEndMileage] = useState("");
  const [endNotes, setEndNotes] = useState("");
  const [endImages, setEndImages] = useState<PickedImage[]>([]);
  const endImagesCount = endImages.length;

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [v, logs] = await Promise.all([getVehicles(), getActiveRouteLogs()]);
      setVehicles(Array.isArray(v) ? v : []);
      setActiveLogs(Array.isArray(logs) ? logs : []);
    } catch (e: any) {
      console.error(e?.message || e);
      Alert.alert("Error", "No se pudo cargar Hoja de Ruta");
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    try {
      setRefreshing(true);
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  }

  // -------------------------
  // IMAGE PICKER (hasta 10)
  // -------------------------
  async function pickImages(max: number, currentCount: number, setFn: (imgs: PickedImage[]) => void, current: PickedImage[]) {
    const remaining = Math.max(0, max - currentCount);
    if (remaining <= 0) {
      Alert.alert("Límite alcanzado", `Máximo ${max} fotos.`);
      return;
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permiso requerido", "Debes permitir acceso a la galería.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining, // 👈 hasta completar 10
      quality: 0.7,
    });

    if (result.canceled) return;

    const assets = result.assets || [];
    const mapped: PickedImage[] = assets.map((a, idx) => ({
      uri: a.uri,
      type: guessMime(a.uri),
      name: fileNameFromUri(a.uri, `img_${Date.now()}_${idx}`),
    }));

    setFn([...current, ...mapped].slice(0, max));
  }

  function clearStartModal() {
    setStartVehicleId(null);
    setStartDriverName("");
    setStartMileage("");
    setStartNotes("");
    setStartImages([]);
  }

  function clearTransferModal() {
    setSelectedLog(null);
    setReceiverName("");
    setEndMileage("");
    setEndNotes("");
    setEndImages([]);
  }

  // -------------------------
  // ACCIONES
  // -------------------------
  function openStartModal() {
    clearStartModal();
    setStartOpen(true);
  }

  function openTransferModal(log: RouteLog) {
    clearTransferModal();
    setSelectedLog(log);
    setReceiverName("");
    setEndMileage("");
    setEndNotes("");
    setTransferOpen(true);
  }

  async function submitStart() {
    if (!startVehicleId) return Alert.alert("Falta", "Selecciona un vehículo.");
    if (!startDriverName.trim()) return Alert.alert("Falta", "Escribe el nombre del conductor.");
    if (!startMileage.trim() || isNaN(Number(startMileage))) return Alert.alert("Falta", "KM inicio inválido.");

    try {
      await createRouteLogMultipart({
        vehicleId: startVehicleId,
        driverName: startDriverName.trim(),
        startMileage: Number(startMileage),
        notesStart: startNotes.trim() || undefined,
        images: startImages, // 👈 hasta 10
      });

      Alert.alert("OK", "Hoja de ruta iniciada.");
      setStartOpen(false);
      clearStartModal();
      await loadAll();
    } catch (e: any) {
      console.error(e?.message || e);
      Alert.alert("Error", "No se pudo iniciar la hoja de ruta.");
    }
  }

  async function submitTransfer() {
    if (!selectedLog) return;
    if (!receiverName.trim()) return Alert.alert("Falta", "Escribe el nombre del receptor.");
    if (!endMileage.trim() || isNaN(Number(endMileage))) return Alert.alert("Falta", "KM fin inválido.");

    try {
      await transferRouteLogMultipart(selectedLog.id, {
        receiverName: receiverName.trim(),
        endMileage: Number(endMileage),
        notesEnd: endNotes.trim() || undefined,
        images: endImages, // 👈 hasta 10
      });

      Alert.alert("OK", "Recepción registrada.");
      setTransferOpen(false);
      clearTransferModal();
      await loadAll();
    } catch (e: any) {
      console.error(e?.message || e);
      Alert.alert("Error", "No se pudo registrar la recepción.");
    }
  }

  const vehiclesById = useMemo(() => {
    const m = new Map<number, Vehicle>();
    vehicles.forEach((v) => m.set(v.id, v));
    return m;
  }, [vehicles]);

  // -------------------------
  // UI
  // -------------------------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10 }}>Cargando Hoja de Ruta...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📄 Hoja de Ruta</Text>

      <View style={styles.actionsRow}>
        <Pressable style={[styles.btn, styles.btnPrimary]} onPress={openStartModal}>
          <Text style={styles.btnText}>Iniciar</Text>
        </Pressable>

        <Pressable style={styles.btn} onPress={onRefresh}>
          <Text style={styles.btnText}>Actualizar</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Activos por vehículo</Text>

      <FlatList
        data={activeLogs}
        keyExtractor={(item) => String(item.id)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>No hay hojas de ruta activas.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const plate =
            item.vehicle?.plateNumber ||
            vehiclesById.get(item.vehicleId)?.plateNumber ||
            `Vehículo #${item.vehicleId}`;

          return (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{plate}</Text>
              <Text>Conductor: {item.driverName}</Text>
              <Text>KM inicio: {item.startMileage}</Text>
              <Text>Inicio: {item.startDate ? new Date(item.startDate).toLocaleString() : "-"}</Text>

              <View style={{ height: 10 }} />

              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => openTransferModal(item)}>
                <Text style={styles.btnText}>Recepcionar</Text>
              </Pressable>
            </View>
          );
        }}
      />

      {/* ==========================
          MODAL INICIO
      ========================== */}
      <Modal visible={startOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Iniciar Hoja de Ruta</Text>

            <Text style={styles.label}>Vehículo</Text>
            <View style={styles.pillsRow}>
              {vehicles.map((v) => {
                const active = startVehicleId === v.id;
                return (
                  <Pressable
                    key={v.id}
                    onPress={() => setStartVehicleId(v.id)}
                    style={[styles.pill, active ? styles.pillActive : styles.pillIdle]}
                  >
                    <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextIdle]}>
                      {v.plateNumber || `#${v.id}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Conductor</Text>
            <TextInput
              value={startDriverName}
              onChangeText={setStartDriverName}
              placeholder="Ej: Juan Pérez"
              style={styles.input}
            />

            <Text style={styles.label}>KM inicio</Text>
            <TextInput
              value={startMileage}
              onChangeText={setStartMileage}
              placeholder="Ej: 12345"
              keyboardType="numeric"
              style={styles.input}
            />

            <Text style={styles.label}>Notas (opcional)</Text>
            <TextInput
              value={startNotes}
              onChangeText={setStartNotes}
              placeholder="Observaciones..."
              style={[styles.input, { height: 80 }]}
              multiline
            />

            <View style={styles.photoRow}>
              <Pressable
                style={styles.btn}
                onPress={() => pickImages(10, startImagesCount, setStartImages, startImages)}
              >
                <Text style={styles.btnText}>Agregar fotos ({startImagesCount}/10)</Text>
              </Pressable>

              <Pressable
                style={[styles.btn, styles.btnDanger]}
                onPress={() => setStartImages([])}
              >
                <Text style={styles.btnText}>Limpiar</Text>
              </Pressable>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.btn, styles.btnSoft]}
                onPress={() => {
                  setStartOpen(false);
                  clearStartModal();
                }}
              >
                <Text style={styles.btnSoftText}>Cerrar</Text>
              </Pressable>

              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={submitStart}>
                <Text style={styles.btnText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==========================
          MODAL RECEPCIÓN
      ========================== */}
      <Modal visible={transferOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Recepcionar Vehículo</Text>

            <Text style={styles.muted}>
              {selectedLog
                ? `Vehículo: ${
                    selectedLog.vehicle?.plateNumber ||
                    vehiclesById.get(selectedLog.vehicleId)?.plateNumber ||
                    `#${selectedLog.vehicleId}`
                  }`
                : ""}
            </Text>

            <Text style={styles.label}>Receptor</Text>
            <TextInput
              value={receiverName}
              onChangeText={setReceiverName}
              placeholder="Ej: Pedro Soto"
              style={styles.input}
            />

            <Text style={styles.label}>KM fin</Text>
            <TextInput
              value={endMileage}
              onChangeText={setEndMileage}
              placeholder="Ej: 12555"
              keyboardType="numeric"
              style={styles.input}
            />

            <Text style={styles.label}>Notas (opcional)</Text>
            <TextInput
              value={endNotes}
              onChangeText={setEndNotes}
              placeholder="Observaciones..."
              style={[styles.input, { height: 80 }]}
              multiline
            />

            <View style={styles.photoRow}>
              <Pressable
                style={styles.btn}
                onPress={() => pickImages(10, endImagesCount, setEndImages, endImages)}
              >
                <Text style={styles.btnText}>Agregar fotos ({endImagesCount}/10)</Text>
              </Pressable>

              <Pressable
                style={[styles.btn, styles.btnDanger]}
                onPress={() => setEndImages([])}
              >
                <Text style={styles.btnText}>Limpiar</Text>
              </Pressable>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.btn, styles.btnSoft]}
                onPress={() => {
                  setTransferOpen(false);
                  clearTransferModal();
                }}
              >
                <Text style={styles.btnSoftText}>Cerrar</Text>
              </Pressable>

              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={submitTransfer}>
                <Text style={styles.btnText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// -------------------------
// STYLES
// -------------------------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },

  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 10 },

  btn: {
    flex: 1,
    backgroundColor: "#444",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnPrimary: { backgroundColor: "#f97316" },
  btnDanger: { backgroundColor: "#b91c1c", flex: 0.6 },
  btnSoft: { backgroundColor: "#e5e7eb" },

  btnText: { color: "#fff", fontWeight: "bold" },
  btnSoftText: { color: "#111827", fontWeight: "bold" },

  sectionTitle: { fontSize: 16, fontWeight: "bold", marginTop: 8, marginBottom: 8 },

  card: { backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 6 },

  empty: { backgroundColor: "#fff", padding: 14, borderRadius: 12 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 16,
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    maxHeight: "92%",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  label: { fontWeight: "bold", marginTop: 10, marginBottom: 6 },
  muted: { color: "#6b7280", marginBottom: 6 },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
  },

  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  pillIdle: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd" },
  pillActive: { backgroundColor: "#f97316" },
  pillText: { fontWeight: "bold" },
  pillTextIdle: { color: "#111827" },
  pillTextActive: { color: "#fff" },

  photoRow: { flexDirection: "row", gap: 10, marginTop: 12 },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 14 },
});
