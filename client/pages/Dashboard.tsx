import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getOrInitializeProducts, type Product } from "../lib/products";
import {
  getOrInitializeCategories,
  addCategory,
  removeCategory,
} from "../lib/categories";

interface OrderItem {
  name: string;
  strength: string;
  quantity: number;
}

interface Order {
  orderNumber: string;
  customerName: string;
  storeName: string;
  email: string;
  phone: string;
  items: OrderItem[];
  timestamp: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"inventory" | "orders">(
    "inventory",
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    strength: "",
    stock: 0,
    multipleOf: 0,
  });
  const [addForm, setAddForm] = useState({
    name: "",
    category: "Euro Zyn Flavours",
    strength: "",
    stock: 0,
    multipleOf: 5,
  });

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated =
      localStorage.getItem("adminAuthenticated") === "true";
    if (!isAuthenticated) {
      navigate("/admin");
      return;
    }

    // Load data from API
    const loadData = async () => {
      try {
        // Load orders from API
        const apiUrl = '/api/orders';

        const ordersResponse = await fetch(apiUrl);
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setOrders(ordersData);
        }

        // Load products from API
        const productsData = await getOrInitializeProducts();
        setProducts(productsData);

        // Load categories from API
        const categoriesData = await getOrInitializeCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      }
    };

    loadData();

    // Poll for updates every 10 seconds to see new orders and stock changes
    const pollInterval = setInterval(loadData, 10000);
    return () => clearInterval(pollInterval);
  }, [navigate]);

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      category: product.category,
      strength: product.strength,
      stock: product.stock,
      multipleOf: product.multipleOf,
    });
  };

  const handleSaveProduct = () => {
    if (!editingProduct) return;

    const allProducts = getOrInitializeProducts();
    const updatedProducts = allProducts.map((p) => {
      if (p.id === editingProduct.id) {
        const newStock = editForm.stock;
        return {
          ...p,
          name: editForm.name,
          category: editForm.category,
          strength: editForm.strength,
          stock: newStock,
          multipleOf: editForm.multipleOf,
          status:
            newStock === 0
              ? ("Out of Stock" as const)
              : newStock < 20
                ? ("Low Stock" as const)
                : ("In Stock" as const),
        };
      }
      return p;
    });

    localStorage.setItem("products", JSON.stringify(updatedProducts));
    setProducts(updatedProducts);
    setEditingProduct(null);
  };

  const handleAddProduct = () => {
    if (!addForm.name.trim()) return;

    const allProducts = getOrInitializeProducts();

    // Generate a unique ID based on category
    const categoryPrefix =
      addForm.category === "Euro Zyn Flavours"
        ? "euro"
        : addForm.category === "American Zyn Flavours"
          ? "american"
          : addForm.category === "VELO Flavour"
            ? "velo"
            : "whitefox";

    const categoryProducts = allProducts.filter((p) =>
      p.id.startsWith(categoryPrefix),
    );
    const nextIndex = categoryProducts.length;
    const newId = `${categoryPrefix}-${nextIndex}`;

    const newProduct: Product = {
      id: newId,
      name: addForm.name,
      category: addForm.category,
      strength: addForm.strength,
      stock: addForm.stock,
      multipleOf: addForm.multipleOf,
      status:
        addForm.stock === 0
          ? "Out of Stock"
          : addForm.stock < 20
            ? "Low Stock"
            : "In Stock",
    };

    const updatedProducts = [...allProducts, newProduct];
    localStorage.setItem("products", JSON.stringify(updatedProducts));
    setProducts(updatedProducts);

    // Reset form and close modal
    setAddForm({
      name: "",
      category: "Euro Zyn Flavours",
      strength: "",
      stock: 0,
      multipleOf: 5,
    });
    setShowAddModal(false);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    addCategory(newCategoryName);
    const updatedCategories = getOrInitializeCategories();
    setCategories(updatedCategories);
    setAddForm({ ...addForm, category: newCategoryName });

    // Reset and close modal
    setNewCategoryName("");
    setShowAddCategoryModal(false);
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDeleteProduct = () => {
    if (!productToDelete) return;

    const allProducts = getOrInitializeProducts();
    const updatedProducts = allProducts.filter((p) => p.id !== productToDelete.id);

    // Check if any products remain for the deleted product's category
    const remainingProductsInCategory = updatedProducts.filter(
      (p) => p.category === productToDelete.category,
    );

    // If no products remain for this category, remove the category
    if (remainingProductsInCategory.length === 0) {
      removeCategory(productToDelete.category);
      const updatedCategories = getOrInitializeCategories();
      setCategories(updatedCategories);
    }

    localStorage.setItem("products", JSON.stringify(updatedProducts));
    setProducts(updatedProducts);

    // Close modal and reset
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const handleLogout = () => {
    // Clear authentication flag
    localStorage.removeItem("adminAuthenticated");
    navigate("/admin");
  };

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const outOfStock = products.filter((p) => p.status === "Out of Stock").length;
  const lowStock = products.filter((p) => p.status === "Low Stock").length;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between h-16 px-6 border-b border-[#E2E8F0] bg-white">
        <Link
          to="/"
          className="text-[#009966] text-base leading-6 font-normal hover:opacity-80 transition-opacity"
        >
          NEXPOINT
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-[#45556C] text-base leading-6 font-normal hover:text-[#009966] transition-colors"
          >
            Order Page
          </Link>
          <button
            onClick={handleLogout}
            className="text-[#45556C] text-base leading-6 font-normal hover:text-[#009966] transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 bg-[#F8FAFC] px-6 pt-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-[#0F172B] text-2xl leading-9 font-normal">
              Admin Dashboard
            </h1>
            <p className="text-[#45556C] text-base leading-6 font-normal">
              Manage your inventory and view orders
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col p-6 rounded-[14px] border border-black/10 bg-white">
              <div className="text-[#717182] text-base leading-6 font-normal mb-1.5">
                Total Products
              </div>
              <div className="text-[#0A0A0A] text-base leading-4 font-normal">
                {totalProducts}
              </div>
            </div>

            <div className="flex flex-col p-6 rounded-[14px] border border-black/10 bg-white">
              <div className="text-[#717182] text-base leading-6 font-normal mb-1.5">
                Total Stock
              </div>
              <div className="text-[#0A0A0A] text-base leading-4 font-normal">
                {totalStock} pcs
              </div>
            </div>

            <div className="flex flex-col p-6 rounded-[14px] border border-black/10 bg-white">
              <div className="text-[#717182] text-base leading-6 font-normal mb-1.5">
                Out of Stock
              </div>
              <div className="text-[#E7000B] text-base leading-4 font-normal">
                {outOfStock}
              </div>
            </div>

            <div className="flex flex-col p-6 rounded-[14px] border border-black/10 bg-white">
              <div className="text-[#717182] text-base leading-6 font-normal mb-1.5">
                Low Stock
              </div>
              <div className="text-[#E17100] text-base leading-4 font-normal">
                {lowStock}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-center gap-0 w-[250px] h-9 rounded-[14px] bg-[#ECECF0] p-0.5">
              <button
                onClick={() => setActiveTab("inventory")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-[14px] flex-1 transition-colors whitespace-nowrap ${
                  activeTab === "inventory"
                    ? "bg-white border border-transparent"
                    : "bg-transparent border border-transparent"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M7.33333 14.4867C7.53603 14.6037 7.76595 14.6653 8 14.6653C8.23405 14.6653 8.46397 14.6037 8.66667 14.4867L13.3333 11.82C13.5358 11.7031 13.704 11.535 13.821 11.3325C13.938 11.1301 13.9998 10.9005 14 10.6667V5.33332C13.9998 5.0995 13.938 4.86986 13.821 4.66743C13.704 4.465 13.5358 4.29689 13.3333 4.17999L8.66667 1.51332C8.46397 1.39629 8.23405 1.33469 8 1.33469C7.76595 1.33469 7.53603 1.39629 7.33333 1.51332L2.66667 4.17999C2.46418 4.29689 2.29599 4.465 2.17897 4.66743C2.06196 4.86986 2.00024 5.0995 2 5.33332V10.6667C2.00024 10.9005 2.06196 11.1301 2.17897 11.3325C2.29599 11.535 2.46418 11.7031 2.66667 11.82L7.33333 14.4867Z"
                    stroke="#0A0A0A"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 14.6667V8"
                    stroke="#0A0A0A"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2.19333 4.66666L8 7.99999L13.8067 4.66666"
                    stroke="#0A0A0A"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 2.84665L11 6.27998"
                    stroke="#0A0A0A"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[#0A0A0A] text-sm leading-5 font-normal">
                  Inventory
                </span>
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-[14px] flex-1 transition-colors whitespace-nowrap ${
                  activeTab === "orders"
                    ? "bg-white border border-transparent"
                    : "bg-transparent border border-transparent"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M5.33334 14.6667C5.70153 14.6667 6.00001 14.3682 6.00001 14C6.00001 13.6318 5.70153 13.3333 5.33334 13.3333C4.96515 13.3333 4.66667 13.6318 4.66667 14C4.66667 14.3682 4.96515 14.6667 5.33334 14.6667Z"
                    stroke="#0A0A0A"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12.6667 14.6667C13.0349 14.6667 13.3333 14.3682 13.3333 14C13.3333 13.6318 13.0349 13.3333 12.6667 13.3333C12.2985 13.3333 12 13.6318 12 14C12 14.3682 12.2985 14.6667 12.6667 14.6667Z"
                    stroke="#0A0A0A"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M1.36667 1.36667H2.7L4.47334 9.64667C4.53839 9.94991 4.70712 10.221 4.95048 10.4132C5.19384 10.6055 5.49661 10.7069 5.80667 10.7H12.3267C12.6301 10.6995 12.9243 10.5955 13.1607 10.4052C13.397 10.2149 13.5614 9.94969 13.6267 9.65333L14.7267 4.7H3.41334"
                    stroke="#0A0A0A"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[#0A0A0A] text-sm leading-5 font-normal">
                  Orders ({orders.length})
                </span>
              </button>
            </div>

            {activeTab === "inventory" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[#0F172B] text-base leading-6 font-normal">
                    Product Inventory
                  </h2>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#009966] hover:bg-[#007a52] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3.33331 8H12.6666"
                        stroke="white"
                        strokeWidth="1.33333"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 3.33334V12.6667"
                        stroke="white"
                        strokeWidth="1.33333"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-white text-sm leading-5 font-normal">
                      Add Product
                    </span>
                  </button>
                </div>

                {(outOfStock > 0 || lowStock > 0) && (
                  <div className="flex items-center gap-3 p-3 rounded-[10px] border border-[#FEE685] bg-[#FFFBEB]">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <g clipPath="url(#clip0)">
                        <path
                          d="M8 14.6666C11.6819 14.6666 14.6667 11.6819 14.6667 7.99998C14.6667 4.31808 11.6819 1.33331 8 1.33331C4.3181 1.33331 1.33333 4.31808 1.33333 7.99998C1.33333 11.6819 4.3181 14.6666 8 14.6666Z"
                          stroke="#0A0A0A"
                          strokeWidth="1.33333"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 5.33331V7.99998"
                          stroke="#0A0A0A"
                          strokeWidth="1.33333"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 10.6667H8.00667"
                          stroke="#0A0A0A"
                          strokeWidth="1.33333"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0">
                          <rect width="16" height="16" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                    <p className="text-[#973C00] text-sm leading-5 font-normal">
                      {outOfStock} product is out of stock. {lowStock} product
                      has low stock.
                    </p>
                  </div>
                )}

                <div className="rounded-[10px] border border-[#E2E8F0] bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-black/10">
                          <th className="text-left px-2 py-2 text-[#0A0A0A] text-sm leading-5 font-normal">
                            Product Name
                          </th>
                          <th className="text-left px-2 py-2 text-[#0A0A0A] text-sm leading-5 font-normal">
                            Category
                          </th>
                          <th className="text-left px-2 py-2 text-[#0A0A0A] text-sm leading-5 font-normal">
                            Strength
                          </th>
                          <th className="text-left px-2 py-2 text-[#0A0A0A] text-sm leading-5 font-normal">
                            Stock
                          </th>
                          <th className="text-left px-2 py-2 text-[#0A0A0A] text-sm leading-5 font-normal">
                            Multiple Of
                          </th>
                          <th className="text-left px-2 py-2 text-[#0A0A0A] text-sm leading-5 font-normal">
                            Status
                          </th>
                          <th className="text-right px-2 py-2 text-[#0A0A0A] text-sm leading-5 font-normal">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product, index) => (
                          <tr
                            key={index}
                            className="border-b border-black/10 last:border-0"
                          >
                            <td className="px-2 py-3.5 text-[#0A0A0A] text-sm leading-5 font-normal">
                              {product.name}
                            </td>
                            <td className="px-2 py-3.5 text-[#45556C] text-sm leading-5 font-normal">
                              {product.category}
                            </td>
                            <td className="px-2 py-3.5">
                              <span className="inline-flex items-center px-2 py-1 rounded-lg border border-black/10 text-[#0A0A0A] text-xs leading-4 font-normal">
                                {product.strength}
                              </span>
                            </td>
                            <td className="px-2 py-3.5">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={product.stock}
                                  readOnly
                                  className="w-24 h-9 px-3 rounded-lg bg-[#F3F3F5] border-0 text-[#0A0A0A] text-sm leading-5 font-normal"
                                />
                                <span className="text-[#62748E] text-sm leading-5 font-normal">
                                  pcs
                                </span>
                              </div>
                            </td>
                            <td className="px-2 py-3.5 text-[#45556C] text-sm leading-5 font-normal">
                              {product.multipleOf}
                            </td>
                            <td className="px-2 py-3.5">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-lg text-xs leading-4 font-normal ${
                                  product.status === "In Stock"
                                    ? "bg-[#D0FAE5] text-[#006045]"
                                    : product.status === "Low Stock"
                                      ? "bg-[#FEE685] text-[#973C00]"
                                      : "bg-[#FEE2E2] text-[#E7000B]"
                                }`}
                              >
                                {product.status}
                              </span>
                            </td>
                            <td className="px-2 py-3.5">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditProduct(product)}
                                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                  >
                                    <path
                                      d="M8 2H3.33333C2.97971 2 2.64057 2.14048 2.39052 2.39052C2.14048 2.64057 2 2.97971 2 3.33333V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H12.6667C13.0203 14 13.3594 13.8595 13.6095 13.6095C13.8595 13.3594 14 13.0203 14 12.6667V8"
                                      stroke="#0A0A0A"
                                      strokeWidth="1.33333"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M12.25 1.74997C12.5152 1.48475 12.8749 1.33575 13.25 1.33575C13.625 1.33575 13.9847 1.48475 14.25 1.74997C14.5152 2.01518 14.6642 2.3749 14.6642 2.74997C14.6642 3.12504 14.5152 3.48475 14.25 3.74997L8.24129 9.7593C8.08299 9.91747 7.88743 10.0332 7.67263 10.096L5.75729 10.656C5.69993 10.6727 5.63912 10.6737 5.58123 10.6589C5.52335 10.644 5.47051 10.6139 5.42826 10.5717C5.386 10.5294 5.35589 10.4766 5.34106 10.4187C5.32623 10.3608 5.32723 10.3 5.34396 10.2426L5.90396 8.3273C5.96698 8.11267 6.08298 7.91734 6.24129 7.7593L12.25 1.74997Z"
                                      stroke="#0A0A0A"
                                      strokeWidth="1.33333"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteProduct(product)
                                  }
                                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                  >
                                    <path
                                      d="M6.66669 7.33331V11.3333"
                                      stroke="#E7000B"
                                      strokeWidth="1.33333"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M9.33331 7.33331V11.3333"
                                      stroke="#E7000B"
                                      strokeWidth="1.33333"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M12.6666 4V13.3333C12.6666 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.6869 14.6667 11.3333 14.6667H4.66665C4.31302 14.6667 3.97389 14.5262 3.72384 14.2761C3.47379 14.0261 3.33331 13.687 3.33331 13.3333V4"
                                      stroke="#E7000B"
                                      strokeWidth="1.33333"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M2 4H14"
                                      stroke="#E7000B"
                                      strokeWidth="1.33333"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M5.33331 3.99998V2.66665C5.33331 2.31302 5.47379 1.97389 5.72384 1.72384C5.97389 1.47379 6.31302 1.33331 6.66665 1.33331H9.33331C9.68694 1.33331 10.0261 1.47379 10.2761 1.72384C10.5262 1.97389 10.6666 2.31302 10.6666 2.66665V3.99998"
                                      stroke="#E7000B"
                                      strokeWidth="1.33333"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="flex flex-col gap-4">
                <h2 className="text-[#0F172B] text-base leading-6 font-normal">
                  Order History
                </h2>

                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 rounded-[14px] border border-black/10 bg-white">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 48 48"
                      fill="none"
                      className="mb-4"
                    >
                      <path
                        d="M16 44C17.1046 44 18 43.1046 18 42C18 40.8954 17.1046 40 16 40C14.8954 40 14 40.8954 14 42C14 43.1046 14.8954 44 16 44Z"
                        stroke="#717182"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M38 44C39.1046 44 40 43.1046 40 42C40 40.8954 39.1046 40 38 40C36.8954 40 36 40.8954 36 42C36 43.1046 36.8954 44 38 44Z"
                        stroke="#717182"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4.10001 4.09998H8.10001L12.42 28.94C12.6154 30.2497 13.2714 31.4431 14.2763 32.3158C15.2812 33.1886 16.5699 33.6857 17.9 33.71H36.98C38.2625 33.6728 39.4976 33.1864 40.4662 32.3356C41.4347 31.4849 42.0761 30.324 42.28 29.05L44.18 14.1H10.24"
                        stroke="#717182"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="text-[#717182] text-base leading-6 font-normal">
                      No orders yet
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {orders
                      .slice()
                      .reverse()
                      .map((order, index) => (
                        <div
                          key={index}
                          className="flex flex-col p-6 gap-8 rounded-[14px] border border-black/10 bg-white"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-0">
                              <div className="text-[#0A0A0A] text-base leading-6 font-normal">
                                {order.customerName}
                              </div>
                              <div className="text-[#717182] text-base leading-6 font-normal">
                                {order.timestamp}
                              </div>
                            </div>
                            <div className="flex items-center px-2 py-1 rounded-lg bg-[#030213]">
                              <span className="text-white text-xs leading-4 font-normal">
                                {order.orderNumber}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-4">
                            <div className="flex gap-4">
                              <div className="flex flex-col gap-1 flex-1">
                                <div className="text-[#45556C] text-sm leading-5 font-normal">
                                  Store Name
                                </div>
                                <div className="text-[#0F172B] text-base leading-6 font-normal">
                                  {order.storeName || "N/A"}
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 flex-1">
                                <div className="text-[#45556C] text-sm leading-5 font-normal">
                                  Email
                                </div>
                                <div className="text-[#0F172B] text-base leading-6 font-normal">
                                  {order.email}
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 flex-1">
                                <div className="text-[#45556C] text-sm leading-5 font-normal">
                                  Phone
                                </div>
                                <div className="text-[#0F172B] text-base leading-6 font-normal">
                                  {order.phone}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <div className="text-[#45556C] text-sm leading-5 font-normal">
                                Order Items
                              </div>
                              <div className="flex flex-col gap-3">
                                {order.items.map((item, itemIndex) => (
                                  <div
                                    key={itemIndex}
                                    className="flex flex-col p-3 rounded-[10px] bg-[#F8FAFC]"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="text-[#0F172B] text-sm leading-5 font-normal">
                                        {item.name} ({item.strength})
                                      </div>
                                      <div className="text-[#45556C] text-sm leading-5 font-normal">
                                        {item.quantity} pcs
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-[512px] rounded-[10px] border border-black/10 bg-white shadow-lg">
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-[#0A0A0A] text-lg leading-[18px] font-bold">
                  Edit Product
                </h2>
                <p className="text-[#717182] text-sm leading-5 font-normal">
                  Update product details and inventory
                </p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="w-4 h-4 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M11.9883 3.99609L3.99609 11.9883"
                    stroke="#0A0A0A"
                    strokeWidth="1.33203"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3.99609 3.99609L11.9883 11.9883"
                    stroke="#0A0A0A"
                    strokeWidth="1.33203"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Form */}
            <div className="px-6 pb-6 flex flex-col gap-4">
              {/* Product Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[#0A0A0A] text-sm leading-[14px] font-normal">
                  Product Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="h-9 px-3 py-1 rounded-lg bg-[#F3F3F5] border-0 text-[#0A0A0A] text-sm leading-5 font-normal"
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[#0A0A0A] text-sm leading-[14px] font-normal">
                  Category
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category: e.target.value })
                  }
                  className="h-9 px-3 py-1 rounded-lg bg-[#F3F3F5] border-0 text-[#0A0A0A] text-sm leading-5 font-normal cursor-pointer appearance-none bg-no-repeat bg-right pr-8"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M3.99609 5.99414L7.99219 9.99023L11.9883 5.99414' stroke='%23717182' stroke-width='1.33203' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundPosition: "right 8px center",
                  }}
                >
                  <option value="Euro Zyn Flavours">Euro Zyn Flavours</option>
                  <option value="American Zyn Flavours">
                    American Zyn Flavours
                  </option>
                  <option value="VELO Flavour">VELO Flavour</option>
                  <option value="Whitefox Flavour">Whitefox Flavour</option>
                </select>
              </div>

              {/* Strength and Multiple Of */}
              <div className="flex gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[#0A0A0A] text-sm leading-[14px] font-normal">
                    Strength
                  </label>
                  <input
                    type="text"
                    value={editForm.strength}
                    onChange={(e) =>
                      setEditForm({ ...editForm, strength: e.target.value })
                    }
                    className="h-9 px-3 py-1 rounded-lg bg-[#F3F3F5] border-0 text-[#0A0A0A] text-sm leading-5 font-normal"
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[#0A0A0A] text-sm leading-[14px] font-normal">
                    Multiple Of
                  </label>
                  <input
                    type="number"
                    value={editForm.multipleOf}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        multipleOf: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-9 px-3 py-1 rounded-lg bg-[#F3F3F5] border-0 text-[#0A0A0A] text-sm leading-5 font-normal"
                  />
                </div>
              </div>

              {/* Stock */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[#0A0A0A] text-sm leading-[14px] font-normal">
                  Stock
                </label>
                <input
                  type="number"
                  value={editForm.stock}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      stock: parseInt(e.target.value) || 0,
                    })
                  }
                  className="h-9 px-3 py-1 rounded-lg bg-[#F3F3F5] border-0 text-[#0A0A0A] text-sm leading-5 font-normal"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 pb-6">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 h-9 flex items-center justify-center rounded-lg border border-black/10 bg-white text-[#0A0A0A] text-sm leading-5 font-normal hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                className="px-4 h-9 flex items-center justify-center rounded-lg bg-[#009966] text-white text-sm leading-5 font-normal hover:bg-[#007a52] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-[512px] rounded-[10px] border border-black/10 bg-white shadow-lg">
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-[#0A0A0A] text-lg leading-[18px] font-bold">
                  Add New Product
                </h2>
                <p className="text-[#717182] text-sm leading-5 font-normal">
                  Create a new product in your inventory
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-4 h-4 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M11.9883 3.99609L3.99609 11.9883"
                    stroke="#0A0A0A"
                    strokeWidth="1.33203"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3.99609 3.99609L11.9883 11.9883"
                    stroke="#0A0A0A"
                    strokeWidth="1.33203"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Form */}
            <div className="px-6 pb-6 flex flex-col gap-4">
              {/* Product Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[#0A0A0A] text-sm leading-[14px] font-normal">
                  Product Name
                </label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm({ ...addForm, name: e.target.value })
                  }
                  placeholder="e.g., Cool Mint"
                  className="h-9 px-3 py-1 rounded-lg bg-[#F3F3F5] border-0 text-[#0A0A0A] text-sm leading-5 font-normal placeholder:text-[#717182]"
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[#0A0A0A] text-sm leading-[14px] font-normal">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={addForm.category}
                    onChange={(e) => {
                      if (e.target.value === "__add_new__") {
                        setShowAddCategoryModal(true);
                      } else {
                        setAddForm({ ...addForm, category: e.target.value });
                      }
                    }}
                    className="h-9 px-3 py-1 rounded-lg bg-[#F3F3F5] border-0 text-[#0A0A0A] text-sm leading-5 font-normal cursor-pointer appearance-none bg-no-repeat bg-right pr-8 w-full"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M3.99609 5.99414L7.99219 9.99023L11.9883 5.99414' stroke='%23717182' stroke-width='1.33203' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundPosition: "right 8px center",
                    }}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__add_new__">+ Add New Category</option>
                  </select>
                </div>
              </div>

              {/* Strength and Multiple Of */}
              <div className="flex gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[#0A0A0A] text-sm leading-[14px] font-normal">
                    Strength
                  </label>
                  <input
                    type="text"
                    value={addForm.strength}
                    onChange={(e) =>
                      setAddForm({ ...addForm, strength: e.target.value })
                    }
                    placeholder="6mg"
                    className="h-9 px-3 py-1 rounded-lg bg-[#F3F3F5] border-0 text-[#0A0A0A] text-sm leading-5 font-normal placeholder:text-[#717182]"
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[#0A0A0A] text-sm leading-[14px] font-normal">
                    Multiple Of
                  </label>
                  <input
                    type="number"
                    value={addForm.multipleOf}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        multipleOf: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-9 px-3 py-1 rounded-lg bg-[#F3F3F5] border-0 text-[#0A0A0A] text-sm leading-5 font-normal"
                  />
                </div>
              </div>

              {/* Initial Stock */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[#0A0A0A] text-sm leading-[14px] font-normal">
                  Initial Stock
                </label>
                <input
                  type="number"
                  value={addForm.stock}
                  onChange={(e) =>
                    setAddForm({
                      ...addForm,
                      stock: parseInt(e.target.value) || 0,
                    })
                  }
                  className="h-9 px-3 py-1 rounded-lg bg-[#F3F3F5] border-0 text-[#0A0A0A] text-sm leading-5 font-normal"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 pb-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 h-9 flex items-center justify-center rounded-lg border border-black/10 bg-white text-[#0A0A0A] text-sm leading-5 font-normal hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                className="px-4 h-9 flex items-center justify-center rounded-lg bg-[#009966] text-white text-sm leading-5 font-normal hover:bg-[#007a52] transition-colors"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-[400px] rounded-[10px] border border-black/10 bg-white shadow-lg">
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-[#0A0A0A] text-lg leading-[18px] font-bold">
                  Add New Category
                </h2>
                <p className="text-[#717182] text-sm leading-5 font-normal">
                  Create a new product category or brand
                </p>
              </div>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="w-4 h-4 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M11.9883 3.99609L3.99609 11.9883"
                    stroke="#0A0A0A"
                    strokeWidth="1.33203"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3.99609 3.99609L11.9883 11.9883"
                    stroke="#0A0A0A"
                    strokeWidth="1.33203"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Form */}
            <div className="px-6 pb-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[#0A0A0A] text-sm leading-[14px] font-normal">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                  placeholder="e.g., Snus Brand"
                  className="h-9 px-3 py-1 rounded-lg bg-[#F3F3F5] border-0 text-[#0A0A0A] text-sm leading-5 font-normal placeholder:text-[#717182]"
                  autoFocus
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 pb-6">
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="px-4 h-9 flex items-center justify-center rounded-lg border border-black/10 bg-white text-[#0A0A0A] text-sm leading-5 font-normal hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="px-4 h-9 flex items-center justify-center rounded-lg bg-[#009966] text-white text-sm leading-5 font-normal hover:bg-[#007a52] transition-colors"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-[400px] rounded-[10px] border border-black/10 bg-white shadow-lg">
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-[#0A0A0A] text-lg leading-[18px] font-bold">
                  Delete Product
                </h2>
                <p className="text-[#717182] text-sm leading-5 font-normal">
                  Are you sure you want to delete this product?
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                className="w-4 h-4 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M11.9883 3.99609L3.99609 11.9883"
                    stroke="#0A0A0A"
                    strokeWidth="1.33203"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3.99609 3.99609L11.9883 11.9883"
                    stroke="#0A0A0A"
                    strokeWidth="1.33203"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Product Details */}
            <div className="px-6 pb-6 flex flex-col gap-4">
              <div className="flex flex-col gap-3 p-4 rounded-lg bg-[#F8FAFC] border border-black/5">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <p className="text-[#45556C] text-xs leading-4 font-normal">
                      Product Name
                    </p>
                    <p className="text-[#0A0A0A] text-sm leading-5 font-normal">
                      {productToDelete.name}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <p className="text-[#45556C] text-xs leading-4 font-normal">
                      Strength
                    </p>
                    <p className="text-[#0A0A0A] text-sm leading-5 font-normal">
                      {productToDelete.strength}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <p className="text-[#45556C] text-xs leading-4 font-normal">
                      Category
                    </p>
                    <p className="text-[#0A0A0A] text-sm leading-5 font-normal">
                      {productToDelete.category}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <p className="text-[#45556C] text-xs leading-4 font-normal">
                      Stock
                    </p>
                    <p className="text-[#0A0A0A] text-sm leading-5 font-normal">
                      {productToDelete.stock} pcs
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#FEE2E2] border border-[#FCA5A5]">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="flex-shrink-0 mt-0.5"
                >
                  <path
                    d="M8 14.6666C11.6819 14.6666 14.6667 11.6819 14.6667 7.99998C14.6667 4.31808 11.6819 1.33331 8 1.33331C4.3181 1.33331 1.33333 4.31808 1.33333 7.99998C1.33333 11.6819 4.3181 14.6666 8 14.6666Z"
                    stroke="#991B1B"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 5.33331V7.99998"
                    stroke="#991B1B"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 10.6667H8.00667"
                    stroke="#991B1B"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-[#991B1B] text-sm leading-5 font-normal">
                  This action cannot be undone. The product will be permanently deleted.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 pb-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                className="px-4 h-9 flex items-center justify-center rounded-lg border border-black/10 bg-white text-[#0A0A0A] text-sm leading-5 font-normal hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
               onClick={() => handleDeleteProduct(product)}
                  className="px-4 h-9 flex items-center justify-center rounded-lg bg-[#E7000B] text-white text-sm leading-5 font-normal hover:bg-[#B80009] transition-colors"
                                    >
                    Delete Product
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
