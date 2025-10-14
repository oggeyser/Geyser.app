import React from "react";

const Header = ({ title }) => {
  return (
    <header className="bg-white shadow-md h-16 flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-gray-700">{title}</h1>
      <div className="flex items-center gap-3">
        <span className="text-gray-600 font-medium">Admin</span>
        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
          G
        </div>
      </div>
    </header>
  );
};

export default Header;
