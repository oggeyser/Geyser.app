import { View, Text, FlatList, StyleSheet, Pressable, Alert } from "react-native";
import { useEffect, useState } from "react";
import { getVehicles, createVehicle } from "../../src/services/api";


export default function HomeScreen() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await getVehicles();
      setVehicles(data);

    } catch (error) {
      console.error("❌ Error cargando vehículos:", error);
      Alert.alert("Error", "No se pudieron cargar los vehículos");
    } finally {
      setLoading(false);
    }
  };

  const createTestVehicle = async () => {
    try {
      const plate = "TEST" + Math.floor(Math.random() * 900 + 100);
      await createVehicle({
        plateNumber: plate,
        circulationPermitDate: "2026-02-01",
        technicalReviewDate: "2026-02-01",
        insuranceDate: "2026-02-01",
        gasesReviewDate: "2026-02-01",
      });

      Alert.alert("OK", `Vehículo creado: ${plate}`);
      loadVehicles();
    } catch (error) {
      console.error("❌ Error creando vehículo:", error);
      Alert.alert("Error", "No se pudo crear el vehículo");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Cargando vehículos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚗 Flota de Vehículos</Text>

      <View style={styles.row}>
        <Pressable style={styles.btn} onPress={loadVehicles}>
          <Text style={styles.btnText}>Actualizar</Text>
        </Pressable>

        <Pressable style={[styles.btn, styles.btnPrimary]} onPress={createTestVehicle}>
          <Text style={styles.btnText}>Crear test</Text>
        </Pressable>
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => Alert.alert("Vehículo", `${item.plateNumber}\nEstado: ${item.status}`)}
          >
            <Text style={styles.plate}>{item.plateNumber}</Text>
            <Text>Estado: {item.status}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },

  row: { flexDirection: "row", gap: 10, marginBottom: 15 },

  btn: {
    flex: 1,
    backgroundColor: "#444",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnPrimary: { backgroundColor: "#f97316" },
  btnText: { color: "#fff", fontWeight: "bold" },

  card: { backgroundColor: "#fff", padding: 15, borderRadius: 8, marginBottom: 10 },
  plate: { fontSize: 18, fontWeight: "bold" },
});
