import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";

const ConfigContext = createContext();

export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider = ({ children }) => {
  const [kioskName, setKioskName] = useState("Kiosco System");
  const [kioskAddress, setKioskAddress] = useState("Dirección no configurada");
  const [themeColor, setThemeColor] = useState("blue");
  const [themeMode, setThemeMode] = useState("dark"); // 'light' | 'dark'
  const [loading, setLoading] = useState(true);

  // Mapa de colores para Tailwind (se usará para clases dinámicas manualmente)
  // bg-blue-600, text-blue-400, border-blue-500, etc.
  // Esto es para referencia, en los componentes usaremos el string 'themeColor'

  const loadSettings = async () => {
    try {
      if (window.api && window.api.getSettings) {
        const settings = await window.api.getSettings();
        if (settings.kiosk_name) setKioskName(settings.kiosk_name);
        if (settings.kiosk_address) setKioskAddress(settings.kiosk_address);
        if (settings.theme_color) setThemeColor(settings.theme_color);
        if (settings.theme_mode) setThemeMode(settings.theme_mode);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Efecto para aplicar la clase 'dark' al html/body
  useEffect(() => {
    const root = window.document.documentElement;
    if (themeMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [themeMode]);

  const updateConfig = async (newSettings) => {
    try {
      await window.api.updateSettings(newSettings);
      if (newSettings.kiosk_name) setKioskName(newSettings.kiosk_name);
      if (newSettings.kiosk_address) setKioskAddress(newSettings.kiosk_address);
      if (newSettings.theme_color) setThemeColor(newSettings.theme_color);
      if (newSettings.theme_mode) setThemeMode(newSettings.theme_mode);
      // Toast handled by component or here, let's return true for component handling
      return true;
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  };

  // Helper para obtener clases según el color (para el Sidebar, botones, etc)
  const getThemeClasses = (type) => {
    const colors = {
      blue: {
        bg: "bg-blue-600",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-500",
        hover: "hover:bg-blue-700",
      },
      purple: {
        bg: "bg-purple-600",
        text: "text-purple-600 dark:text-purple-400",
        border: "border-purple-500",
        hover: "hover:bg-purple-700",
      },
      green: {
        bg: "bg-green-600",
        text: "text-green-600 dark:text-green-400",
        border: "border-green-500",
        hover: "hover:bg-green-700",
      },
      orange: {
        bg: "bg-orange-600",
        text: "text-orange-600 dark:text-orange-400",
        border: "border-orange-500",
        hover: "hover:bg-orange-700",
      },
      pink: {
        bg: "bg-pink-600",
        text: "text-pink-600 dark:text-pink-400",
        border: "border-pink-500",
        hover: "hover:bg-pink-700",
      },
    };
    return colors[themeColor] || colors.blue;
  };

  return (
    <ConfigContext.Provider
      value={{
        kioskName,
        kioskAddress,
        themeColor,
        themeMode,
        updateConfig,
        getThemeClasses,
        loading,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};
