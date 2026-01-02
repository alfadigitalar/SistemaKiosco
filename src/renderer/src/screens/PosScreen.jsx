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
  Printer,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PaymentModal from "../components/PaymentModal";
import CustomerSearch from "../components/CustomerSearch";
import WeightModal from "../components/WeightModal";
import jsPDF from "jspdf";

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

  // Modal Email
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [emailToSend, setEmailToSend] = useState("");

  // Ticket config
  const [shouldPrintTicket, setShouldPrintTicket] = useState(true);

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
          // toast.error("LA CAJA ESTÁ CERRADA. No puede realizar ventas."); // Removed to avoid double alert (Modal + Toast)
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
        setCodigo(""); // Limpiar campo siempre
      });
    });

    return () => {
      if (removeListener) removeListener();
    };
  }, []);
  // ═══════════════════════════════════════════════════════════
  // DETECCIÓN AUTOMÁTICA DE PROMOS
  // ═══════════════════════════════════════════════════════════
  const [activePromos, setActivePromos] = useState([]);

  // Cargar promos al inicio
  useEffect(() => {
    window.api.getAllActivePromos().then((promos) => {
      setActivePromos(promos);
    });
  }, []);

  // Verificar si el carrito califica para una promo
  useEffect(() => {
    if (carrito.length === 0 || activePromos.length === 0) return;

    // Algoritmo:
    // 1. Recorrer promos activas
    // 2. Para cada promo, verificar si tenemos los ingredientes en el carrito
    // 3. Importante: Chequear que la promo NO esté ya en el carrito (para no sugerir lo que ya agregaron)

    activePromos.forEach((promo) => {
      // Si la promo ya está en el carrito, ignorar (asumimos que ya la están comprando)
      // Opcional: Podríamos ser más listos y ver si compraron "otra" promo igual,
      // pero por simplicidad, si el producto PROMO ID X está en carrito, no avisamos X.
      const isPromoInCart = carrito.some((item) => item.id === promo.id);
      if (isPromoInCart) return;

      // Verificar ingredientes
      // promo.items = [{ product_id, quantity }, ...]
      let hasAllIngredients = true;
      let multiplier = Infinity; // Cuantas veces podemos aplicar la promo

      promo.items.forEach((promoItem) => {
        const cartItem = carrito.find((p) => p.id === promoItem.product_id);
        if (!cartItem) {
          hasAllIngredients = false;
          return;
        }

        const possibleTimes = Math.floor(
          cartItem.cantidad / promoItem.quantity
        );
        if (possibleTimes < 1) {
          hasAllIngredients = false;
        } else {
          multiplier = Math.min(multiplier, possibleTimes);
        }
      });

      if (hasAllIngredients && multiplier > 0) {
        // Encontramos una oportunidad de Promo!
        // Verificar si ya avisamos recientemente de esta promo para evitar spam?
        // Usaremos Toast con ID único para que no se apilen
        toast(
          (t) => (
            <div className="flex flex-col gap-2">
              <span className="font-bold flex items-center gap-2">
                ¡Oferta Disponible!
              </span>
              <span className="text-sm">
                Tienes productos para armar:
                <br />
                <span className="font-bold text-yellow-300">
                  {multiplier}x {promo.name}
                </span>
              </span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  applyPromoToCart(promo, multiplier);
                }}
                className="mt-1 bg-white text-purple-600 px-3 py-1 rounded font-bold text-sm hover:bg-gray-100"
              >
                Aplicar Promo
              </button>
            </div>
          ),
          {
            id: `promo-alert-${promo.id}`, // ID único por promo
            duration: 8000,
            // icon: "✨", // Removed emoji
            style: {
              background: "#7E22CE", // purple-700
              color: "#fff",
            },
          }
        );
      }
    });
  }, [carrito, activePromos]);

  // Aplicar la promo (Reemplazar ingredientes por el producto Promo)
  const applyPromoToCart = (promo, count) => {
    setCarrito((prev) => {
      let newCart = [...prev];

      // 1. Reducir/Eliminar ingredientes
      promo.items.forEach((pItem) => {
        const totalToRemove = pItem.quantity * count;

        // Encontramos el item en el carrito (debería existir por la validación anterior)
        const cartItemIndex = newCart.findIndex(
          (c) => c.id === pItem.product_id
        );

        if (cartItemIndex !== -1) {
          const currentQty = newCart[cartItemIndex].cantidad;
          const remaining = parseFloat((currentQty - totalToRemove).toFixed(3));

          if (remaining <= 0.001) {
            // Eliminar
            newCart.splice(cartItemIndex, 1);
          } else {
            // Reducir
            newCart[cartItemIndex] = {
              ...newCart[cartItemIndex],
              cantidad: remaining,
            };
          }
        }
      });

      // 2. Agregar Promo
      // Usamos la misma lógica de agregar para no duplicar si ya existía
      const promoInCart = newCart.find((p) => p.id === promo.id);
      if (promoInCart) {
        newCart = newCart.map((p) =>
          p.id === promo.id
            ? { ...p, cantidad: parseFloat((p.cantidad + count).toFixed(3)) }
            : p
        );
      } else {
        newCart.push({ ...promo, cantidad: count });
      }

      toast.success(`Se aplicó: ${promo.name}`);
      // Sonido de éxito diferente (?)
      playLowStockSound(); // Reutilizamos por ahora
      return newCart;
    });
  };

  // ═══════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════
  // ESCÁNER FÍSICO (USB) Y ATAJOS DE TECLADO
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();
    let timeoutId = null;

    const handleGlobalKeyDown = (e) => {
      const now = Date.now();
      const isInputFocused = document.activeElement === inputRef.current;

      // -- ATAJOS DE TECLADO --

      // F9 o Insert: COBRAR
      if (e.key === "F9" || e.key === "Insert") {
        e.preventDefault();
        abrirModalPago();
        return;
      }

      // Escape: CANCELAR VENTA (Solo si no hay modales abiertos, para evitar cierre accidental)
      if (e.key === "Escape" && !modalPagoAbierto && !weightModalOpen) {
        // Si tiene texto, limpiar input primero
        if (codigo) {
          setCodigo("");
          return;
        }
        // Si no, preguntar cancelar
        cancelarVenta();
        return;
      }

      // F2 o F4: FOCALIZAR BUSCADOR
      if (e.key === "F2" || e.key === "F4") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }

      // -- LÓGICA DE ESCÁNER USB (Scanner Mode) --
      // Los escáneres envían teclas muy rápido (ej: < 20-50ms entre caracteres).
      // Si detectamos esto, capturamos el buffer aunque el foco no esté en el input.

      const char = e.key;

      // Ignorar teclas de control especiales excepto Enter
      if (char.length > 1 && char !== "Enter") return;

      const timeDiff = now - lastKeyTime;
      lastKeyTime = now;

      // Si el usuario está escribiendo manual lento (>50ms), reseteamos buffer (salvo que sea el input dedicado)
      if (timeDiff > 70 && !isInputFocused) {
        buffer = "";
      }

      if (char === "Enter") {
        // Al dar Enter, si hay buffer válido (ej: código barras), lo procesamos
        if (buffer.length > 2 && !isInputFocused) {
          e.preventDefault();
          toast.success("Escáner USB detectado ⚡");
          setCodigo(buffer);

          window.api.getProductByBarcode(buffer).then((producto) => {
            if (producto) {
              agregarAlCarrito(producto);
              toast.success(producto.name);
            } else {
              toast.error("Producto no encontrado");
            }
            setCodigo(""); // Limpiar
          });

          buffer = "";
        }
      } else {
        // Agregar al buffer (si no estamos en un input de texto escribiendo manualmente)
        // Nota: Si el foco ESTA en el input, dejamos que el evento onChange original maneje todo para no duplicar.
        if (!isInputFocused) {
          buffer += char;
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [carrito, modalPagoAbierto, weightModalOpen, codigo]); // Dependencias para funciones dentro del listener

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

    // 3. Calcular nueva cantidad proyectada para validar stock antes de actualizar estado
    const existe = carrito.find((p) => p.id === producto.id);
    const cantidadActual = existe ? existe.cantidad : 0;
    const nuevaCantidad = parseFloat(
      (cantidadActual + cantidadToAdd).toFixed(3)
    );

    // Validación de Stock (Solo si NO es promo)
    if (!producto.is_promo && nuevaCantidad > producto.stock_quantity) {
      toast.error(`Stock insuficiente (Max: ${producto.stock_quantity})`);
      return;
    }

    // Alerta de Stock Mínimo
    const stockRestante = producto.stock_quantity - nuevaCantidad;
    // Solo mostrar alerta si cruzamos el umbral o si ya estabamos abajo pero agregamos mas?
    // Mejor solo mostrar si queda poco stock, independientemente de si ya mostramos antes,
    // pero idealmente una vez por accion.
    if (stockRestante <= producto.min_stock) {
      toast(
        (t) => (
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-white" size={20} />
            <span className="font-bold">
              Stock bajo: Quedan {stockRestante}
            </span>
          </div>
        ),
        {
          id: `low-stock-${producto.id}`, // ID único para prevenir duplicados por hot-toast si se llamara rapido
          style: {
            background: "#EF4444",
            color: "#FFFFFF",
            padding: "12px",
            borderRadius: "12px",
            fontWeight: "600",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
            border: "1px solid #B91C1C",
          },
          duration: 4000,
        }
      );
      playLowStockSound();
    }

    setCarrito((prev) => {
      // Re-buscar en prev para seguridad (aunque 'existe' calculado afuera deberia coincidir en este ciclo)
      const currentExiste = prev.find((p) => p.id === producto.id);

      if (currentExiste) {
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

    if (val.length > 0) {
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
    // Calcular validaciones FUERA del setCarrito
    // Necesitamos el item actual del carrito (estado 'carrito')
    const item = carrito.find((p) => p.id === id);
    if (!item) return;

    const nuevaCantidad = item.cantidad + delta;

    // Si intenta bajar de 1, no hacer nada (o dejar que la UI lo maneje, aqui retornamos)
    if (nuevaCantidad < 1) return;

    // Validación de Stock al incrementar (Solo si NO es promo)
    if (!item.is_promo && delta > 0 && nuevaCantidad > item.stock_quantity) {
      toast.error(`Stock insuficiente (Max: ${item.stock_quantity})`);
      return;
    }

    setCarrito((prev) =>
      prev.map((prod) => {
        if (prod.id === id) {
          return { ...prod, cantidad: nuevaCantidad };
        }
        return prod;
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

        // IMPRIMIR TICKET SI ESTÁ HABILITADO
        if (shouldPrintTicket) {
          await window.api.printTicket({
            ticketId: resultado.saleId,
            date: new Date().toLocaleString(),
            items: carrito,
            total: total,
          });
        }

        // --- INTEGRACIÓN ARCA (FACTURA ELECTRÓNICA) ---
        // Verificar configuración (cargamos config en useEffect o usamos window.api ?)
        // Lo mejor es hacer una llamada rápida o usar el ConfigContext si lo tuvieramos envuelto.
        // Como PosScreen no está bajo ConfigProvider en App.jsx (Route path="/pos" está FUERA de MainLayout que tiene ConfigProvider?)
        // Ah, App.jsx: ConfigProvider envuelve TODO. OK.
        // Pero PosScreen es una ruta hermana de MainLayout routes.
        // Sí, ConfigProvider envuelve Routes. Así que PODEMOS usar useConfig().

        // Sin embargo, para no refactorizar imports ahora mismo, haremos la llamada Directa al backend
        // que ya verifica si está enabled. El handler 'create-electronic-invoice' verifica 'tax_enabled'.
        // Solo llamamos y si retorna "disabled", ignoramos silenciosamente.

        // Hacemos esto async (sin await) para no bloquear la UI? O mostramos "Emitiendo Factura"?
        // Mejor mostrar un Toast de proceso.

        window.api
          .createElectronicInvoice({
            saleId: resultado.saleId,
            total: total,
            items: carrito.map((i) => ({
              title: i.name,
              quantity: i.cantidad,
              unit_price: i.sale_price,
            })),
            clientDoc: clienteSeleccionado ? clienteSeleccionado.dni : null, // Asumiendo DNI = CUIT para consumidor final identificado
          })
          .then((res) => {
            if (res.success) {
              toast.success(`CAE Autorizado: ${res.cae}`, { duration: 6000 });
            } else if (
              res.message !== "Facturación electrónica deshabilitada"
            ) {
              toast.error(`Error AFIP: ${res.message}`, { duration: 6000 });
            }
          });

        // PREPARAR PARA EMAIL
        setLastSale({
          id: resultado.saleId,
          items: [...carrito], // Copia
          total: total,
          date: new Date().toLocaleString(),
          clientEmail: clienteSeleccionado?.email || "",
          clientName: clienteSeleccionado?.name || "Consumidor Final",
          clientDni: clienteSeleccionado?.dni || "",
          clientAddress: clienteSeleccionado?.address || "",
        });
        setEmailToSend(clienteSeleccionado?.email || "");

        // CERRAR MODAL PAGO Y ABRIR MODAL EMAIL
        setModalPagoAbierto(false); // Forzar cierre payment
        setTimeout(() => setEmailModalOpen(true), 500); // Pequeño delay

        setCarrito([]); // Limpiar carrito
        localStorage.removeItem("cart_backup");
        setClienteSeleccionado(null); // Resetear cliente
        return { success: true };
      } else {
        return { success: false, message: resultado.message };
      }
    } catch (error) {
      console.error("Error al procesar pago:", error);
      return {
        success: false,
        message: error.message || "Error desconocido en createSale",
      };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 text-slate-900 dark:text-white overflow-hidden">
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
      {/* Modal Email */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Mail className="text-blue-500" /> Enviar Ticket por Email
              </h2>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 p-1 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
              La venta fue exitosa. ¿Desea enviar el comprobante por correo?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                autoFocus
                className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="facucasla2015@gmail.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (emailToSend) {
                      document.getElementById("btn-send-email")?.click();
                    }
                  }
                }}
                value={emailToSend}
                onChange={(e) => setEmailToSend(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEmailModalOpen(false)}
                className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              >
                No enviar
              </button>
              <button
                id="btn-send-email"
                onClick={async () => {
                  // Generar PDF y Enviar
                  if (!emailToSend.includes("@")) {
                    toast.error("Email inválido");
                    return;
                  }
                  const toastId = toast.loading("Enviando correo...");
                  // Enviar
                  // Nota: generamos el PDF en Main dentro del handler, no aquí.
                  // Pero send-email-ticket espera pdfBuffer?
                  // PLAN UPDATE: send-email-ticket should generate PDF or receive it.
                  // The handler I wrote in Step 3551 expects `pdfBuffer`.
                  // SO I NEED TO GENERATE PDF HERE.
                  // I need to import logic from 'ReportesScreen' or similar?
                  // Actually, `window.api.printTicket` generates PDF/Print logic in MAIN?
                  // No, `print-ticket` handles printing.
                  // I should reuse the logic to generate PDF buffer.
                  // BUT `jspdf` is in renderer.
                  // So I can use `jspdf` here.

                  try {
                    // Generar PDF "Factura B" Style
                    const doc = new jsPDF();
                    const pageWidth = doc.internal.pageSize.width; // ~210mm
                    const pageHeight = doc.internal.pageSize.height;

                    // --- DATOS DEL COMERCIO (Mockup / LocalStorage) ---
                    const storeName =
                      localStorage.getItem("kioskName") || "MI KIOSCO";
                    const storeAddress = "Dirección del Comercio 123"; // Podríamos agregar esto a Config
                    const storeCuit = "30-12345678-9";
                    const isDev = false;

                    // --- ESTRUCTURA ---

                    // 1. RECTÁNGULO GRANDE PRINCIPAL (Encabezado)
                    // (x, y, w, h)
                    doc.setLineWidth(0.5);
                    doc.rect(10, 10, 190, 50);

                    // Línea vertical divisoria
                    doc.line(105, 10, 105, 60);

                    // 2. CAJA "B"
                    doc.rect(98, 5, 14, 14); // Caja flotante central
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(20);
                    doc.text("B", 105, 14, { align: "center" });
                    doc.setFontSize(8);
                    doc.text("COD. 06", 105, 18, { align: "center" });

                    // Linea que conecta la caja B con el borde
                    doc.setLineWidth(0.5);
                    doc.line(105, 19, 105, 60); // Continua la vertical

                    // 3. LADO IZQUIERDO (Comercio)
                    doc.setFontSize(24);
                    doc.setFont("helvetica", "bold");
                    doc.text(storeName.toUpperCase(), 55, 30, {
                      align: "center",
                    });

                    doc.setFontSize(9);
                    doc.setFont("helvetica", "normal");
                    doc.text(`Domicilio: ${storeAddress}`, 55, 45, {
                      align: "center",
                    });
                    doc.text("IVA Responsable Inscripto", 55, 50, {
                      align: "center",
                    });

                    // 4. LADO DERECHO (Datos Factura)
                    doc.setFontSize(18);
                    doc.setFont("helvetica", "bold");
                    doc.text("FACTURA", 150, 20, { align: "center" });

                    doc.setFontSize(10);
                    doc.setFont("helvetica", "bold");
                    doc.text(
                      `Nro. Comprobante: 0001-${lastSale?.id
                        .toString()
                        .padStart(8, "0")}`,
                      120,
                      30
                    );
                    doc.text(`Fecha de Emisión: ${lastSale?.date}`, 120, 35);

                    doc.setFontSize(9);
                    doc.setFont("helvetica", "normal");
                    doc.text(`C.U.I.T: ${storeCuit}`, 120, 42);
                    doc.text(`Ing. Brutos: ${storeCuit}`, 120, 47);
                    doc.text(`Inicio de Actividades: 01/01/2024`, 120, 52);

                    // 5. DATOS DEL CLIENTE (Tira Horizontal)
                    doc.rect(10, 62, 190, 12); // Caja
                    doc.setFontSize(9);
                    doc.setFont("helvetica", "bold");
                    doc.text("Apellido y Nombre / Razón Social:", 12, 68);
                    doc.setFont("helvetica", "normal");
                    doc.text(
                      lastSale?.clientName || "Consumidor Final",
                      70,
                      68
                    );

                    doc.setFont("helvetica", "bold");
                    doc.text("DNI / CUIT:", 130, 68);
                    doc.setFont("helvetica", "normal");
                    doc.text(lastSale?.clientDni || "-", 150, 68);

                    doc.setFont("helvetica", "bold");
                    doc.text("Condición IVA:", 12, 72); // Segunda linea dentro de la caja? No, ajustamos
                    doc.setFont("helvetica", "normal");
                    doc.text("Consumidor Final", 40, 72);

                    // 6. TABLA DE PRODUCTOS
                    let y = 78;
                    // Encabezados (Fondo gris si quisieramos `doc.setFillColor(200, 200, 200); doc.rect(...)`)
                    doc.setFillColor(230, 230, 230);
                    doc.rect(10, y, 190, 8, "F"); // Relleno
                    doc.rect(10, y, 190, 8, "S"); // Borde

                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(0, 0, 0);
                    doc.text("Producto", 15, y + 5);
                    doc.text("Cant.", 130, y + 5, { align: "center" });
                    doc.text("P. Unitario", 160, y + 5, { align: "right" });
                    doc.text("Subtotal", 195, y + 5, { align: "right" });

                    y += 8;
                    doc.setFont("helvetica", "normal");

                    lastSale?.items.forEach((item) => {
                      const subtotal = item.sale_price * item.cantidad;
                      const itemName =
                        item.name.length > 45
                          ? item.name.substring(0, 45) + "..."
                          : item.name;

                      doc.text(itemName, 12, y + 5);
                      doc.text(item.cantidad.toString(), 130, y + 5, {
                        align: "center",
                      });
                      doc.text(item.sale_price.toFixed(2), 160, y + 5, {
                        align: "right",
                      });
                      doc.text(subtotal.toFixed(2), 195, y + 5, {
                        align: "right",
                      });

                      y += 8;
                    });

                    // Línea final de items
                    doc.line(10, y, 200, y);
                    y += 5;

                    // 7. TOTALES (Pie Derecho)
                    // Subtotal
                    doc.setFont("helvetica", "bold");
                    doc.text("Subtotal:", 160, y + 5, { align: "right" });
                    doc.text(`$${lastSale?.total.toFixed(2)}`, 195, y + 5, {
                      align: "right",
                    });
                    y += 6;

                    // Total
                    doc.setFillColor(230, 230, 230); // Fondo gris para total
                    doc.rect(140, y, 60, 8, "F");
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(11);
                    doc.text("Total:", 160, y + 5, { align: "right" });
                    doc.text(`$${lastSale?.total.toFixed(2)}`, 195, y + 5, {
                      align: "right",
                    });

                    y += 15;

                    // 8. LEGALES / QR (Simulado)
                    doc.setFontSize(8);
                    doc.setFont("helvetica", "bold");
                    doc.text("CAE N°: 7341823741283", 150, y);
                    doc.text("Fecha Vto. CAE: 01/01/2026", 150, y + 4);

                    doc.setFont("helvetica", "italic");
                    doc.text("Comprobante Autorizado", 12, y);
                    doc.text(
                      "Esta factura es un documento no válido como factura fiscal real (Demo Kubo POS)",
                      12,
                      y + 4
                    );

                    const pdfArrayBuffer = doc.output("arraybuffer");

                    const res = await window.api.sendEmailTicket({
                      email: emailToSend,
                      subject: `Factura #${lastSale?.id} - ${storeName}`,
                      pdfBuffer: pdfArrayBuffer,
                    });

                    if (res.success) {
                      toast.success("Email enviado!", { id: toastId });
                      setEmailModalOpen(false);
                    } else {
                      toast.error("Error: " + res.message, { id: toastId });
                    }
                  } catch (e) {
                    console.error("Error generando PDF/Email:", e);
                    toast.error("Error: " + (e.message || "Desconocido"), {
                      id: toastId,
                    });
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-2"
              >
                <Mail size={18} /> Enviar Ticket
              </button>
            </div>
          </div>
        </div>
      )}
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
      <div className="w-full lg:w-96 flex flex-col gap-4 shrink-0 h-auto lg:h-full overflow-y-auto lg:overflow-visible">
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
            {/* Toggle Impresión */}
            <div
              onClick={() => setShouldPrintTicket(!shouldPrintTicket)}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                shouldPrintTicket
                  ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                  : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Printer
                  size={20}
                  className={
                    shouldPrintTicket
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-400"
                  }
                />
                <span
                  className={`font-bold text-sm ${
                    shouldPrintTicket
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-slate-500"
                  }`}
                >
                  Imprimir Ticket
                </span>
              </div>
              <div
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  shouldPrintTicket
                    ? "bg-blue-600"
                    : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${
                    shouldPrintTicket ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </div>
            </div>

            <button
              onClick={abrirModalPago}
              className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-xl shadow-lg shadow-green-900/30 flex items-center justify-center gap-3 transition transform active:scale-95"
              title="Presiona F9 para cobrar rápido"
            >
              <CreditCard size={28} /> COBRAR{" "}
              <span className="text-sm opacity-60 font-mono ml-1">[F9]</span>
            </button>

            <button
              onClick={cancelarVenta}
              className="w-full py-3 bg-slate-100 hover:bg-red-50 dark:bg-slate-700 dark:hover:bg-red-900/50 text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-200 rounded-xl font-semibold flex items-center justify-center gap-2 transition"
              title="Presiona ESC para cancelar"
            >
              <X size={20} /> Cancelar Venta{" "}
              <span className="text-sm opacity-60 font-mono ml-1">[ESC]</span>
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
