import React, { useState, useEffect, useRef } from "react";
import { Scale, X, Check } from "lucide-react";

/**
 * Modal para ingresar cantidad pesable (Kg/Gr, L/Ml, etc.)
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onConfirm: (cantidad) => void
 * - product: objeto producto (para saber su unidad base y nombre)
 */
export default function WeightModal({ isOpen, onClose, onConfirm, product }) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  // Unidad seleccionada por el usuario en el modal (ej: 'gr' aunque la base sea 'kg')
  // Por defecto, usamos la del producto
  const [selectedUnit, setSelectedUnit] = useState("kg");

  useEffect(() => {
    if (isOpen && product) {
      setInputValue("");
      // Determinar unidad por defecto para mostrar
      // Si el producto es 'kg', mostramos 'gr' como la opción alternativa (o default según preferencia)
      // Para simplificar, si es kg/gr/l/ml, mostramos opciones lógicas.

      const baseUnit = product.measurement_unit || "un";
      // Defaults lógicos
      if (baseUnit === "kg")
        setSelectedUnit("gr"); // Es más común pesar en gramos
      else if (baseUnit === "l") setSelectedUnit("l");
      else setSelectedUnit(baseUnit);

      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, product]);

  const handleConfirm = (e) => {
    e.preventDefault();
    const val = parseFloat(inputValue);
    if (!val || val <= 0) return;

    let finalQuantity = val;

    // Lógica de Conversión
    // El sistema siempre espera la cantidad en la unidad base del producto.
    const baseUnit = product.measurement_unit;

    if (baseUnit === "kg" && selectedUnit === "gr") {
      finalQuantity = val / 1000;
    } else if (baseUnit === "l" && selectedUnit === "ml") {
      finalQuantity = val / 1000;
    } else if (baseUnit === "m" && selectedUnit === "cm") {
      finalQuantity = val / 100;
    }
    // Si las unidades coinciden (kg -> kg), no se toca.

    onConfirm(finalQuantity);
    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-purple-600 p-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Scale size={24} />
            Peso / Cantidad
          </div>
          <button
            onClick={onClose}
            className="hover:bg-purple-700 p-1 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleConfirm} className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wide font-bold">
              Producto
            </p>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white truncate">
              {product.name}
            </h3>
            <p className="text-sm text-slate-400">
              Unidad Base: {product.measurement_unit}
            </p>
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="number"
                step="0.001"
                min="0.001"
                required
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full text-4xl font-bold text-center bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl py-4 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-slate-900 dark:text-white transition-all"
                placeholder="0"
              />
            </div>

            {/* Unit Toggles */}
            <div className="flex flex-col gap-1 w-24">
              {product.measurement_unit === "kg" && (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedUnit("gr")}
                    className={`px-3 py-2 rounded-lg font-bold text-sm transition ${
                      selectedUnit === "gr"
                        ? "bg-purple-600 text-white shadow-lg"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                    }`}
                  >
                    Gramos
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUnit("kg")}
                    className={`px-3 py-2 rounded-lg font-bold text-sm transition ${
                      selectedUnit === "kg"
                        ? "bg-purple-600 text-white shadow-lg"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                    }`}
                  >
                    Kilos
                  </button>
                </>
              )}
              {product.measurement_unit === "l" && (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedUnit("ml")}
                    className={`px-3 py-2 rounded-lg font-bold text-sm transition ${
                      selectedUnit === "ml"
                        ? "bg-purple-600 text-white shadow-lg"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                    }`}
                  >
                    ml
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUnit("l")}
                    className={`px-3 py-2 rounded-lg font-bold text-sm transition ${
                      selectedUnit === "l"
                        ? "bg-purple-600 text-white shadow-lg"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                    }`}
                  >
                    Litros
                  </button>
                </>
              )}

              {/* Fallback for others */}
              {product.measurement_unit !== "kg" &&
                product.measurement_unit !== "l" && (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-500 font-bold">
                    {product.measurement_unit}
                  </div>
                )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-purple-900/20 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Check size={24} /> Confirmar
          </button>
        </form>
      </div>
    </div>
  );
}
