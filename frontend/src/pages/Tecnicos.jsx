import React from 'react';

// 1. Definimos la lista de técnicos con su cargo.
const tecnicos = [
  { nombre: "Silverio Cisterna", cargo: "Jefe Técnico" },
  { nombre: "Cristian Grau", cargo: "Técnico" },
  { nombre: "José Gonzales", cargo: "Técnico" },
  { nombre: "Efraín Rodriguez", cargo: "Técnico" },
  { nombre: "Patricio Arias", cargo: "Técnico" },
  { nombre: "Jonathan Cabrera", cargo: "Técnico" },
];

const Tecnicos = () => {
  return (
    <div className="p-4">
      {/* Título de la sección */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Equipo Técnico</h2>
      
      {/* 2. Contenedor de las tarjetas con diseño de cuadrícula (grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 3. Mapeamos (iteramos) la lista de técnicos para crear una tarjeta por cada uno */}
        {tecnicos.map((tecnico, index) => (
          <div 
            key={index} 
            className="bg-white rounded-xl shadow-lg p-6 transition transform hover:scale-[1.02] hover:shadow-xl"
          >
            {/* 4. Contenido de la tarjeta */}
            
            {/* Ícono o inicial (puedes añadir lucide-react aquí si quieres un ícono de usuario) */}
            <div className="flex items-center justify-center w-12 h-12 bg-indigo-500 rounded-full text-white text-xl font-bold mb-4">
              {tecnico.nombre[0]} {/* Muestra la primera letra del nombre */}
            </div>

            {/* Nombre del técnico */}
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {tecnico.nombre}
            </h3>

            {/* Cargo del técnico */}
            <p className={`text-sm font-medium ${tecnico.cargo === 'Jefe Técnico' ? 'text-red-500' : 'text-gray-600'}`}>
              {tecnico.cargo}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tecnicos;