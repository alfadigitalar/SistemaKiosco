import React, { useState, useEffect, useRef } from "react";
import { Search, X, Check, User } from "lucide-react";

/**
 * Componente de Búsqueda de Clientes
 * Reemplaza al select nativo para permitir buscar por nombre o DNI.
 */
const CustomerSearch = ({ customers, selectedCustomer, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Filtrar clientes
    if (!searchTerm) {
      setFilteredCustomers(customers.slice(0, 50)); // Mostrar primeros 50 si no hay búsqueda
    } else {
      const lowerSrc = searchTerm.toLowerCase();
      const filtered = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(lowerSrc) ||
          (c.dni && c.dni.includes(lowerSrc))
      );
      setFilteredCustomers(filtered.slice(0, 50)); // Limitar resultados
    }
  }, [searchTerm, customers]);

  useEffect(() => {
    // Cerrar al hacer click fuera
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (customer) => {
    onSelect(customer);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
        Cliente (Opcional)
      </label>

      {!isOpen && selectedCustomer ? (
        // Estado: Cliente Seleccionado
        <div
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <User
              size={16}
              className="text-blue-600 dark:text-blue-400 shrink-0"
            />
            <span className="font-medium text-blue-900 dark:text-blue-100 truncate">
              {selectedCustomer.name}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(null);
            }}
            className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full text-blue-600 dark:text-blue-400"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        // Estado: Input de Búsqueda (o placeholder selector)
        <div className="relative">
          <div
            onClick={() => {
              if (!isOpen) {
                setIsOpen(true);
                setTimeout(() => inputRef.current?.focus(), 0);
              }
            }}
            className={`flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 border ${
              isOpen
                ? "border-blue-500 ring-1 ring-blue-500"
                : "border-slate-300 dark:border-slate-600"
            } rounded-lg cursor-text transition-all`}
          >
            <Search size={16} className="text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder={
                isOpen ? "Buscar nombre o DNI..." : "-- Cliente Casual --"
              }
              className="bg-transparent border-none outline-none w-full text-sm text-slate-900 dark:text-white placeholder-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsOpen(true)}
            />
          </div>

          {/* Lista Desplegable */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
              <div
                onClick={() => handleSelect(null)}
                className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium"
              >
                <span>-- Cliente Casual --</span>
              </div>

              {filteredCustomers.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  No se encontraron clientes
                </div>
              ) : (
                filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className={`p-3 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0 flex justify-between items-center ${
                      selectedCustomer?.id === c.id
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-sm">
                        {c.name}
                      </p>
                      {c.dni && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          DNI: {c.dni}
                        </p>
                      )}
                    </div>
                    {selectedCustomer?.id === c.id && (
                      <Check
                        size={16}
                        className="text-blue-600 dark:text-blue-400"
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;
