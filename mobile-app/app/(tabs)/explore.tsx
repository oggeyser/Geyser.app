import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { getVehicles, getRouteLogsByVehicle } from "../../src/services/api";

type Vehicle = { id: number; plateNumber?: string };
type RouteLog = {
  id: number;
  driverName: string;
  receiverName?: string | null;
  startMileage: number;
  endMileage?: number | null;
  startDate?: string;
  endDate?: string | null;
  notesStart?: string | null;
  notesEnd?: string | null;
};

export default function HistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [logsLoading, setLogsLoading] = useState(false);
  const [logs, setLogs] = useState<RouteLog[]>([]);

  useEffect(() => {
    loadVehicles();
  }, []);

  async function loadVehicles() {
    try {
      setLoading(true);
      const v = await getVehicles();
      setVehicles(Array.isArray(v) ? v : []);
    } catch (e: any) {
      console.error(e?.message || e);
      Alert.alert("Error", "No se pudieron cargar los vehículos");
    } finally {
      setLoading(false);
    }
  }

  async function loadLogs(vehicle: Vehicle) {
    try {
      setSelectedVehicle(vehicle);
      setLogs([]);
      setLogsLoading(true);
      const data = await getRouteLogsByVehicle(vehicle.id);
      const sorted = (Array.isArray(data) ? data : []).sort(
        (a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime()
      );
      setLogs(sorted);
    } catch (e: any) {
      console.error(e?.message || e);
      Alert.alert("Error", "No se pudo cargar el historial");
    } finally {
      setLogsLoading(false);
    }
  }

  const title = useMemo(() => {
    if (!selectedVehicle) return "Selecciona un vehículo";
    return `Historial — ${selectedVehicle.plateNumber || "#" + selectedVehicle.id}`;
  }, [selectedVehicle]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10 }}>Cargando vehículos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🕒 Historial por vehículo</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.platesRow}>
        {vehicles.map((v) => {
          const active = selectedVehicle?.id === v.id;
          return (
            <Pressable
              key={v.id}
              onPress={() => loadLogs(v)}
              style={[styles.pill, active ? styles.pillActive : styles.pillIdle]}
            >
              <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextIdle]}>
                {v.plateNumber || `#${v.id}`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.subtitle}>{title}</Text>

      {logsLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10 }}>Cargando historial...</Text>
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.empty}>
          <Text>No hay registros para este vehículo.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          {logs.map((l) => (
            <View key={l.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                {l.startDate ? new Date(l.startDate).toLocaleString() : "Inicio: -"}
              </Text>
              <Text>Conductor: {l.driverName}</Text>
              <Text>KM inicio: {l.startMileage}</Text>
              <Text>Recepción: {l.endDate ? new Date(l.endDate).toLocaleString() : "-"}</Text>
              <Text>Receptor: {l.receiverName || "-"}</Text>
              <Text>KM fin: {l.endMileage ?? "-"}</Text>
              <Text>Notas inicio: {l.notesStart || "-"}</Text>
              <Text>Notas fin: {l.notesEnd || "-"}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 16, fontWeight: "bold", marginVertical: 10 },
  platesRow: { gap: 8, paddingVertical: 6 },
  pill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  pillIdle: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd" },
  pillActive: { backgroundColor: "#f97316" },
  pillText: { fontWeight: "bold" },
  pillTextIdle: { color: "#333" },
  pillTextActive: { color: "#fff" },
  empty: { backgroundColor: "#fff", padding: 14, borderRadius: 10 },
  card: { backgroundColor: "#fff", padding: 14, borderRadius: 10, marginBottom: 10 },
  cardTitle: { fontWeight: "bold", marginBottom: 6 },
});
