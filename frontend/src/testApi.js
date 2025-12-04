// src/testApi.js
export async function testApiConnection() {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/vehicles`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    const data = await response.json();
    console.log("✅ Conexión exitosa con backend:", data);
    return data;
  } catch (error) {
    console.error("❌ Error conectando con el backend:", error);
  }
}
