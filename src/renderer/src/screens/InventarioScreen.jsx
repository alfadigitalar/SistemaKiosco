import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Package,
  AlertTriangle,
  X,
  Barcode,
} from "lucide-react";
import { toast } from "react-hot-toast";

const InventarioScreen = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    cost_price: "",
    sale_price: "",
    stock_quantity: "",
    min_stock: "5",
    category_id: null,
  });

  const barcodeInputRef = useRef(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Usamos getProducts que ya está expuesto
      const data = await window.api.getProducts();
      setProducts(data);
    } catch (error) {
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenModal = (product = null) => {
    if (product) {
      setCurrentProduct(product);
      setFormData({
        barcode: product.barcode,
        name: product.name,
        cost_price: product.cost_price,
        sale_price: product.sale_price,
        stock_quantity: product.stock_quantity,
        min_stock: product.min_stock,
        category_id: product.category_id,
      });
    } else {
      setCurrentProduct(null);
      setFormData({
        barcode: "",
        name: "",
        cost_price: "",
        sale_price: "",
        stock_quantity: "",
        min_stock: "5",
        category_id: null,
      });
    }
    setIsModalOpen(true);
    // Enfocar input de código de barras al abrir (pequeño delay para renderizado)
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        cost_price: parseFloat(formData.cost_price) || 0,
        sale_price: parseFloat(formData.sale_price) || 0,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_stock: parseInt(formData.min_stock) || 0,
      };

      if (currentProduct) {
        // Edit
        const result = await window.api.updateProduct({
          ...productData,
          id: currentProduct.id,
        });

        if (result.success) {
          toast.success("Producto actualizado");
        } else {
          toast.error(result.error);
          return;
        }
      } else {
        // Create
        const result = await window.api.addProduct(productData);
        if (result.success) {
          toast.success("Producto creado");
        } else {
          toast.error(result.error);
          return;
        }
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error("Error al guardar producto");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este producto?")) {
      try {
        await window.api.deleteProduct(id);
        toast.success("Producto eliminado");
        fetchProducts();
      } catch (error) {
        toast.error("Error al eliminar");
      }
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search))
  );

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden bg-slate-900 text-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Inventario</h1>
          <p className="text-slate-400">Gestión de productos y stock</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-800 p-4 rounded-xl flex items-center gap-4">
        <Search className="text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o código de barras..."
          className="bg-transparent border-none outline-none text-white w-full placeholder-slate-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-slate-800 rounded-xl shadow-lg border border-slate-700">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-900/50 sticky top-0 z-10">
            <tr>
              <th className="p-4 text-slate-400 font-medium">Código</th>
              <th className="p-4 text-slate-400 font-medium">Producto</th>
              <th className="p-4 text-slate-400 font-medium text-right">
                Costo
              </th>
              <th className="p-4 text-slate-400 font-medium text-right">
                Precio Venta
              </th>
              <th className="p-4 text-slate-400 font-medium text-center">
                Stock
              </th>
              <th className="p-4 text-slate-400 font-medium text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">
                  Cargando inventario...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">
                  No se encontraron productos
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors"
                >
                  <td className="p-4 text-slate-400 font-mono text-sm">
                    {product.barcode || "-"}
                  </td>
                  <td className="p-4 font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center text-blue-400">
                      <Package size={16} />
                    </div>
                    {product.name}
                  </td>
                  <td className="p-4 text-right text-slate-400">
                    ${product.cost_price?.toFixed(2)}
                  </td>
                  <td className="p-4 text-right font-bold text-green-400">
                    ${product.sale_price?.toFixed(2)}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        product.stock_quantity <= product.min_stock
                          ? "bg-red-900/50 text-red-400 border border-red-500/30"
                          : "bg-emerald-900/30 text-emerald-400"
                      }`}
                    >
                      {product.stock_quantity}{" "}
                      {product.stock_quantity <= product.min_stock && (
                        <AlertTriangle className="inline w-3 h-3 ml-1 -mt-0.5" />
                      )}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <button
                      title="Editar"
                      onClick={() => handleOpenModal(product)}
                      className="p-2 bg-blue-900/30 text-blue-400 rounded-lg hover:bg-blue-900/50 transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      title="Eliminar"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors"
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

      {/* Modal Crear/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {currentProduct ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleSaveProduct}
              className="p-6 overflow-y-auto space-y-6"
            >
              {/* Sección 1: Identificación */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">
                    Nombre del Producto
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ej: Coca Cola 2.25L"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Código de Barras
                  </label>
                  <div className="relative">
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 pl-9 text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                      value={formData.barcode}
                      onChange={(e) =>
                        setFormData({ ...formData, barcode: e.target.value })
                      }
                      placeholder="Escanea o escribe..."
                    />
                    <Barcode className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    value={formData.min_stock}
                    onChange={(e) =>
                      setFormData({ ...formData, min_stock: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Sección 2: Precios y Stock */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Costo ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    value={formData.cost_price}
                    onChange={(e) =>
                      setFormData({ ...formData, cost_price: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Precio Venta ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white font-bold text-green-400 focus:ring-2 focus:ring-green-500 outline-none"
                    value={formData.sale_price}
                    onChange={(e) =>
                      setFormData({ ...formData, sale_price: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Stock Actual
                  </label>
                  <input
                    type="number"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_quantity: e.target.value,
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProduct}
                type="button"
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium shadow-lg shadow-purple-900/20"
              >
                Guardar Producto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventarioScreen;
