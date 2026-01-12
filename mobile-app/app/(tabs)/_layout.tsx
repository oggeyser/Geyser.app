import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: "#f97316",
        tabBarIcon: ({ color, size, focused }) => {
          let name: any = "ellipse";

          if (route.name === "index") name = focused ? "home" : "home-outline";
          if (route.name === "explore") name = focused ? "time" : "time-outline";
          if (route.name === "hoja-ruta") name = focused ? "document-text" : "document-text-outline";

          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="explore" options={{ title: "Historial" }} />
      <Tabs.Screen name="hoja-ruta" options={{ title: "Hoja de Ruta" }} />
    </Tabs>
  );
}
