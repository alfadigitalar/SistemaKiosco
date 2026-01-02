import React, { useState, useEffect, useRef } from "react";
import { Search, X, User } from "lucide-react";

const CustomerSearch = ({ customers, selectedCustomer, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Keep search term in sync if external selection changes (optional, but good)
  useEffect(() => {
    if (selectedCustomer) {
      setSearchTerm(selectedCustomer.name);
    } else {
      setSearchTerm("");
    }
  }, [selectedCustomer]);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.dni.includes(searchTerm)
  );

  const handleSelect = (customer) => {
    onSelect(customer);
    setSearchTerm(customer.name);
    setIsOpen(false);
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onSelect(null);
    setSearchTerm("");
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          className="w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
          placeholder="Buscar cliente (Nombre o DNI)..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (e.target.value === "") onSelect(null);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {selectedCustomer ? (
          <button
            onClick={clearSelection}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-red-500"
          >
            <X size={16} />
          </button>
        ) : (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {/* Placeholder or nothing */}
          </div>
        )}
      </div>

      {isOpen && searchTerm && filteredCustomers.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => handleSelect(customer)}
              className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 last:border-0"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-slate-600 flex items-center justify-center text-blue-600 dark:text-slate-300">
                <User size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  {customer.name}
                </p>
                <p className="text-xs text-slate-500">{customer.dni}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && searchTerm && filteredCustomers.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3 text-center text-slate-500">
          No se encontraron clientes.
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;
