import React, { useState, useEffect, useRef } from "react";
import { Trash2, ShoppingCart, Search, CreditCard, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import PaymentModal from "../components/PaymentModal";

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
  const [carrito, setCarrito] = useState([]);
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const inputRef = useRef(null);

  // ═══════════════════════════════════════════════════════════
  // EFECTOS
  // ═══════════════════════════════════════════════════════════

  // Mantener el foco en el input siempre (para el lector de código de barras)
  useEffect(() => {
    const focusInput = () => inputRef.current?.focus();
    focusInput();
    window.addEventListener("click", focusInput);
    return () => window.removeEventListener("click", focusInput);
  }, []);

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

  // Agregar producto al carrito (o incrementar cantidad si ya existe)
  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find((p) => p.id === producto.id);
      if (existe) {
        return prev.map((p) =>
          p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
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
    }
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
        userId: 1, // TODO: Obtener del usuario logueado
        clientId: null, // TODO: Implementar selección de cliente
      };

      // Enviar al backend
      const resultado = await window.api.createSale(saleData);

      if (resultado.success) {
        toast.success(`Venta #${resultado.saleId} completada`);
        setCarrito([]); // Limpiar carrito
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
    <div className="flex h-full gap-4 text-white">
      <Toaster position="bottom-left" />

      {/* Modal de Pago */}
      <PaymentModal
        isOpen={modalPagoAbierto}
        onClose={() => setModalPagoAbierto(false)}
        total={total}
        onConfirm={procesarPago}
      />

      {/* ════════════════════════════════════════════════════════ */}
      {/* SECCIÓN IZQUIERDA: LISTA DE PRODUCTOS */}
      {/* ════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-700">
        {/* Header de la Tabla */}
        <div className="bg-slate-900 p-4 grid grid-cols-12 gap-4 font-bold text-slate-300 border-b border-slate-700">
          <div className="col-span-1">Cant.</div>
          <div className="col-span-6">Producto</div>
          <div className="col-span-2 text-right">Precio</div>
          <div className="col-span-2 text-right">Total</div>
          <div className="col-span-1 text-center"></div>
        </div>

        {/* Cuerpo de la Tabla (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {carrito.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
              <ShoppingCart size={64} className="mb-4" />
              <p className="text-xl">Escanea un producto para comenzar</p>
            </div>
          ) : (
            carrito.map((item) => (
              <div
                key={item.id}
                className="bg-slate-700/50 p-3 rounded-lg grid grid-cols-12 gap-4 items-center animate-in fade-in slide-in-from-bottom-2"
              >
                <div className="col-span-1 font-mono text-lg font-bold text-blue-400 bg-slate-800 rounded px-2 text-center">
                  {item.cantidad}
                </div>
                <div className="col-span-6 truncate">
                  <div className="font-medium text-white text-lg">
                    {item.name}
                  </div>
                  <div className="text-xs text-slate-400">{item.barcode}</div>
                </div>
                <div className="col-span-2 text-right font-mono text-slate-300">
                  ${item.sale_price.toFixed(2)}
                </div>
                <div className="col-span-2 text-right font-mono font-bold text-green-400 text-lg">
                  ${(item.sale_price * item.cantidad).toFixed(2)}
                </div>
                <div className="col-span-1 text-center">
                  <button
                    onClick={() => eliminarDelCarrito(item.id)}
                    className="p-2 text-red-400 hover:bg-red-900/30 rounded-full transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input de Escaneo (Footer Izquierdo) */}
        <div className="p-4 bg-slate-900 border-t border-slate-700">
          <form onSubmit={buscarProducto} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-600 rounded-xl text-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono"
              placeholder="Escanear Código de Barras..."
              autoComplete="off"
            />
          </form>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* SECCIÓN DERECHA: TOTALES Y ACCIONES */}
      {/* ════════════════════════════════════════════════════════ */}
      <div className="w-96 flex flex-col gap-4">
        {/* Tarjeta de Usuario / Info */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-center text-slate-400 text-sm mb-1">
            <span>Cajero</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <div className="font-bold text-lg text-white">Administrador</div>
        </div>

        {/* Tarjeta de Totales */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between text-slate-400 text-lg">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-lg">
              <span>Impuestos (0%)</span>
              <span>$0.00</span>
            </div>
            <div className="h-px bg-slate-600 my-4"></div>
            <div className="flex justify-between items-end">
              <span className="text-xl font-bold text-slate-300">
                Total a Pagar
              </span>
            </div>
            <div className="text-right text-5xl font-black text-green-400 tracking-tighter drop-shadow-sm">
              ${total.toFixed(2)}
            </div>
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
              className="w-full py-3 bg-slate-700 hover:bg-red-900/50 text-slate-300 hover:text-red-200 rounded-xl font-semibold flex items-center justify-center gap-2 transition"
            >
              <X size={20} /> Cancelar Venta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
