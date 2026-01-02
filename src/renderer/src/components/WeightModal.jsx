import React, { useState, useEffect } from "react";
import { Scale, Check, X } from "lucide-react";

const WeightModal = ({ isOpen, onClose, product, onConfirm }) => {
  const [weight, setWeight] = useState("");

  useEffect(() => {
    if (isOpen) {
      setWeight("");
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!weight || parseFloat(weight) <= 0) return;

    onConfirm(parseFloat(weight));
    onClose();
  };

  const currentPrice = parseFloat(weight || 0) * product.price;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-sm shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-xl">
            <Scale className="text-blue-500" />
            <span>Pesaje</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6 text-center">
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-1">
            {product.name}
          </h3>
          <p className="text-sm text-slate-500 font-mono">
            ${product.price}/kg
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Peso (kg)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0.001"
                className="w-full p-4 text-3xl text-center font-mono bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                placeholder="0.000"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                KG
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl mb-6 flex justify-between items-center border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500">Precio Final</span>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
              ${currentPrice.toFixed(2)}
            </span>
          </div>

          <button
            type="submit"
            disabled={!weight || parseFloat(weight) <= 0}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
          >
            <Check size={20} />
            Confirmar Peso
          </button>
        </form>
      </div>
    </div>
  );
};

export default WeightModal;
