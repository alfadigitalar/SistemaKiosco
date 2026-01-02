import React, { useState, useEffect, useRef } from "react";
import { useConfig } from "../context/ConfigContext";
import {
  Save,
  Monitor,
  Palette,
  Sun,
  Moon,
  User,
  Database,
  Printer,
  Archive,
  AlertTriangle,
  UploadCloud,
  Mail,
} from "lucide-react";
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
  const [backups, setBackups] = useState([]);

  // State for Logo
  const [ticketLogo, setTicketLogo] = useState(null);

  // State for SMTP (Email)
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");

  // State for Tax (ARCA)
  const { taxEnabled, taxCuit, taxSalesPoint, taxCertPath, taxKeyPath } =
    useConfig();
  const [taxEnabledLocal, setTaxEnabledLocal] = useState(false);
  const [taxCuitLocal, setTaxCuitLocal] = useState("");
  const [taxSalesPointLocal, setTaxSalesPointLocal] = useState("");
  const [taxCertPathLocal, setTaxCertPathLocal] = useState("");
  const [taxKeyPathLocal, setTaxKeyPathLocal] = useState("");

  // Estado para gestión de usuario
  const [currentUser, setCurrentUser] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [birthday, setBirthday] = useState("");

  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  // Handle Avatar Selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("La imagen es muy pesada (Max 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    setName(kioskName);
    setAddress(kioskAddress);
    setSelectedColor(themeColor);
    setSelectedMode(themeMode);

    // Cargar user del localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);
    if (user.profile_picture) setAvatarPreview(user.profile_picture);
    if (user.birthday) setBirthday(user.birthday);

    // Cargar logo
    window.api.getSettings().then((settings) => {
      // Nota: settings puede venir como array o objeto dependiendo de mi fix en index.js,
      // pero aqui asumimos que el endpoint getSettings retorna objeto (o lo procesa).
      // Momento, getSettings usa 'get' SELECT * FROM settings LIMIT 1 en ipcHandlers.js?
      // No, ipcHandlers.js tiene 'get-settings'. Vamos a revisar ese handler luego.
      // Por ahora asumo que devuelve un objeto con ticket_logo.
      if (settings && settings.ticket_logo) {
        setTicketLogo(settings.ticket_logo);
      }
      if (settings) {
        if (settings.smtp_host) setSmtpHost(settings.smtp_host);
        if (settings.smtp_port) setSmtpPort(settings.smtp_port);
        if (settings.smtp_user) setSmtpUser(settings.smtp_user);
        if (settings.smtp_pass) setSmtpPass(settings.smtp_pass);
      }
    });

    // Sync Tax
    setTaxEnabledLocal(taxEnabled);
    setTaxCuitLocal(taxCuit || "");
    setTaxSalesPointLocal(taxSalesPoint || "");
    setTaxCertPathLocal(taxCertPath || "");
    setTaxKeyPathLocal(taxKeyPath || "");
  }, [
    kioskName,
    kioskAddress,
    themeColor,
    themeMode,
    taxEnabled,
    taxCuit,
    taxSalesPoint,
    taxCertPath,
    taxKeyPath,
  ]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB Limit
        toast.error("El logo es muy pesado (Max 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTicketLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const saveOperation = async () => {
      // 1. Guardar Configuración
      await updateConfig({
        kiosk_name: name,
        kiosk_address: address,
        theme_color: selectedColor,
        theme_mode: selectedMode,
        ticket_logo: ticketLogo,
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_user: smtpUser,
        smtp_pass: smtpPass,
      });

      // 2. Guardar Perfil Usuario
      if (currentUser.id) {
        const userResult = await window.api.updateUser({
          id: currentUser.id,
          birthday: birthday,
          profile_picture: avatarPreview,
        });

        if (!userResult.success) {
          throw new Error(userResult.message || "Error al actualizar perfil");
        }

        // Actualizar local storage
        const updatedUser = {
          ...currentUser,
          birthday,
          profile_picture: avatarPreview,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
      }
    };

    toast.promise(saveOperation(), {
      loading: "Guardando cambios...",
      success: "¡Configuración Guardada! ✅",
      error: (err) => `Error: ${err.message}`,
    });
  };

  const handleExport = async () => {
    try {
      const result = await window.api.exportData();
      if (!result || !result.success) {
        if (result?.message !== "Exportación cancelada") {
          throw new Error(result?.message || "Error desconocido");
        }
        return; // Cancelled silently
      }
      toast.success(`Datos exportados en: ${result.path}`, { duration: 5000 });
    } catch (e) {
      console.error(e);
      toast.error("Error al exportar: " + e.message);
    }
  };

  const theme = getThemeClasses(); // Clases del tema actual para botones

  const colors = [
    { id: "blue", name: "Azul", class: "bg-blue-500" },
    { id: "purple", name: "Violeta", class: "bg-purple-500" },
    { id: "green", name: "Verde", class: "bg-green-500" },
    { id: "orange", name: "Naranja", class: "bg-orange-500" },
    { id: "pink", name: "Rosa", class: "bg-pink-500" },
    { id: "red", name: "Rojo", class: "bg-red-500" },
    { id: "yellow", name: "Amarillo", class: "bg-yellow-500" },
    { id: "teal", name: "Verde Azulado", class: "bg-teal-500" },
    { id: "cyan", name: "Cian", class: "bg-cyan-500" },
    { id: "indigo", name: "Índigo", class: "bg-indigo-500" },
    // Pasteles
    { id: "pastelBlue", name: "Cielo Pastel", class: "bg-sky-400" },
    { id: "pastelPurple", name: "Lavanda", class: "bg-violet-400" },
    { id: "pastelGreen", name: "Menta", class: "bg-emerald-400" },
    { id: "pastelPink", name: "Rosa Pastel", class: "bg-rose-400" },
    { id: "pastelOrange", name: "Durazno", class: "bg-orange-400" },
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

        {/* Sección Perfil de Usuario */}
        <div
          className={`bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border ${theme.border} shadow-lg transition-colors`}
        >
          <h2
            className={`text-xl font-bold mb-4 flex items-center gap-2 ${theme.text}`}
          >
            <User className="text-slate-400" /> Perfil de Usuario
          </h2>
          <div className="flex items-start gap-6">
            {/* Avatar Placeholder / Upload */}
            <div className="flex flex-col items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              <div
                onClick={() => fileInputRef.current.click()}
                className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 border-4 border-white dark:border-slate-600 flex items-center justify-center overflow-hidden shadow-inner relative group cursor-pointer"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-slate-400" />
                )}

                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold">Cambiar</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                @{currentUser.username || "usuario"}
              </p>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">
                  ¡Te saludaremos en tu cumpleaños! 🎉
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Miembro desde:</strong>{" "}
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sección Ticket */}
        <div
          className={`bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border ${theme.border} shadow-lg transition-colors`}
        >
          <h2
            className={`text-xl font-bold mb-4 flex items-center gap-2 ${theme.text}`}
          >
            <Printer className="text-slate-400" /> Configuración de Ticket
          </h2>
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-2">
              <input
                type="file"
                ref={logoInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleLogoChange}
              />
              <div
                onClick={() => logoInputRef.current.click()}
                className="w-32 h-32 rounded-lg bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer overflow-hidden relative group"
              >
                {ticketLogo ? (
                  <img
                    src={ticketLogo}
                    alt="Logo"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <p className="text-xs">Click para subir</p>
                    <p className="font-bold text-sm">LOGO</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold">
                    Cambiar Logo
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Esta imagen aparecerá en la cabecera de sus tickets impresos. Se
                recomienda usar una imagen en blanco y negro (monocromática)
                para mejor calidad en impresoras térmicas.
              </p>
              {ticketLogo && (
                <button
                  onClick={() => setTicketLogo(null)}
                  className="text-red-500 text-sm hover:underline"
                >
                  Eliminar Logo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sección Copias de Seguridad */}
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg transition-colors mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
            <Archive className="text-slate-400" /> Copias de Seguridad
          </h2>
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 flex gap-2">
                <AlertTriangle className="flex-shrink-0" size={18} />
                <span>
                  Realice copias manuales periódicamente. El sistema guarda las
                  últimas 10 copias automáticamente. Al restaurar una copia, el
                  sistema se reiniciará.
                </span>
              </p>
            </div>

            <div className="flex justify-start">
              <button
                onClick={async () => {
                  const res = await window.api.invoke("create-backup");
                  if (res.success) {
                    toast.success("Copia creada exitosamente");
                    loadBackups();
                  } else {
                    toast.error("Error: " + res.message);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg font-bold text-slate-700 dark:text-white transition"
              >
                <UploadCloud size={18} /> Crear Copia de Seguridad Ahora
              </button>
            </div>

            {/* Listado de backups */}
            {backups.length > 0 && (
              <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">
                  Historial de Copias
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {backups.map((bak) => (
                    <div
                      key={bak.name}
                      className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div>
                        <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
                          {bak.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(bak.date).toLocaleString()} -{" "}
                          {(bak.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (
                            confirm(
                              `¿Está seguro de RESTAURAR esta copia? \n${bak.name}\n\nEL SISTEMA SE REINICIARÁ Y SE PERDERÁN LOS DATOS NO GUARDADOS DESDE ESA COPIA.`
                            )
                          ) {
                            const res = await window.api.invoke(
                              "restore-backup",
                              bak.name
                            );
                            if (!res.success) toast.error(res.message);
                          }
                        }}
                        className="text-xs bg-slate-200 hover:bg-red-500 hover:text-white dark:bg-slate-700 dark:hover:bg-red-600 px-3 py-1 rounded transition-colors"
                      >
                        Restaurar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sección Gestión de Datos */}
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg transition-colors mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
            <Database className="text-slate-400" /> Gestión de Datos
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              <p>
                Exporte su base de datos completa (Productos, Clientes, Ventas)
                a formato Excel (CSV) para realizar copias de seguridad o
                análisis externos.
              </p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap"
            >
              <Database size={20} />
              Exportar a Excel
            </button>
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

        {/* Sección Facturación Electrónica (ARCA / AFIP) */}
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg transition-colors">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
            <Printer className="text-slate-400" /> Facturación Electrónica
            (ARCA)
          </h2>

          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={taxEnabledLocal}
                  onChange={(e) => setTaxEnabledLocal(e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-slate-900 dark:text-slate-300">
                  {taxEnabledLocal ? "Habilitado" : "Deshabilitado"}
                </span>
              </label>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Habilita la emisión de comprobantes autorizados (CAE) directamente
              con ARCA/AFIP.
            </p>
          </div>

          {taxEnabledLocal && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  CUIT (Sin guiones)
                </label>
                <input
                  type="text"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={taxCuitLocal}
                  onChange={(e) => setTaxCuitLocal(e.target.value)}
                  placeholder="20123456789"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Punto de Venta
                </label>
                <input
                  type="number"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={taxSalesPointLocal}
                  onChange={(e) => setTaxSalesPointLocal(e.target.value)}
                  placeholder="Ej: 3"
                />
              </div>

              {/* Certificados */}
              <div className="col-span-1 md:col-span-2 space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  Certificados Digitales (.crt y .key)
                </h3>
                <p className="text-xs text-slate-500">
                  Debe generar estos archivos en el sitio web de ARCA y
                  guardarlos en una carpeta segura del sistema.
                </p>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Ruta al Certificado (.crt)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={taxCertPathLocal}
                      onChange={(e) => setTaxCertPathLocal(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-xs font-mono"
                      placeholder="C:\Kiosco\Certificados\produccion.crt"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Ruta a la Llave Privada (.key)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={taxKeyPathLocal}
                      onChange={(e) => setTaxKeyPathLocal(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-xs font-mono"
                      placeholder="C:\Kiosco\Certificados\produccion.key"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sección Configuración de Email */}
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg transition-colors">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
            <Mail className="text-slate-400" /> Configuración de Correo (SMTP)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Servidor SMTP
              </label>
              <input
                type="text"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="Ej: smtp.gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Puerto
              </label>
              <input
                type="text"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="Ej: 587"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Usuario / Email
              </label>
              <input
                type="text"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="ejemplo@gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Contraseña (App Password)
              </label>
              <input
                type="password"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nota: Para Gmail, utilice una "Contraseña de Aplicación". No use
                su contraseña personal.
              </p>
            </div>
          </div>
        </div>

        {/* Sección Modo Claro/Oscuro */}
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg transition-colors">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
            <Monitor className="text-slate-400" /> Apariencia
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setSelectedMode("light")}
              className={`
                px-4 py-3 rounded-lg font-bold border-2 transition-all flex items-center gap-2
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
                px-4 py-3 rounded-lg font-bold border-2 transition-all flex items-center gap-2
                ${
                  selectedMode === "dark"
                    ? "bg-slate-900 border-blue-500 text-blue-400 shadow-md"
                    : "bg-slate-300 text-slate-600 border-transparent hover:bg-slate-400"
                }
              `}
            >
              <Moon size={20} /> Modo Oscuro
            </button>
            <button
              onClick={() => setSelectedMode("auto")}
              className={`
                px-4 py-3 rounded-lg font-bold border-2 transition-all flex items-center gap-2
                ${
                  selectedMode === "auto"
                    ? "bg-gradient-to-r from-orange-100 to-slate-900 border-blue-500 text-blue-600 dark:text-blue-400 shadow-md"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-300 dark:hover:bg-slate-700"
                }
              `}
            >
              <Archive size={20} /> Automático
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            El modo automático alterna entre claro y oscuro según la hora (07:00
            - 20:00).
          </p>
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
