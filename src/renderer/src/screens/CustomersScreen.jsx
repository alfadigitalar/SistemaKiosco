import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit, DollarSign, User } from "lucide-react";
import { toast } from "react-hot-toast";
import ConfirmationModal from "../components/ConfirmationModal";

const CustomersScreen = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);

  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(() => {});

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    dni: "",
    phone: "",
    current_debt: 0,
  });

  // Debt Payment State
  const [paymentAmount, setPaymentAmount] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await window.api.getCustomers();
      setCustomers(data);
    } catch (error) {
      toast.error("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setCurrentCustomer(customer);
      setFormData({
        name: customer.name,
        dni: customer.dni || "",
        phone: customer.phone || "",
        current_debt: customer.current_debt,
      });
    } else {
      setCurrentCustomer(null);
      setFormData({ name: "", dni: "", phone: "", current_debt: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    try {
      if (currentCustomer) {
        // Edit
        await window.api.updateCustomer({
          ...formData,
          id: currentCustomer.id,
        });
        toast.success("Cliente actualizado");
      } else {
        // Create
        await window.api.createCustomer(formData);
        toast.success("Cliente creado");
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error("Error al guardar cliente");
    }
  };

  const handleDeleteCustomer = (id) => {
    setConfirmTitle("Eliminar Cliente");
    setConfirmMessage(
      "¿Estás seguro que deseas eliminar este cliente? Esta acción no se puede deshacer."
    );
    setOnConfirmAction(() => async () => {
      try {
        await window.api.deleteCustomer(id);
        toast.success("Cliente eliminado");
        fetchCustomers();
      } catch (error) {
        toast.error("Error al eliminar");
      }
    });
    setIsConfirmOpen(true);
  };

  const handleOpenDebtModal = (customer) => {
    setCurrentCustomer(customer);
    setPaymentAmount("");
    setIsDebtModalOpen(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Monto inválido");
      return;
    }
    if (amount > currentCustomer.current_debt) {
      toast.error("El monto excede la deuda actual");
      return;
    }

    try {
      await window.api.processDebtPayment({
        clientId: currentCustomer.id,
        amount: amount,
      });
      toast.success("Pago registrado");
      setIsDebtModalOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error("Error al procesar pago");
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.dni && c.dni.includes(search))
  );

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Gestión de Clientes
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Administra cuentas corrientes y fiados
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl flex items-center gap-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <Search className="text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o DNI..."
          className="bg-transparent border-none outline-none text-slate-900 dark:text-white w-full placeholder-slate-400 dark:placeholder-slate-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0">
            <tr>
              <th className="p-4 text-slate-500 dark:text-slate-400 font-medium">
                Nombre
              </th>
              <th className="p-4 text-slate-500 dark:text-slate-400 font-medium">
                DNI
              </th>
              <th className="p-4 text-slate-500 dark:text-slate-400 font-medium">
                Teléfono
              </th>
              <th className="p-4 text-slate-500 dark:text-slate-400 font-medium text-right">
                Deuda
              </th>
              <th className="p-4 text-slate-500 dark:text-slate-400 font-medium text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">
                  Cargando...
                </td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">
                  No se encontraron clientes
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="p-4 font-medium flex items-center gap-3 text-slate-700 dark:text-slate-200">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <User size={16} />
                    </div>
                    {customer.name}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    {customer.dni || "-"}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    {customer.phone || "-"}
                  </td>
                  <td
                    className={`p-4 text-right font-bold ${
                      customer.current_debt > 0
                        ? "text-red-500 dark:text-red-400"
                        : "text-green-500 dark:text-green-400"
                    }`}
                  >
                    ${customer.current_debt.toLocaleString()}
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <button
                      title="Pagar Deuda"
                      onClick={() => handleOpenDebtModal(customer)}
                      className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                      disabled={customer.current_debt <= 0}
                    >
                      <DollarSign size={18} />
                    </button>
                    <button
                      title="Editar"
                      onClick={() => handleOpenModal(customer)}
                      className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      title="Eliminar"
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">
              {currentCustomer ? "Editar Cliente" : "Nuevo Cliente"}
            </h2>
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                    DNI (Opcional)
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    value={formData.dni || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, dni: e.target.value })
                    }
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                    Teléfono (Opcional)
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    value={formData.phone || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Debt Payment Modal */}
      {isDebtModalOpen && currentCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">
              Pago a Cuenta
            </h2>
            <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Cliente
              </p>
              <p className="font-bold text-lg text-slate-800 dark:text-white">
                {currentCustomer.name}
              </p>
              <div className="my-2 border-t border-slate-200 dark:border-slate-800"></div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Deuda Actual
              </p>
              <p className="font-bold text-xl text-red-500 dark:text-red-400">
                ${currentCustomer.current_debt.toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleProcessPayment}>
              <div className="mb-6">
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                  Monto a Pagar
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={currentCustomer.current_debt}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 pl-8 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDebtModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!paymentAmount || paymentAmount <= 0}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={onConfirmAction}
        title={confirmTitle}
        message={confirmMessage}
        isDestructive={true}
        confirmText="Eliminar"
      />
    </div>
  );
};

export default CustomersScreen;
