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
  History,
} from "lucide-react";
import { toast } from "react-hot-toast";
import StockDetailModal from "../components/StockDetailModal";

const InventarioScreen = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products"); // "products" | "promos"

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  // Stock Control Modal
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    cost_price: "",
    sale_price: "",
    stock_quantity: "",
    min_stock: "5",
    category_id: null,
    supplier_id: "",
    measurement_unit: "un",
    // Promo specific props
    is_promo: false,
    promo_items: [], // Array of { product_id, quantity }
  });

  // State for promo components selection
  const [promoSearch, setPromoSearch] = useState("");
  const [selectedComponents, setSelectedComponents] = useState([]);

  const barcodeInputRef = useRef(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Usamos getProducts que ya está expuesto
      const [productsData, suppliersData] = await Promise.all([
        window.api.getProducts(),
        window.api.getSuppliers(),
      ]);
      setProducts(productsData);
      setSuppliers(suppliersData);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Ref para el estado del modal (para usar dentro del listener sin dependencias)
  const isModalOpenRef = useRef(isModalOpen);
  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  // Ref para debounce
  const lastScanTimeRef = useRef(0);

  // Listener de Escáner Móvil
  useEffect(() => {
    const removeListener = window.api.onMobileScan((code) => {
      const now = Date.now();
      if (now - lastScanTimeRef.current < 2000) return;
      lastScanTimeRef.current = now;

      // Lógica:
      // Si el modal está CERRADO -> Abrir modal de "Nuevo Producto" con el código.
      // Si el modal está ABIERTO -> Solo inyectar el código en el campo.

      if (!isModalOpenRef.current) {
        setCurrentProduct(null); // Modo Crear
        setFormData({
          barcode: code,
          name: "",
          cost_price: "",
          sale_price: "",
          stock_quantity: "",
          min_stock: "5",
          category_id: null,
          supplier_id: "",
          measurement_unit: "un",
          is_promo: false,
          promo_items: [],
        });
        setIsModalOpen(true);
        // Enfocar input (delay para render)
        setTimeout(() => barcodeInputRef.current?.focus(), 100);
        toast.success("Nuevo producto detectado", { icon: <Barcode /> });
      } else {
        // Solo actualizar campo
        setFormData((prev) => ({ ...prev, barcode: code }));
        toast.success("Código actualizado");
      }
    });

    return () => removeListener();
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
        supplier_id: product.supplier_id || "",
        measurement_unit: product.measurement_unit || "un",
        is_promo: !!product.is_promo,
        promo_items: [],
      });
      // Load promo items if it's a promo
      if (product.is_promo) {
        window.api.getPromoItems(product.id).then((items) => {
          // Convert to format useful for selection
          setSelectedComponents(
            items.map((i) => ({
              id: i.product_id,
              name: i.name,
              barcode: i.barcode,
              qty: i.quantity,
            }))
          );
        });
      } else {
        setSelectedComponents([]);
      }
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
        supplier_id: "",
        measurement_unit: "un",
        is_promo: activeTab === "promos", // Auto-set if on promos tab
        promo_items: [],
      });
      setSelectedComponents([]);
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
        supplier_id: formData.supplier_id
          ? parseInt(formData.supplier_id)
          : null,
        is_promo: formData.is_promo,
        promo_items: formData.is_promo
          ? selectedComponents.map((c) => ({
              product_id: c.id,
              quantity: c.qty,
            }))
          : [],
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
      (activeTab === "products" ? !p.is_promo : p.is_promo) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search)))
  );

  // Filter for adding components (only standard products, not other promos to avoid cycles for now)
  const componentSearchResults = products
    .filter(
      (p) =>
        !p.is_promo &&
        (p.name.toLowerCase().includes(promoSearch.toLowerCase()) ||
          (p.barcode && p.barcode.includes(promoSearch)))
    )
    .slice(0, 5);

  const addComponent = (product) => {
    if (selectedComponents.find((c) => c.id === product.id)) return;
    setSelectedComponents([...selectedComponents, { ...product, qty: 1 }]);
    setPromoSearch("");
  };

  const removeComponent = (id) => {
    setSelectedComponents(selectedComponents.filter((c) => c.id !== id));
  };

  const updateComponentQty = (id, qty) => {
    setSelectedComponents(
      selectedComponents.map((c) =>
        c.id === id ? { ...c, qty: parseFloat(qty) || 0 } : c
      )
    );
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            {activeTab === "promos"
              ? "Promociones & Combos"
              : "Inventario de Productos"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Gestión de productos y stock
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus size={20} />
          {activeTab === "promos" ? "Nueva Promo" : "Nuevo Producto"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700">
        <button
          className={`pb-3 px-1 font-medium transition-colors border-b-2 ${
            activeTab === "products"
              ? "border-purple-600 text-purple-600 dark:text-purple-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("products")}
        >
          Productos Individuales
        </button>
        <button
          className={`pb-3 px-1 font-medium transition-colors border-b-2 ${
            activeTab === "promos"
              ? "border-purple-600 text-purple-600 dark:text-purple-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("promos")}
        >
          Promos y Combos
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl flex items-center gap-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <Search className="text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o código de barras..."
          className="bg-transparent border-none outline-none text-slate-900 dark:text-white w-full placeholder-slate-400 dark:placeholder-slate-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 transition-colors">
            <tr>
              <th className="p-4 text-slate-500 dark:text-slate-400 font-medium">
                Código
              </th>
              <th className="p-4 text-slate-500 dark:text-slate-400 font-medium">
                Producto
              </th>
              <th className="p-4 text-slate-500 dark:text-slate-400 font-medium text-right">
                Costo
              </th>
              <th className="p-4 text-slate-500 dark:text-slate-400 font-medium text-right">
                Precio Venta
              </th>
              <th className="p-4 text-slate-500 dark:text-slate-400 font-medium text-center">
                Stock
              </th>
              <th className="p-4 text-slate-500 dark:text-slate-400 font-medium text-center">
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
                  className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-sm">
                    {product.barcode || "-"}
                  </td>
                  <td className="p-4 font-medium flex items-center gap-3 text-slate-800 dark:text-white">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Package size={16} />
                    </div>
                    {product.name}
                  </td>
                  <td className="p-4 text-right text-slate-600 dark:text-slate-400">
                    ${product.cost_price?.toFixed(2)}
                  </td>
                  <td className="p-4 text-right font-bold text-green-600 dark:text-green-400">
                    ${product.sale_price?.toFixed(2)}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        product.stock_quantity <= product.min_stock
                          ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-500/30"
                          : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
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
                      title="Historial de Stock"
                      onClick={() => {
                        setSelectedProductForStock(product);
                        setStockModalOpen(true);
                      }}
                      className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      <History size={18} />
                    </button>
                    <button
                      title="Editar"
                      onClick={() => handleOpenModal(product)}
                      className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      title="Eliminar"
                      onClick={() => handleDeleteProduct(product.id)}
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

      {/* Modal Crear/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[90vh] transition-colors">
            <div
              className={`p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center ${
                formData.is_promo ? "bg-purple-50 dark:bg-purple-900/10" : ""
              }`}
            >
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {formData.is_promo && <Package className="text-purple-600" />}
                {currentProduct
                  ? formData.is_promo
                    ? "Editar Promo"
                    : "Editar Producto"
                  : formData.is_promo
                  ? "Nueva Promo"
                  : "Nuevo Producto"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form
              id="product-form"
              onSubmit={handleSaveProduct}
              className="p-6 overflow-y-auto space-y-6"
            >
              {/* Toggle tipo (solo al crear) */}
              {!currentProduct && (
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg w-fit">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        is_promo: false,
                        is_promo: false,
                      })
                    }
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      !formData.is_promo
                        ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                        : "text-slate-500"
                    }`}
                  >
                    Producto
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_promo: true })}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      formData.is_promo
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    Promo/Combo
                  </button>
                </div>
              )}

              {/* Sección 1: Identificación */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                    Nombre {formData.is_promo ? "de la Promo" : "del Producto"}
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder={
                      formData.is_promo
                        ? "Ej: Combo Fernet + Coca"
                        : "Ej: Coca Cola 2.25L"
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                    Código {formData.is_promo ? "(Opcional)" : "de Barras"}
                  </label>
                  <div className="relative">
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pl-9 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono transition-colors"
                      value={formData.barcode}
                      onChange={(e) =>
                        setFormData({ ...formData, barcode: e.target.value })
                      }
                      placeholder="Escanea o escribe..."
                    />
                    <Barcode className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
                  </div>
                </div>

                {!formData.is_promo && (
                  <>
                    <div>
                      <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                        Proveedor
                      </label>
                      <select
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                        value={formData.supplier_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            supplier_id: e.target.value,
                          })
                        }
                      >
                        <option value="">Seleccionar Proveedor</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                        Stock Mínimo
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                        value={formData.min_stock}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            min_stock: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                        Unidad de Medida
                      </label>
                      <select
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                        value={formData.measurement_unit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            measurement_unit: e.target.value,
                          })
                        }
                      >
                        <option value="un">Unidad (un)</option>
                        <option value="kg">Kilogramo (kg)</option>
                        <option value="gr">Gramo (gr)</option>
                        <option value="lt">Litro (l)</option>
                        <option value="mt">Metro (m)</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Sección PROMOS: Componentes */}
              {formData.is_promo && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <Package size={18} className="text-purple-600" />
                    Componentes del Combo
                  </h3>

                  {/* Buscador de componentes */}
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 pl-9 text-sm"
                      placeholder="Buscar producto para agregar..."
                      value={promoSearch}
                      onChange={(e) => setPromoSearch(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />

                    {/* Resultados de búsqueda */}
                    {promoSearch && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                        {componentSearchResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => addComponent(p)}
                            className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm flex justify-between items-center"
                          >
                            <span>{p.name}</span>
                            <span className="text-slate-500 text-xs">
                              ${p.sale_price}
                            </span>
                          </button>
                        ))}
                        {componentSearchResults.length === 0 && (
                          <div className="p-2 text-xs text-slate-500 text-center">
                            No encontrado
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Lista de Componentes Seleccionados */}
                  <div className="space-y-2">
                    {selectedComponents.length === 0 ? (
                      <p className="text-center text-sm text-slate-400 italic py-2">
                        Agrega productos al combo
                      </p>
                    ) : (
                      selectedComponents.map((comp) => (
                        <div
                          key={comp.id}
                          className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {comp.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {comp.barcode}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-slate-500">
                                Cant:
                              </span>
                              <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                className="w-16 p-1 text-center bg-slate-50 dark:bg-slate-900 border rounded text-sm"
                                value={comp.qty}
                                onChange={(e) =>
                                  updateComponentQty(comp.id, e.target.value)
                                }
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeComponent(comp.id)}
                              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Sección 2: Precios y Stock */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 transition-colors">
                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                    Costo {formData.is_promo ? "Estimado" : ""} ($)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                      value={formData.cost_price}
                      onChange={(e) =>
                        setFormData({ ...formData, cost_price: e.target.value })
                      }
                      placeholder="0.00"
                    />
                    {formData.is_promo && selectedComponents.length > 0 && (
                      <div className="text-xs text-slate-500 mt-1">
                        Sugerido: $
                        {selectedComponents
                          .reduce(
                            (acc, c) =>
                              acc + (c.cost_price || 0) * (c.qty || 1),
                            0
                          )
                          .toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                    Precio Venta ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-900 dark:text-white font-bold text-green-600 dark:text-green-400 focus:ring-2 focus:ring-green-500 outline-none transition-colors"
                    value={formData.sale_price}
                    onChange={(e) =>
                      setFormData({ ...formData, sale_price: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                    Stock {formData.is_promo ? "(Manual/Objetivo)" : "Actual"}
                  </label>
                  <input
                    type="number"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
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

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 transition-colors">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="product-form"
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium shadow-lg shadow-purple-900/20"
              >
                {formData.is_promo ? "Guardar Promo" : "Guardar Producto"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Control de Stock */}
      <StockDetailModal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        product={selectedProductForStock}
        onStockUpdate={() => {
          fetchProducts(); // Recargar tabla principal para ver stock actualizado
        }}
      />
    </div>
  );
};

export default InventarioScreen;
