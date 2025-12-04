import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Ordenes from "./pages/Ordenes";
import Tecnicos from "./pages/Tecnicos";
import Reportes from "./pages/Reportes";
import HojaRuta from "./pages/HojaRuta";

const App = () => {
  const [activePage, setActivePage] = useState("Dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard />;
      case "Órdenes":
        return <Ordenes />;
      case "Técnicos":
        return <Tecnicos />;
      case "Reportes":
        return <Reportes />;
      case "Hoja de Ruta":
        return <HojaRuta />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex-1 flex flex-col">
        <Header title={activePage} />
        <main className="flex-1 p-6 overflow-y-auto">{renderPage()}</main>
      </div>
    </div>
  );
};

export default App;
