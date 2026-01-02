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

  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxCuit, setTaxCuit] = useState("");
  const [taxSalesPoint, setTaxSalesPoint] = useState("");
  const [taxCertPath, setTaxCertPath] = useState("");
  const [taxKeyPath, setTaxKeyPath] = useState("");

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
        // Tax
        if (settings.tax_enabled)
          setTaxEnabled(settings.tax_enabled === "true");
        if (settings.tax_cuit) setTaxCuit(settings.tax_cuit);
        if (settings.tax_sales_point)
          setTaxSalesPoint(settings.tax_sales_point);
        if (settings.tax_cert_path) setTaxCertPath(settings.tax_cert_path);
        if (settings.tax_key_path) setTaxKeyPath(settings.tax_key_path);
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

    const applyTheme = () => {
      let isDark = false;

      if (themeMode === "auto") {
        // Horario Buenos Aires (aprox GMT-3)
        // Pero usamos la hora local del sistema asumiendo que el usuario está en la zona correcta.
        // Si queremos forzar "sensación" de día/noche:
        const hour = new Date().getHours();
        // Día: 07:00 a 20:00 (8 PM)
        if (hour >= 7 && hour < 20) {
          isDark = false;
        } else {
          isDark = true;
        }
      } else {
        isDark = themeMode === "dark";
      }

      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    applyTheme();

    // Si es auto, revisar cada minuto por si cambia el horario de dia/noche
    let interval;
    if (themeMode === "auto") {
      interval = setInterval(applyTheme, 60000);
    }

    return () => clearInterval(interval);
  }, [themeMode]);

  const updateConfig = async (newSettings) => {
    try {
      await window.api.updateSettings(newSettings);
      if (newSettings.kiosk_name) setKioskName(newSettings.kiosk_name);
      if (newSettings.kiosk_address) setKioskAddress(newSettings.kiosk_address);
      if (newSettings.theme_color) setThemeColor(newSettings.theme_color);
      if (newSettings.theme_mode) setThemeMode(newSettings.theme_mode);

      // Tax updates
      if (newSettings.tax_enabled !== undefined)
        setTaxEnabled(newSettings.tax_enabled === "true");
      if (newSettings.tax_cuit !== undefined) setTaxCuit(newSettings.tax_cuit);
      if (newSettings.tax_sales_point !== undefined)
        setTaxSalesPoint(newSettings.tax_sales_point);
      if (newSettings.tax_cert_path !== undefined)
        setTaxCertPath(newSettings.tax_cert_path);
      if (newSettings.tax_key_path !== undefined)
        setTaxKeyPath(newSettings.tax_key_path);

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
      red: {
        bg: "bg-red-600",
        text: "text-red-600 dark:text-red-400",
        border: "border-red-500",
        hover: "hover:bg-red-700",
      },
      yellow: {
        bg: "bg-yellow-500",
        text: "text-yellow-600 dark:text-yellow-400",
        border: "border-yellow-500",
        hover: "hover:bg-yellow-600",
      },
      teal: {
        bg: "bg-teal-600",
        text: "text-teal-600 dark:text-teal-400",
        border: "border-teal-500",
        hover: "hover:bg-teal-700",
      },
      cyan: {
        bg: "bg-cyan-600",
        text: "text-cyan-600 dark:text-cyan-400",
        border: "border-cyan-500",
        hover: "hover:bg-cyan-700",
      },
      indigo: {
        bg: "bg-indigo-600",
        text: "text-indigo-600 dark:text-indigo-400",
        border: "border-indigo-500",
        hover: "hover:bg-indigo-700",
      },
      // Colores Pastel
      pastelBlue: {
        bg: "bg-sky-400",
        text: "text-sky-500 dark:text-sky-300",
        border: "border-sky-400",
        hover: "hover:bg-sky-500",
      },
      pastelPurple: {
        bg: "bg-violet-400",
        text: "text-violet-500 dark:text-violet-300",
        border: "border-violet-400",
        hover: "hover:bg-violet-500",
      },
      pastelGreen: {
        bg: "bg-emerald-400",
        text: "text-emerald-500 dark:text-emerald-300",
        border: "border-emerald-400",
        hover: "hover:bg-emerald-500",
      },
      pastelPink: {
        bg: "bg-rose-400",
        text: "text-rose-500 dark:text-rose-300",
        border: "border-rose-400",
        hover: "hover:bg-rose-500",
      },
      pastelOrange: {
        bg: "bg-orange-400",
        text: "text-orange-500 dark:text-orange-300",
        border: "border-orange-400",
        hover: "hover:bg-orange-500",
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
        // Tax
        taxEnabled,
        taxCuit,
        taxSalesPoint,
        taxCertPath,
        taxKeyPath,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};
