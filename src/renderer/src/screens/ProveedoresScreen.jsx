import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Truck,
  FileText,
  Download,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ProveedoresScreen = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]); // Para el pedido
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal Supplier
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    contact_name: "",
    phone: "",
    email: "",
    notes: "",
  });

  // Modal Pedido
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderSupplier, setOrderSupplier] = useState(null);
  const [orderItems, setOrderItems] = useState([]); // { product, quantity }
  const [productSearch, setProductSearch] = useState("");

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await window.api.getSuppliers();
      setSuppliers(data);
    } catch (error) {
      toast.error("Error al cargar proveedores");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const allProducts = await window.api.getProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
  }, []);

  // --- CRUD PROVEEDORES ---

  const handleOpenModal = (supplier = null) => {
    if (supplier) {
      setCurrentSupplier(supplier);
      setFormData(supplier);
    } else {
      setCurrentSupplier(null);
      setFormData({
        name: "",
        contact_name: "",
        phone: "",
        email: "",
        notes: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    try {
      if (currentSupplier) {
        await window.api.updateSupplier({
          ...formData,
          id: currentSupplier.id,
        });
        toast.success("Proveedor actualizado");
      } else {
        await window.api.createSupplier(formData);
        toast.success("Proveedor creado");
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (error) {
      toast.error("Error al guardar");
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (window.confirm("¿Eliminar proveedor?")) {
      await window.api.deleteSupplier(id);
      fetchSuppliers();
    }
  };

  // --- GENERACIÓN DE PEDIDOS ---

  const handleOpenOrder = (supplier) => {
    setOrderSupplier(supplier);
    setOrderItems([]);
    setIsOrderModalOpen(true);
  };

  const handleLoadLowStock = () => {
    const lowStockItems = products
      .filter((p) => p.stock_quantity <= p.min_stock)
      .map((p) => ({
        product: p,
        quantity: Math.max(10, p.min_stock * 2 - p.stock_quantity), // Sugerencia simple
      }));

    // Evitar duplicados si ya estaban agregados
    const newItems = [...orderItems];
    lowStockItems.forEach((item) => {
      if (!newItems.find((i) => i.product.id === item.product.id)) {
        newItems.push(item);
      }
    });

    setOrderItems(newItems);
    toast.success(`${lowStockItems.length} productos con stock bajo agregados`);
  };

  const handleAddProductToOrder = (product) => {
    if (orderItems.find((i) => i.product.id === product.id)) {
      return toast.error("El producto ya está en la lista");
    }
    setOrderItems([...orderItems, { product, quantity: 10 }]);
    setProductSearch("");
  };

  const handleUpdateQuantity = (index, qty) => {
    const newItems = [...orderItems];
    newItems[index].quantity = parseInt(qty) || 0;
    setOrderItems(newItems);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  // --- PDF EXPORT ---
  const generatePDF = () => {
    if (orderItems.length === 0) return toast.error("La lista está vacía");

    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text("Orden de Compra", 14, 20);

    doc.setFontSize(12);
    doc.text("Novy Kiosco", 14, 30);
    doc.text("Dirección: Calle Falsa 123", 14, 35);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 40);

    // Datos Proveedor
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); // Black
    doc.text(`Proveedor: ${orderSupplier.name}`, 14, 55);
    doc.setFontSize(10);
    doc.text(`Contacto: ${orderSupplier.contact_name || "-"}`, 14, 60);
    doc.text(`Email: ${orderSupplier.email || "-"}`, 14, 65);

    // Tabla
    const tableColumn = ["Código", "Producto", "Cant. Solicitada"];
    const tableRows = [];

    orderItems.forEach((item) => {
      const row = [item.product.barcode, item.product.name, item.quantity];
      tableRows.push(row);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 75,
      theme: "grid",
      headStyles: { fillColor: [75, 85, 99] }, // Slate-600 like
    });

    doc.save(
      `Pedido_${orderSupplier.name}_${
        new Date().toISOString().split("T")[0]
      }.pdf`
    );
    toast.success("PDF descargado correctamente");
  };

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProducts = products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) &&
        !orderItems.find((i) => i.product.id === p.id)
    )
    .slice(0, 5); // Solo mostrar 5 sugerencias

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden bg-slate-900 text-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Proveedores</h1>
          <p className="text-slate-400">Gestión de compras y pedidos</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuevo Proveedor
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-800 p-4 rounded-xl flex items-center gap-4 border border-slate-700">
        <Search className="text-slate-400" />
        <input
          type="text"
          placeholder="Buscar proveedor..."
          className="bg-transparent border-none outline-none text-white w-full placeholder-slate-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid de Proveedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-4">
        {filteredSuppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg group hover:border-blue-500/50 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-900/30 rounded-lg text-blue-400">
                <Truck size={24} />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenOrder(supplier)}
                  title="Crear Pedido"
                  className="p-2 hover:bg-slate-700 rounded-lg text-green-400 transition"
                >
                  <FileText size={18} />
                </button>
                <button
                  onClick={() => handleOpenModal(supplier)}
                  className="p-2 hover:bg-slate-700 rounded-lg text-blue-400 transition"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDeleteSupplier(supplier.id)}
                  className="p-2 hover:bg-slate-700 rounded-lg text-red-400 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {supplier.name}
            </h3>
            <div className="space-y-1 text-sm text-slate-400">
              <p>
                <span className="font-semibold text-slate-500">Contacto:</span>{" "}
                {supplier.contact_name || "-"}
              </p>
              <p>
                <span className="font-semibold text-slate-500">Tel:</span>{" "}
                {supplier.phone || "-"}
              </p>
              <p>
                <span className="font-semibold text-slate-500">Email:</span>{" "}
                {supplier.email || "-"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal CRUD Proveedor */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700 p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-6">
              {currentSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
            </h2>
            <form onSubmit={handleSaveSupplier} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Empresa / Nombre
                </label>
                <input
                  required
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 outline-none focus:ring-2"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Nombre de Contacto
                </label>
                <input
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 outline-none focus:ring-2"
                  value={formData.contact_name}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Teléfono
                  </label>
                  <input
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 outline-none focus:ring-2"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 outline-none focus:ring-2"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Generar Pedido */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-4xl border border-slate-700 flex flex-col max-h-[90vh] shadow-2xl">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="text-blue-400" /> Nuevo Pedido
                </h2>
                <p className="text-sm text-slate-400">
                  Proveedor:{" "}
                  <span className="text-white font-medium">
                    {orderSupplier.name}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Acciones Rápidas */}
              <div className="flex gap-4 items-center bg-slate-700/20 p-4 rounded-xl border border-slate-700 border-dashed">
                <button
                  onClick={handleLoadLowStock}
                  className="px-4 py-2 bg-yellow-600/20 text-yellow-500 border border-yellow-600/50 rounded-lg hover:bg-yellow-600/30 transition flex items-center gap-2 text-sm font-bold"
                >
                  <Download size={16} /> Cargar Faltantes (Stock Bajo)
                </button>
                <div className="flex-1 relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Buscar producto para agregar..."
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  {/* Dropdown sugerencias */}
                  {productSearch && (
                    <div className="absolute top-full left-0 w-full bg-slate-800 border border-slate-600 rounded-lg mt-1 shadow-xl z-10 overflow-hidden">
                      {filteredProducts.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleAddProductToOrder(p)}
                          className="w-full text-left p-3 hover:bg-slate-700 flex justify-between items-center text-sm border-b border-slate-700/50 last:border-0"
                        >
                          <span>{p.name}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              p.stock_quantity <= p.min_stock
                                ? "bg-red-900/30 text-red-500"
                                : "bg-green-900/30 text-green-500"
                            }`}
                          >
                            Stock: {p.stock_quantity}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tabla Items */}
              <table className="w-full text-left border-collapse">
                <thead className="text-xs uppercase text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="pb-3 pl-2">Producto</th>
                    <th className="pb-3 text-center">Stock Actual</th>
                    <th className="pb-3 text-center">Cantidad a Pedir</th>
                    <th className="pb-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {orderItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="py-8 text-center text-slate-500 italic"
                      >
                        La lista de pedido está vacía.
                      </td>
                    </tr>
                  ) : (
                    orderItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-700/20">
                        <td className="py-3 pl-2">
                          <div className="font-medium text-white">
                            {item.product.name}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {item.product.barcode}
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded ${
                              item.product.stock_quantity <=
                              item.product.min_stock
                                ? "text-red-400 bg-red-900/20"
                                : "text-slate-400 bg-slate-800"
                            }`}
                          >
                            {item.product.stock_quantity}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <input
                            type="number"
                            min="1"
                            className="bg-slate-900 border border-slate-600 rounded w-20 text-center py-1 outline-none focus:border-blue-500 font-bold text-white"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(idx, e.target.value)
                            }
                          />
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-500 hover:text-red-400 transition"
                          >
                            <X size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-slate-700 bg-slate-900/50 rounded-b-2xl flex justify-between items-center">
              <div className="text-sm text-slate-400">
                Total Items:{" "}
                <span className="text-white font-bold">
                  {orderItems.length}
                </span>
              </div>
              <button
                onClick={generatePDF}
                disabled={orderItems.length === 0}
                className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-900/20 transition-all hover:-translate-y-1"
              >
                <Download size={20} /> DESCARGAR PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProveedoresScreen;
