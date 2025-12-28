import React, { useState, useEffect, useRef } from "react";
import {
  Trash2,
  ShoppingCart,
  Search,
  CreditCard,
  X,
  Menu,
  Smartphone,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import PaymentModal from "../components/PaymentModal";
import CustomerSearch from "../components/CustomerSearch";
import WeightModal from "../components/WeightModal";

/**
 * Pantalla Principal de Punto de Venta (POS)
 *
 * Funcionalidades:
 * - Escanear productos por código de barras
 * - Agregar/eliminar productos del carrito
 * - Calcular totales automáticamente
 * - Procesar pagos (efectivo, tarjeta, mixto)
 */
export default function PosScreen() {
  // ═══════════════════════════════════════════════════════════
  // ESTADO
  // ═══════════════════════════════════════════════════════════
  // Inicializar carrito desde localStorage si existe
  const [carrito, setCarrito] = useState(() => {
    const saved = localStorage.getItem("cart_backup");
    return saved ? JSON.parse(saved) : [];
  });
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [suggestions, setSuggestions] = useState([]); // Nuevo estado para sugerencias

  // Cliente State
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  // Modal Pesaje
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [pendingWeighableProduct, setPendingWeighableProduct] = useState(null);

  const inputRef = useRef(null);
  const navigate = useNavigate();

  // ═══════════════════════════════════════════════════════════
  // EFECTOS
  // ═══════════════════════════════════════════════════════════

  // Persistir carrito en cada cambio
  useEffect(() => {
    localStorage.setItem("cart_backup", JSON.stringify(carrito));
  }, [carrito]);

  // Verificar Sesión de Caja
  const [isSessionClosed, setIsSessionClosed] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();

    const checkSession = async () => {
      try {
        const session = await window.api.getCurrentSession();
        if (!session) {
          setIsSessionClosed(true);
          toast.error("⚠️ LA CAJA ESTÁ CERRADA. No puede realizar ventas.");
        }
      } catch (error) {
        console.error(error);
      }
    };
    checkSession();

    // Cargar clientes
    const loadCustomers = async () => {
      try {
        const data = await window.api.getCustomers();
        setClientes(data);
      } catch (error) {
        console.error("Error al cargar clientes:", error);
        toast.error("Error al cargar lista de clientes");
      }
    };
    loadCustomers();
  }, []);

  const [showScannerModal, setShowScannerModal] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);

  /* Cargar info del servidor al abrir modal */
  const handleOpenScanner = async () => {
    try {
      const info = await window.api.getServerInfo();
      console.log("Scanner Server Info:", info); // Debug log

      if (!info) {
        toast.error("Error: El servidor del escáner no se pudo iniciar.");
        return;
      }

      setServerInfo(info);
      setShowScannerModal(true);
    } catch (error) {
      console.error(error);
      toast.error("Error al comunicarse con el sistema.");
    }
  };

  // Ref para debounce (evitar múltiples scans)
  const lastScanTimeRef = useRef(0);

  // Escuchar scans desde el móvil
  useEffect(() => {
    const removeListener = window.api.onMobileScan((code) => {
      const now = Date.now();
      // Si pasaron menos de 2 segundos desde el último procesado, ignorar
      if (now - lastScanTimeRef.current < 2000) {
        console.log("Scan ignorado (Debounce Frontend):", code);
        return;
      }
      lastScanTimeRef.current = now;

      toast.success(`Producto escaneado`, {
        icon: <Smartphone size={18} className="text-blue-500" />,
        duration: 1000,
      });
      // Simular búsqueda
      setCodigo(code);
      window.api.getProductByBarcode(code).then((producto) => {
        if (producto) {
          agregarAlCarrito(producto);
          toast.success(producto.name);
          // Reproducir sonido DESKTOP también por si acaso
          // playLowStockSound(); // REMOVED: User prefers custom mobile sound only
        } else {
          toast.error("Producto no encontrado");
        }
      });
    });

    // Cleanup real
    return () => {
      if (removeListener) removeListener();
    };
  }, []);

  const playLowStockSound = () => {
    // Simple beep using AudioContext
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    oscillator.frequency.exponentialRampToValueAtTime(
      440,
      audioCtx.currentTime + 0.5
    );

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + 0.5
    );

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
  };

  // ═══════════════════════════════════════════════════════════
  // CÁLCULOS
  // ═══════════════════════════════════════════════════════════

  // Subtotal = suma de (precio × cantidad) de todos los items
  const subtotal = carrito.reduce(
    (acc, item) => acc + item.sale_price * item.cantidad,
    0
  );

  // Total = subtotal + impuestos (0% por ahora)
  const total = subtotal;

  // ═══════════════════════════════════════════════════════════
  // FUNCIONES DE PRODUCTO
  // ═══════════════════════════════════════════════════════════

  // Buscar producto por código de barras
  const buscarProducto = async (e) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    setLoading(true);

    try {
      // Llamar al backend para buscar el producto
      const producto = await window.api.getProductByBarcode(codigo);

      if (producto) {
        agregarAlCarrito(producto);
        toast.success(producto.name, {
          position: "bottom-left",
          duration: 1000,
        });
      } else {
        toast.error("Producto no encontrado");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al buscar producto");
    } finally {
      setLoading(false);
      setCodigo("");
    }
  };

  const [inputCantidad, setInputCantidad] = useState(1);

  // Agregar producto al carrito (o incrementar cantidad si ya existe)
  // quantityOverride: Opcional, forzar una cantidad específica (usado por el modal de peso)
  const agregarAlCarrito = (producto, quantityOverride = null) => {
    // 1. Detección de Producto Pesable (Intercepción)
    // Si NO se paso una cantidad forzada (quantityOverride) y el producto NO es unidad...
    if (
      quantityOverride === null &&
      producto.measurement_unit &&
      producto.measurement_unit !== "un"
    ) {
      // ... abrir modal de pesaje y detener flujo normal
      setPendingWeighableProduct(producto);
      setWeightModalOpen(true);
      return;
    }

    // 2. Determinar Cantidad a Agregar
    let cantidadToAdd;
    if (quantityOverride !== null) {
      cantidadToAdd = parseFloat(quantityOverride);
    } else {
      // Flujo normal (Unidad)
      cantidadToAdd = parseFloat(inputCantidad);
    }

    // Validar cantidad
    if (isNaN(cantidadToAdd) || cantidadToAdd <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    setCarrito((prev) => {
      const existe = prev.find((p) => p.id === producto.id);
      const cantidadActual = existe ? existe.cantidad : 0;
      const nuevaCantidad = parseFloat(
        (cantidadActual + cantidadToAdd).toFixed(3)
      );

      // Validación de Stock
      if (nuevaCantidad > producto.stock_quantity) {
        toast.error(`Stock insuficiente (Max: ${producto.stock_quantity})`);
        // Opcional: permitir agregar hasta el max? No, mejor abortar.
        return prev;
      }

      // Alerta de Stock Mínimo
      const stockRestante = producto.stock_quantity - nuevaCantidad;
      if (stockRestante <= producto.min_stock) {
        toast(
          (t) => (
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-yellow-600" size={20} />
              <span>
                Stock bajo: Quedan <b>{stockRestante}</b>
              </span>
            </div>
          ),
          {
            style: {
              border: "1px solid #EAB308",
              padding: "12px",
              color: "#713200",
            },
          }
        );
        playLowStockSound();
      }

      if (existe) {
        return prev.map((p) =>
          p.id === producto.id ? { ...p, cantidad: nuevaCantidad } : p
        );
      }
      return [...prev, { ...producto, cantidad: cantidadToAdd }];
    });

    // Resetear cantidad a 1 por defecto (Solo si no fue pesable, por UX)
    if (quantityOverride === null) {
      setInputCantidad(1);
    }
  };

  // Eliminar producto del carrito
  const eliminarDelCarrito = (id) => {
    setCarrito((prev) => prev.filter((p) => p.id !== id));
  };

  // Cancelar venta completa
  const cancelarVenta = () => {
    if (carrito.length === 0) return;
    if (window.confirm("¿Seguro que deseas cancelar la venta actual?")) {
      setCarrito([]);
      localStorage.removeItem("cart_backup");
    }
  };

  // Manejar el cambio en el input de búsqueda
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setCodigo(val);

    if (val.length > 2) {
      try {
        const results = await window.api.searchProducts(val);
        setSuggestions(results);
      } catch (error) {
        console.error(error);
      }
    } else {
      setSuggestions([]);
    }
  };

  // Actualizar cantidad de producto en carrito
  const updateQuantity = (id, delta) => {
    setCarrito((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nuevaCantidad = item.cantidad + delta;

          // Si intenta bajar de 1, no hacer nada (o eliminar)
          if (nuevaCantidad < 1) return item;

          // Validación de Stock al incrementar
          if (delta > 0 && nuevaCantidad > item.stock_quantity) {
            toast.error(`Stock insuficiente (Max: ${item.stock_quantity})`);
            return item;
          }

          return { ...item, cantidad: nuevaCantidad };
        }
        return item;
      })
    );
  };

  // ═══════════════════════════════════════════════════════════
  // FUNCIONES DE PAGO
  // ═══════════════════════════════════════════════════════════

  // Abrir modal de pago
  const abrirModalPago = () => {
    if (carrito.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }
    setModalPagoAbierto(true);
  };

  // Procesar el pago confirmado
  const procesarPago = async (pagoData) => {
    try {
      // Preparar datos para el backend
      const saleData = {
        items: carrito,
        total: total,
        paymentMethod: pagoData.metodo,
        userId: JSON.parse(localStorage.getItem("user") || "{}").id || 1, // Fallback a 1 si falla
        clientId: clienteSeleccionado ? clienteSeleccionado.id : null,
      };

      // Enviar al backend
      const resultado = await window.api.createSale(saleData);

      if (resultado.success) {
        toast.success(`Venta #${resultado.saleId} completada`);
        setCarrito([]); // Limpiar carrito
        localStorage.removeItem("cart_backup");
        setClienteSeleccionado(null); // Resetear cliente
        return { success: true };
      } else {
        return { success: false, message: resultado.message };
      }
    } catch (error) {
      console.error("Error al procesar pago:", error);
      return { success: false, message: "Error inesperado" };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="flex h-full gap-4 text-slate-900 dark:text-white">
      <Toaster
        position="bottom-left"
        toastOptions={{
          style: { background: "#334155", color: "#fff" },
        }}
      />
      {/* Modal de Pago */}
      <PaymentModal
        isOpen={modalPagoAbierto}
        onClose={() => setModalPagoAbierto(false)}
        total={total}
        onConfirm={procesarPago}
        clientName={clienteSeleccionado ? clienteSeleccionado.name : null}
      />
      <WeightModal
        isOpen={weightModalOpen}
        onClose={() => {
          setWeightModalOpen(false);
          setPendingWeighableProduct(null);
          // Devolver foto al input principal
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        product={pendingWeighableProduct}
        onConfirm={(qty) => {
          if (pendingWeighableProduct) {
            agregarAlCarrito(pendingWeighableProduct, qty);
          }
        }}
      />
      {/* ════════════════════════════════════════════════════════ */}
      {/* SECCIÓN IZQUIERDA: LISTA DE PRODUCTOS */}
      {/* ════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors duration-300">
        {/* Header de la Tabla */}
        <div className="bg-slate-100 dark:bg-slate-900 p-4 grid grid-cols-12 gap-4 font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
          <div className="col-span-1">Cant.</div>
          <div className="col-span-6">Producto</div>
          <div className="col-span-2 text-right">Precio</div>
          <div className="col-span-2 text-right">Total</div>
          <div className="col-span-1 text-center"></div>
        </div>

        {/* Cuerpo de la Tabla (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {carrito.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 opacity-50">
              <ShoppingCart size={64} className="mb-4" />
              <p className="text-xl">Escanea o busca un producto</p>
            </div>
          ) : (
            carrito.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg grid grid-cols-12 gap-4 items-center animate-in fade-in slide-in-from-bottom-2 border border-slate-100 dark:border-transparent"
              >
                {/* Control de Cantidad */}
                <div className="col-span-2 flex items-center justify-center gap-1 bg-white dark:bg-slate-800 rounded px-1 py-1 shadow-sm border border-slate-200 dark:border-slate-600">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300 font-bold"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-slate-800 dark:text-white w-6 text-center text-sm">
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-6 h-6 flex items-center justify-center bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/80 rounded text-blue-600 dark:text-blue-300 font-bold"
                  >
                    +
                  </button>
                </div>
                <div className="col-span-5 truncate">
                  <div className="font-medium text-slate-800 dark:text-white text-lg flex items-center gap-2">
                    {item.name}
                    {item.measurement_unit &&
                      item.measurement_unit !== "un" && (
                        <span className="text-xs font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 px-1.5 py-0.5 rounded">
                          {item.measurement_unit}
                        </span>
                      )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {item.barcode}
                  </div>
                </div>
                <div className="col-span-2 text-right font-mono text-slate-600 dark:text-slate-300">
                  ${item.sale_price.toFixed(2)}
                </div>
                <div className="col-span-2 text-right font-mono font-bold text-green-600 dark:text-green-400 text-lg">
                  ${(item.sale_price * item.cantidad).toFixed(2)}
                </div>
                <div className="col-span-1 text-center">
                  <button
                    onClick={() => eliminarDelCarrito(item.id)}
                    className="p-2 text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded-full transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal de Escáner Móvil */}
        {showScannerModal && serverInfo && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl max-w-md w-full text-center relative">
              <button
                onClick={() => setShowScannerModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
                Escáner Móvil
              </h2>
              <p className="mb-6 text-slate-600 dark:text-slate-400">
                Escanea este código QR con tu celular para usarlo como lector de
                barras.
                <br />
                <span className="text-xs text-yellow-600 dark:text-yellow-400">
                  (Asegúrate de estar en la misma red Wi-Fi: {serverInfo.ip})
                </span>
              </p>

              <div className="bg-white p-4 rounded-xl inline-block shadow-inner border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                    serverInfo.url
                  )}`}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>

              <p className="mt-6 text-sm text-slate-500">
                Recuerda dar permisos de cámara en tu navegador móvil.
              </p>
            </div>
          </div>
        )}

        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex gap-2 relative z-20">
          {/* Input de Cantidad Manual */}
          <div className="relative w-28">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none select-none">
              Cant.
            </div>
            <input
              type="number"
              min="0.001"
              step="0.001"
              value={inputCantidad}
              onClick={(e) => e.target.select()}
              onChange={(e) => setInputCantidad(e.target.value)}
              className="w-full pl-10 pr-2 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-xl font-mono font-bold text-blue-600 dark:text-blue-400 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm text-center"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  inputRef.current?.focus(); // Salta al buscador al dar enter
                }
              }}
            />
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              value={codigo}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (suggestions.length > 0) {
                    agregarAlCarrito(suggestions[0]);
                    setCodigo("");
                    setSuggestions([]);
                  } else {
                    buscarProducto(e);
                  }
                }
              }}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono shadow-sm"
              placeholder="Escanear o buscar producto..."
              autoComplete="off"
            />

            {/* Sugerencias Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto">
                {suggestions.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      agregarAlCarrito(prod);
                      setCodigo("");
                      setSuggestions([]);
                      inputRef.current?.focus();
                    }}
                    className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center border-b border-slate-100 dark:border-slate-700 last:border-0"
                  >
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">
                        {prod.name}
                        {prod.measurement_unit &&
                          prod.measurement_unit !== "un" && (
                            <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-700 px-1 rounded">
                              {prod.measurement_unit}
                            </span>
                          )}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Cod: {prod.barcode}
                      </p>
                    </div>
                    <div className="font-bold text-green-600 dark:text-green-400">
                      ${prod.sale_price.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleOpenScanner}
            className="px-6 py-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition flex items-center gap-2 font-bold shrink-0"
            title="Usar Celular como Escáner"
          >
            <Smartphone size={20} />{" "}
            <span className="hidden xl:inline">Celular</span>
          </button>
        </div>
      </div>
      {/* ════════════════════════════════════════════════════════ */}
      {/* SECCIÓN DERECHA: TOTALES Y ACCIONES */}
      {/* ════════════════════════════════════════════════════════ */}
      <div className="w-96 flex flex-col gap-4">
        {/* Tarjeta de Usuario / Info */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg space-y-3 transition-colors duration-300">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-sm">
            <span>Cajero</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="font-bold text-lg text-slate-800 dark:text-white">
              {JSON.parse(localStorage.getItem("user") || "{}").name ||
                "Administrador"}
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition"
              title="Ir al Menú Principal"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Selector de Cliente */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
            <CustomerSearch
              customers={clientes}
              selectedCustomer={clienteSeleccionado}
              onSelect={setClienteSeleccionado}
            />
          </div>
        </div>

        {/* Tarjeta de Totales */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl flex-1 flex flex-col justify-between transition-colors duration-300">
          <div className="space-y-4">
            <div className="flex justify-between text-slate-500 dark:text-slate-400 text-lg">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400 text-lg">
              <span>Impuestos (0%)</span>
              <span>$0.00</span>
            </div>
            <div className="h-px bg-slate-200 dark:bg-slate-600 my-4"></div>
            <div className="flex justify-between items-end">
              <span className="text-xl font-bold text-slate-700 dark:text-slate-300">
                Total a Pagar
              </span>
            </div>
          </div>
          <div className="text-right text-5xl font-black text-slate-900 dark:text-green-400 tracking-tighter drop-shadow-sm">
            <span className="text-green-600 dark:text-green-400">
              ${total.toFixed(2)}
            </span>
          </div>

          {/* Botones de Acción */}
          <div className="grid gap-3 mt-8">
            <button
              onClick={abrirModalPago}
              className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-xl shadow-lg shadow-green-900/30 flex items-center justify-center gap-3 transition transform active:scale-95"
            >
              <CreditCard size={28} /> COBRAR
            </button>

            <button
              onClick={cancelarVenta}
              className="w-full py-3 bg-slate-100 hover:bg-red-50 dark:bg-slate-700 dark:hover:bg-red-900/50 text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-200 rounded-xl font-semibold flex items-center justify-center gap-2 transition"
            >
              <X size={20} /> Cancelar Venta
            </button>
          </div>
        </div>
      </div>

      {/* BLOQUEO POR CAJA CERRADA */}
      {isSessionClosed && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl max-w-md text-center shadow-2xl border-4 border-red-500">
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={48} className="text-red-500" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4">
              ¡CAJA CERRADA!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg mb-8">
              No es posible realizar ventas sin abrir la caja primero.
            </p>
            <button
              onClick={() => navigate("/caja")}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xl shadow-xl hover:scale-105 transition-all"
            >
              IR A ABRIR CAJA
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
