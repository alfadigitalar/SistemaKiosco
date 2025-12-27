import React, { useState, useEffect } from "react";
import { useConfig } from "../context/ConfigContext";
import { Save, Monitor, Palette, Sun, Moon } from "lucide-react";
import { toast } from "react-hot-toast";

const ConfiguracionScreen = () => {
  const {
    kioskName,
    kioskAddress,
    themeColor,
    themeMode,
    updateConfig,
    getThemeClasses,
  } = useConfig();

  const [name, setName] = useState(kioskName);
  const [address, setAddress] = useState(kioskAddress);
  const [selectedColor, setSelectedColor] = useState(themeColor);
  const [selectedMode, setSelectedMode] = useState(themeMode);

  useEffect(() => {
    setName(kioskName);
    setAddress(kioskAddress);
    setSelectedColor(themeColor);
    setSelectedMode(themeMode);
  }, [kioskName, kioskAddress, themeColor, themeMode]);

  const handleSave = async () => {
    const promise = updateConfig({
      kiosk_name: name,
      kiosk_address: address,
      theme_color: selectedColor,
      theme_mode: selectedMode,
    });
    toast.promise(promise, {
      loading: "Guardando...",
      success: "Configuración guardada",
      error: "Error al guardar",
    });
  };

  const theme = getThemeClasses(); // Clases del tema actual para botones

  const colors = [
    { id: "blue", name: "Azul", class: "bg-blue-500" },
    { id: "purple", name: "Violeta", class: "bg-purple-500" },
    { id: "green", name: "Verde", class: "bg-green-500" },
    { id: "orange", name: "Naranja", class: "bg-orange-500" },
    { id: "pink", name: "Rosa", class: "bg-pink-500" },
  ];

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          Configuración
        </h1>
        <p className="text-slate-400">Personaliza tu sistema</p>
      </div>

      <div className="max-w-2xl space-y-8">
        {/* Sección Identidad */}
        <div
          className={`bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border ${theme.border} shadow-lg transition-colors`}
        >
          <h2
            className={`text-xl font-bold mb-4 flex items-center gap-2 ${theme.text}`}
          >
            <Monitor className="text-slate-400" /> Identidad del Kiosco
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Nombre del Negocio
              </label>
              <input
                type="text"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Kiosco Pepe"
              />
              <p className="text-xs text-slate-500 mt-2">
                Este nombre se mostrará en el menú lateral y reportes.
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Dirección
              </label>
              <input
                type="text"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej: Av. Siempre Viva 742"
              />
              <p className="text-xs text-slate-500 mt-2">
                Esta dirección aparecerá en los pedidos y tickets.
              </p>
            </div>
          </div>
        </div>

        {/* Sección Tema */}
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg transition-colors">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Palette className="text-slate-400" /> Color del Tema
          </h2>
          <div className="flex gap-4 flex-wrap">
            {colors.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedColor(c.id)}
                className={`
                        w-16 h-16 rounded-xl flex items-center justify-center border-2 transition-all transform hover:scale-105
                        ${c.class}
                        ${
                          selectedColor === c.id
                            ? "border-white scale-105 shadow-xl ring-2 ring-white/20"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }
                     `}
                title={c.name}
              >
                {selectedColor === c.id && (
                  <div className="w-3 h-3 bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Selecciona el color de énfasis para botones, iconos y bordes
            activos.
          </p>
        </div>

        {/* Sección Modo Claro/Oscuro */}
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg transition-colors">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
            <Monitor className="text-slate-400" /> Apariencia
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedMode("light")}
              className={`
                px-4 py-2 rounded-lg font-bold border-2 transition-all flex items-center gap-2
                ${
                  selectedMode === "light"
                    ? "bg-white border-blue-500 text-blue-600 shadow-md"
                    : "bg-slate-200 text-slate-500 border-transparent hover:bg-slate-300"
                }
              `}
            >
              <Sun size={20} /> Modo Claro
            </button>
            <button
              onClick={() => setSelectedMode("dark")}
              className={`
                px-4 py-2 rounded-lg font-bold border-2 transition-all flex items-center gap-2
                ${
                  selectedMode === "dark"
                    ? "bg-slate-900 border-blue-500 text-blue-400 shadow-md"
                    : "bg-slate-300 text-slate-600 border-transparent hover:bg-slate-400"
                }
              `}
            >
              <Moon size={20} /> Modo Oscuro
            </button>
          </div>
        </div>

        {/* Botón Guardar */}
        <button
          onClick={handleSave}
          className={`
             w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95
             ${theme.bg} ${theme.hover}
           `}
        >
          <Save /> GUARDAR CAMBIOS
        </button>
      </div>
    </div>
  );
};

export default ConfiguracionScreen;
