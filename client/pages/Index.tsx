import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { ProductCard } from "../components/ProductCard";
import { CategorySection } from "../components/CategorySection";
import { useToast } from "../hooks/use-toast";
import {
  getOrInitializeProducts,
  updateProductStock,
  type Product as StoredProduct,
} from "../lib/products";
import { getOrInitializeCategories } from "../lib/categories";

interface DisplayProduct {
  name: string;
  strength: string;
  available: number;
  multipleOf: number;
}

export default function Index() {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>(
    {},
  );
  const [customerInfo, setCustomerInfo] = useState({
    fullName: "",
    storeName: "",
    email: "",
    phone: "",
  });
  const [showValidation, setShowValidation] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [allProducts, setAllProducts] = useState<StoredProduct[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<
    Record<string, DisplayProduct[]>
  >({});
  const [resetTrigger, setResetTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [strengthFilter, setStrengthFilter] = useState("All Strengths");
  const [allStrengths, setAllStrengths] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load categories and products from API
    const loadData = async () => {
      const allCategories = await getOrInitializeCategories();
      const products = await getOrInitializeProducts();

      setAllProducts(products);
      setCategories(allCategories);

      // Get all unique strengths
      const strengths = Array.from(
        new Set(products.map((p) => p.strength)),
      ).sort((a, b) => {
        const aNum = parseFloat(a);
        const bNum = parseFloat(b);
        return aNum - bNum;
      });
      setAllStrengths(strengths);

      // Group products by category
      const grouped: Record<string, DisplayProduct[]> = {};
      allCategories.forEach((category) => {
        grouped[category] = products
          .filter((p) => p.category === category)
          .map((p) => ({
            name: p.name,
            strength: p.strength,
            available: p.stock,
            multipleOf: p.multipleOf,
          }));
      });

      setProductsByCategory(grouped);
    };

    loadData();

    // Poll for stock updates every 30 seconds
    const pollInterval = setInterval(loadData, 30000);
    return () => clearInterval(pollInterval);
  }, []);

  const handleProductSelect = (productId: string, quantity: number) => {
    setSelectedItems((prev) => {
      if (quantity === 0) {
        const newItems = { ...prev };
        delete newItems[productId];
        return newItems;
      }
      return { ...prev, [productId]: quantity };
    });
  };

  const totalItems = Object.values(selectedItems).reduce(
    (sum, qty) => sum + qty,
    0,
  );
  const isFormValid =
    customerInfo.fullName &&
    customerInfo.storeName &&
    customerInfo.email &&
    customerInfo.phone &&
    totalItems > 0;


  // Filter products based on search, category, and strength
  const filteredProducts = (categoryName: string): DisplayProduct[] => {
    return allProducts
      .filter((p) => {
        // Category filter
        if (
          categoryFilter !== "All Categories" &&
          p.category !== categoryFilter
        ) {
          return false;
        }
        // Strength filter
        if (
          strengthFilter !== "All Strengths" &&
          p.strength !== strengthFilter
        ) {
          return false;
        }
        // Search query filter
        if (
          searchQuery &&
          !p.name.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        // Category must match the current section
        if (p.category !== categoryName) {
          return false;
        }
        return true;
      })
      .map((p) => ({
        name: p.name,
        strength: p.strength,
        available: p.stock,
        multipleOf: p.multipleOf,
      }));
  };

  const refreshProducts = async () => {
    try {
      const products = await getOrInitializeProducts();
      setAllProducts(products);

      // Group products by category
      const grouped: Record<string, DisplayProduct[]> = {};
      categories.forEach((category) => {
        grouped[category] = products
          .filter((p) => p.category === category)
          .map((p) => ({
            name: p.name,
            strength: p.strength,
            available: p.stock,
            multipleOf: p.multipleOf,
          }));
      });

      setProductsByCategory(grouped);
    } catch (error) {
      console.error("Error refreshing products:", error);
    }
  };

 

  const submitOrder = async () => {
    // Map selected items to product details
    const orderItems = Object.entries(selectedItems).map(
      ([productId, quantity]) => {
        const product = allProducts.find((p) => p.id === productId);
        return {
          id: productId,
          name: product?.name || "",
          strength: product?.strength || "",
          quantity,
        };
      },
    );

    // Generate order number with timestamp-based uniqueness
    const timestamp = new Date();
    const orderNumber = `ORD-${timestamp.getTime()}`;

    // Create new order
    const newOrder = {
      orderNumber,
      customerName: customerInfo.fullName,
      storeName: customerInfo.storeName,
      email: customerInfo.email,
      phone: customerInfo.phone,
      items: orderItems,
      timestamp: timestamp.toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
    };

    try {
      // Send order to API
      const apiUrl = '/api/orders';

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newOrder),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Order submitted successfully:", result);
        toast({
          title: "Order submitted successfully!",
        });

        // Clear form after successful order
        setSelectedItems({});
        setCustomerInfo({
          fullName: "",
          storeName: "",
          email: "",
          phone: "",
        });
        setShowValidation(false);
        setResetTrigger((prev) => prev + 1);

        // Refresh product stock from D1 to show updated availability
        await refreshProducts();
      } else {
        console.error(
          "Failed to submit order: Server returned",
          response.status,
        );
        toast({
          title: "Error submitting order",
          description: "Please try again later.",
        });
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      toast({
        title: "Error submitting order",
        description: "Please check your connection and try again.",
      });
    }
  };

  const handleSubmitOrder = async () => {
    setShowValidation(true);

    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await submitOrder();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-1 bg-[#F8FAFC] px-6 pt-8 pb-8">
        <div className="max-w-[940px] mx-auto flex flex-col gap-8">
          {/* Brand Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center gap-3 h-10">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path
                  d="M18.3333 36.2167C18.8401 36.5092 19.4149 36.6633 20 36.6633C20.5851 36.6633 21.1599 36.5092 21.6667 36.2167L33.3333 29.55C33.8396 29.2577 34.26 28.8375 34.5526 28.3314C34.8451 27.8253 34.9994 27.2512 35 26.6667V13.3333C34.9994 12.7488 34.8451 12.1747 34.5526 11.6686C34.26 11.1625 33.8396 10.7423 33.3333 10.45L21.6667 3.78334C21.1599 3.49077 20.5851 3.33675 20 3.33675C19.4149 3.33675 18.8401 3.49077 18.3333 3.78334L6.66667 10.45C6.16044 10.7423 5.73997 11.1625 5.44744 11.6686C5.1549 12.1747 5.0006 12.7488 5 13.3333V26.6667C5.0006 27.2512 5.1549 27.8253 5.44744 28.3314C5.73997 28.8375 6.16044 29.2577 6.66667 29.55L18.3333 36.2167Z"
                  stroke="#009966"
                  strokeWidth="3.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 36.6667V20"
                  stroke="#009966"
                  strokeWidth="3.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.48334 11.6667L20 20L34.5167 11.6667"
                  stroke="#009966"
                  strokeWidth="3.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12.5 7.11666L27.5 15.7"
                  stroke="#009966"
                  strokeWidth="3.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-[#009966] text-base leading-6 font-normal text-center">
                NEXPOINT
              </div>
            </div>
            <p className="text-[#45556C] text-base leading-6 font-normal text-center">
              Order in multiples of 5 or 10 individual tins (pcs) per flavour.
              Stock limits apply.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search flavours..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-10 pr-3 py-1 rounded-lg bg-[#F3F3F5] border border-transparent text-sm placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#009966]/20"
              />
              <svg
                className="absolute left-3 top-2.5 w-4 h-4"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M14 14L11.1067 11.1067"
                  stroke="#90A1B9"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
                  stroke="#90A1B9"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <select
              value={categoryFilter || "All Categories"}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="flex-1 h-9 px-3 rounded-lg bg-[#F3F3F5] border border-transparent text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#009966]/20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='0.5'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23717182' stroke-width='1.33333' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                paddingRight: "40px",
              }}
            >
              <option value="All Categories">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={strengthFilter || "All Strengths"}
              onChange={(e) => setStrengthFilter(e.target.value)}
              className="flex-1 h-9 px-3 rounded-lg bg-[#F3F3F5] border border-transparent text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#009966]/20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='0.5'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23717182' stroke-width='1.33333' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                paddingRight: "40px",
              }}
            >
              <option value="All Strengths">All Strengths</option>
              {allStrengths.map((strength) => (
                <option key={strength} value={strength}>
                  {strength}
                </option>
              ))}
            </select>
          </div>

          {/* Product Sections */}
          <div className="flex flex-col gap-4">
            {categories
              .filter((category) => {
                // Hide category if no products match the filters
                const productsInCategory = filteredProducts(category);
                if (
                  categoryFilter !== "All Categories" &&
                  categoryFilter !== category
                ) {
                  return false;
                }
                return productsInCategory.length > 0;
              })
              .map((category, categoryIndex) => {
                const categoryProducts = filteredProducts(category);
                const allProductsInCategory = getOrInitializeProducts().filter(
                  (p) => p.category === category,
                );

                return (
                  <CategorySection
                    key={category}
                    title={category}
                    count={allProductsInCategory.length}
                    defaultOpen={true}
                  >
                    {getOrInitializeProducts()
                      .filter((p) => p.category === category)
                      .filter((p) => {
                        if (
                          strengthFilter !== "All Strengths" &&
                          p.strength !== strengthFilter
                        ) {
                          return false;
                        }
                        if (
                          searchQuery &&
                          !p.name
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                        ) {
                          return false;
                        }
                        return true;
                      })
                      .map((product) => (
                        <ProductCard
                          key={product.id}
                          name={product.name}
                          strength={product.strength}
                          available={product.stock}
                          multipleOf={product.multipleOf}
                          onSelect={(qty) =>
                            handleProductSelect(product.id, qty)
                          }
                          resetTrigger={resetTrigger}
                        />
                      ))}
                  </CategorySection>
                );
              })}
          </div>

          {/* Customer Information */}
          <div className="flex flex-col gap-4 p-10 pb-8 border border-[#E2E8F0] rounded-[10px] bg-white">
            <h2 className="text-[#0F172B] text-base leading-6 font-normal">
              Customer Information
            </h2>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#0A0A0A] text-sm leading-[14px] font-normal">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={customerInfo.fullName}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    className="h-9 px-3 py-1 rounded-lg bg-[#F3F3F5] border border-transparent text-sm placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#009966]/20"
                  />
                  {showValidation && !customerInfo.fullName && (
                    <span className="text-red-500 text-sm leading-[14px]">
                      Information Required
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[#0A0A0A] text-sm leading-[14px] font-normal">
                    Store Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter store name"
                    value={customerInfo.storeName}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        storeName: e.target.value,
                      }))
                    }
                    className="h-9 px-3 py-1 rounded-lg bg-[#F3F3F5] border border-transparent text-sm placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#009966]/20"
                  />
                  {showValidation && !customerInfo.storeName && (
                    <span className="text-red-500 text-sm leading-[14px]">
                      Information Required
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#0A0A0A] text-sm leading-[14px] font-normal">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={customerInfo.email}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="h-9 px-3 py-1 rounded-lg bg-[#F3F3F5] border border-transparent text-sm placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#009966]/20"
                  />
                  {showValidation && !customerInfo.email && (
                    <span className="text-red-500 text-sm leading-[14px]">
                      Information Required
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[#0A0A0A] text-sm leading-[14px] font-normal">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="h-9 px-3 py-1 rounded-lg bg-[#F3F3F5] border border-transparent text-sm placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#009966]/20"
                  />
                  {showValidation && !customerInfo.phone && (
                    <span className="text-red-500 text-sm leading-[14px]">
                      Information Required
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Section */}
          <div className="flex items-center justify-between h-12">
            <span className="text-[#45556C] text-base leading-6 font-normal">
              {totalItems === 0
                ? "No items selected"
                : `${totalItems} items selected`}
            </span>
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || (showValidation && !isFormValid)}
              className={`px-8 h-12 rounded-lg text-white text-sm leading-5 font-normal transition-all ${isSubmitting
                  ? "bg-[#009966] opacity-50 cursor-not-allowed"
                  : showValidation && !isFormValid
                    ? "bg-[#009966] opacity-50 cursor-not-allowed"
                    : "bg-[#009966] hover:bg-[#007a52] cursor-pointer"
                }`}
            >
              {isSubmitting ? "Submitting..." : "Submit Order"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
