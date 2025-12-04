import React from "react";
import { Truck, ClipboardList, Users, BarChart3, Map} from "lucide-react";

const Sidebar = ({ activePage, setActivePage }) => {
  const menuItems = [
    { name: "Dashboard", icon: <Truck size={20} /> },
    { name: "Órdenes", icon: <ClipboardList size={20} /> },
    { name: "Técnicos", icon: <Users size={20} /> },
    { name: "Reportes", icon: <BarChart3 size={20} /> },
    { name: "Hoja de Ruta", icon: <Map size={20} /> },
  ];

  return (
    <div className="w-64 bg-black text-white flex flex-col">
      <div className="flex items-center justify-center h-20 bg-black">
  <img src="/logo.png" alt="Geyser Logo" className="h-16 w-auto" />
</div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setActivePage(item.name)}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
              activePage === item.name
                ? "bg-orange-500 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
          >
            {item.icon}
            {item.name}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
