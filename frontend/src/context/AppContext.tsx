import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { showAlert } from "../utils/crossPlatformAlert";

// 🌐 ใช้ค่า API Base URL จาก environment ของ Expo ถ้ามี
const DEFAULT_API_ORIGIN = "http://119.59.102.161:3038";
const configuredApiOrigin = process.env.EXPO_PUBLIC_API_BASE_URL?.trim()
  .replace(/\/$/, "")
  .replace(/\/api(?:\/products)?$/, "");
const API_ORIGIN = configuredApiOrigin || DEFAULT_API_ORIGIN;
const API_BASE_URL = `${API_ORIGIN}/api/products`;
const AUTH_API_BASE_URL = `${API_ORIGIN}/api/auth`;
const ADMIN_API_BASE_URL = `${API_ORIGIN}/api/admin/products`;

export type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  oldPrice: number | null;
  rating: number;
  stock: number;
  category: string;
  image: string;
  isActive: boolean;
};

// สินค้าที่มีสต็อกเหลือน้อยกว่าหรือเท่ากับจำนวนนี้จะถูกนับว่า "ใกล้หมด"
export const LOW_STOCK_THRESHOLD = 5;

export type Role = "admin" | "customer";

export type User = {
  id: string;
  username: string;
  email: string;
  role: Role;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type Receipt = {
  id: string;
  date: string;
  items: { name: string; price: number; quantity: number }[];
  total: number;
};

export type OrderDetails = {
  recipientName: string;
  phone: string;
  deliveryAddress: string;
  paymentSlip: string;
};

type AppContextType = {
  user: User | null;
  login: (username: string, password: string, role: Role, rememberMe: boolean) => Promise<void>;
  register: (username: string, email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => void;
  products: Product[];
  adminProducts: Product[];
  lowStockProducts: Product[];
  addProduct: (product: Omit<Product, "id" | "isActive"> & { isActive?: boolean }) => Promise<void>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductStatus: (id: string, isActive: boolean) => Promise<void>;
  cart: CartItem[];
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  cartTotal: number;
  cartCount: number;
  checkout: () => Receipt | null;
  placeOrder: (details: OrderDetails) => Promise<Receipt>;
  receipts: Receipt[];
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  fetchProducts: () => Promise<void>;
  fetchAdminProducts: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const SESSION_KEY = "papengie_auth_session";
const PRODUCT_CACHE_KEY = "papengie_product_cache";

// 📦 ระบบจัดเก็บข้อมูล session ปลอดภัยทั้งบน Web และ Mobile
const Storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      return typeof window !== "undefined" ? localStorage.getItem(key) : null;
    }
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const formatProducts = (rawData: unknown): Product[] => {
    const items = Array.isArray(rawData) ? rawData : ((rawData as { data?: unknown[] } | null)?.data || []);
    return items.map((p: Record<string, unknown>) => ({
      id: String(p.id ?? ""),
      name: String(p.name ?? ""),
      brand: String(p.brand ?? ""),
      price: Number(p.price ?? 0),
      oldPrice: p.oldPrice !== null && p.oldPrice !== undefined ? Number(p.oldPrice) : null,
      rating: p.rating !== null && p.rating !== undefined ? Number(p.rating) : 5,
      stock: Number(p.stock ?? 0),
      category: String(p.category ?? "General"),
      image: String(p.image ?? ""),
      isActive: p.is_active === 1 || p.is_active === true || p.is_active === "1",
    }));
  };

  // 🌐 1. ดึงข้อมูลสินค้าสำหรับลูกค้า
  // 🔎 ดึงสินค้าทั้งหมดจาก GET /api/products มาเก็บใน state `products`
  // state นี้คือแหล่งข้อมูลที่หน้า index.tsx เอาไปกรองด้วยช่องค้นหา (ดูฟังก์ชัน filteredProducts ที่นั่น)
  const fetchProducts = async () => {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const rawData = await response.json();
      
      const formattedProducts = formatProducts(rawData);
      setProducts(formattedProducts);
      await Storage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(formattedProducts));
    } catch (err) {
      const cachedProducts = await Storage.getItem(PRODUCT_CACHE_KEY);
      if (cachedProducts) {
        try {
          setProducts(JSON.parse(cachedProducts) as Product[]);
        } catch {
          await Storage.removeItem(PRODUCT_CACHE_KEY);
        }
      }
      console.warn("Product API is unavailable; displaying saved products when available.", err);
    }
  };

  // 🌐 2. ดึงข้อมูลสินค้าทั้งหมดสำหรับ Admin
  const fetchAdminProducts = async () => {
    try {
      const response = await fetch(ADMIN_API_BASE_URL, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (response.status === 401) {
        logout();
        showAlert("Session expired", "Please log in again.");
        return;
      }
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const rawData = await response.json();
      const items = Array.isArray(rawData) ? rawData : (rawData?.data || []);
      const formattedProducts: Product[] = items.map((p: Record<string, unknown>) => ({
        id: String(p.id ?? ""),
        name: String(p.name ?? ""),
        brand: String(p.brand ?? ""),
        price: Number(p.price ?? 0),
        oldPrice: p.oldPrice !== null && p.oldPrice !== undefined ? Number(p.oldPrice) : null,
        rating: p.rating !== null && p.rating !== undefined ? Number(p.rating) : 5,
        stock: Number(p.stock ?? 0),
        category: String(p.category ?? "General"),
        image: String(p.image ?? ""),
        isActive: p.is_active === 1 || p.is_active === true || p.is_active === "1",
      }));
      setAdminProducts(formattedProducts);
    } catch (err) {
      console.error("Error fetching products for admin inventory:", err);
    }
  };

  // 🔄 เรียกดึงข้อมูลเมื่อเปิดแอป
  useEffect(() => {
    void fetchProducts();
  }, []);

  // 🔐 โหลด Session ที่บันทึกไว้
  useEffect(() => {
    Storage.getItem(SESSION_KEY).then((savedSession) => {
      if (!savedSession) return;
      try {
        const { token, user: savedUser } = JSON.parse(savedSession) as { token: string; user: User };
        setAuthToken(token);
        setUser(savedUser);
      } catch {
        Storage.removeItem(SESSION_KEY);
      }
    });
  }, []);

  useEffect(() => {
    if (user?.role === "admin") fetchAdminProducts();
    else setAdminProducts([]);
  }, [user]);

  const authenticate = async (endpoint: "login" | "register", payload: Record<string, string>, rememberMe: boolean) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    let response: Response;
    try {
      response = await fetch(`${AUTH_API_BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (error) {
      if ((error as Error).name === "AbortError") throw new Error("The server did not respond. Please try again later.");
      throw new Error("Cannot connect to the authentication server. Please try again later.");
    } finally {
      clearTimeout(timeout);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `${endpoint === "login" ? "Login" : "Registration"} failed`);

    const authenticatedUser = data.user as User;
    setAuthToken(data.token);
    setUser(authenticatedUser);

    if (rememberMe) {
      await Storage.setItem(SESSION_KEY, JSON.stringify({ token: data.token, user: authenticatedUser }));
    } else {
      await Storage.removeItem(SESSION_KEY);
    }
  };

  const login = async (username: string, password: string, role: Role, rememberMe: boolean) => {
    await authenticate("login", { username: username.trim(), password, role }, rememberMe);
  };

  const register = async (username: string, email: string, password: string, rememberMe: boolean) => {
    await authenticate("register", { username: username.trim(), email: email.trim(), password }, rememberMe);
  };

  // 🚪 ฟังก์ชัน Logout
  const logout = () => {
    setUser(null);
    setAuthToken(null);
    Storage.removeItem(SESSION_KEY);
    setCart([]);
  };

  // ➕ เพิ่มสินค้า: เรียก POST /api/products (backend/server.js) ซึ่งจะ INSERT ลง database จริง
  const addProduct = async (product: Omit<Product, "id" | "isActive"> & { isActive?: boolean }) => {
    try {
      const payload = {
        ...product,
        ...(product.isActive !== undefined && { is_active: product.isActive }),
        price: Number(product.price),
        oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
        rating: Number(product.rating || 5),
      };

      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) 
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        logout();
        throw new Error("Your session has expired. Please log in again.");
      }
      if (!response.ok) {
        const errorRes = await response.json().catch(() => ({}));
        throw new Error(errorRes.error || `Failed to add product (${response.status})`);
      }

      await fetchProducts();
      await fetchAdminProducts();
    } catch (err) {
      console.error("Error adding product via Backend API:", err);
      throw err;
    }
  };

  // ✏️ แก้ไขสินค้า: เรียก PUT /api/products/:id (backend/server.js) ซึ่งจะ UPDATE แถวใน database จริง
  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const payload = {
        ...productData,
        ...(productData.price !== undefined && { price: Number(productData.price) }),
        ...(productData.oldPrice !== undefined && { 
          oldPrice: productData.oldPrice ? Number(productData.oldPrice) : null 
        }),
        ...(productData.rating !== undefined && { rating: Number(productData.rating) }),
      };

      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json", 
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) 
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        logout();
        throw new Error("Your session has expired. Please log in again.");
      }
      if (!response.ok) {
        const errorRes = await response.json().catch(() => ({}));
        throw new Error(errorRes.error || `Failed to update product (${response.status})`);
      }

      await fetchProducts();
      await fetchAdminProducts();
    } catch (err) {
      console.error("Error updating product via Backend API:", err);
      throw err;
    }
  };

  // 🔴 ลบสินค้า: เรียก DELETE /api/products/:id (backend/server.js) ซึ่งจะ DELETE แถวออกจาก database จริง
  const deleteProduct = async (id: string) => {
    try {
      const targetId = String(id);
      const response = await fetch(`${API_BASE_URL}/${targetId}`, {
        method: "DELETE",
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });

      if (response.status === 401) {
        logout();
        throw new Error("Your session has expired. Please log in again.");
      }
      if (!response.ok) {
        const errorRes = await response.json().catch(() => ({}));
        throw new Error(errorRes.error || `Failed to delete product (${response.status})`);
      }

      setProducts((prev) => prev.filter((p) => String(p.id) !== targetId));
      setAdminProducts((prev) => prev.filter((p) => String(p.id) !== targetId));
      setCart((prev) => prev.filter((c) => String(c.productId) !== targetId));
    } catch (err) {
      console.error("Error deleting product via Backend API:", err);
      throw err;
    }
  };

  // 🔄 สลับสถานะสินค้า เปิด/ปิด
  const toggleProductStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json", 
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) 
        },
        body: JSON.stringify({ is_active: isActive }),
      });
      if (response.status === 401) {
        logout();
        throw new Error("Your session has expired. Please log in again.");
      }
      if (!response.ok) {
        const errorRes = await response.json().catch(() => ({}));
        throw new Error(errorRes.error || `Failed to update product status (${response.status})`);
      }
      await Promise.all([fetchProducts(), fetchAdminProducts()]);
    } catch (err) {
      console.error("Error updating product status:", err);
      throw err;
    }
  };

  // 🛒 ตระกร้าสินค้า & รายการโปรด
  const addToCart = (productId: string) => {
    const idStr = String(productId);
    setCart((prev) => {
      const existing = prev.find((c) => String(c.productId) === idStr);
      if (existing) {
        return prev.map((c) =>
          String(c.productId) === idStr ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { productId: idStr, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    const idStr = String(productId);
    setCart((prev) => prev.filter((c) => String(c.productId) !== idStr));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const idStr = String(productId);
    if (quantity <= 0) {
      removeFromCart(idStr);
      return;
    }
    setCart((prev) =>
      prev.map((c) => (String(c.productId) === idStr ? { ...c, quantity } : c))
    );
  };

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const cartTotal = cart.reduce((sum, c) => {
    const p = products.find((p) => String(p.id) === String(c.productId));
    return sum + (p ? p.price * c.quantity : 0);
  }, 0);

  const checkout = (): Receipt | null => {
    if (cart.length === 0) return null;

    const items = cart.map((c) => {
      const p = products.find((p) => String(p.id) === String(c.productId));
      return {
        name: p?.name ?? "สินค้าไม่ทราบชื่อ",
        price: p?.price ?? 0,
        quantity: c.quantity,
      };
    });

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const receipt: Receipt = {
      id: Date.now().toString(),
      date: new Date().toLocaleString("th-TH"),
      items,
      total,
    };

    setReceipts((prev) => [receipt, ...prev]);
    setCart([]);
    return receipt;
  };

  const placeOrder = async (details: OrderDetails): Promise<Receipt> => {
    if (!authToken || !user) throw new Error("Please log in before placing an order.");
    if (!cart.length) throw new Error("Your cart is empty.");

    const response = await fetch(`${API_ORIGIN}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        ...details,
        paymentMethod: "bank_transfer",
        items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Could not place order (${response.status})`);

    const items = cart.map((item) => {
      const product = products.find((entry) => String(entry.id) === String(item.productId));
      return { name: product?.name ?? "Unknown product", price: product?.price ?? 0, quantity: item.quantity };
    });
    const receipt: Receipt = {
      id: String(data.order?.id ?? Date.now()),
      date: new Date().toLocaleString("th-TH"),
      items,
      total: Number(data.order?.total ?? items.reduce((sum, item) => sum + item.price * item.quantity, 0)),
    };
    setReceipts((prev) => [receipt, ...prev]);
    setCart([]);
    await fetchProducts();
    return receipt;
  };

  const toggleFavorite = (productId: string) => {
    const idStr = String(productId);
    setFavorites((prev) =>
      prev.includes(idStr) ? prev.filter((f) => f !== idStr) : [...prev, idStr]
    );
  };

  // ⚠️ สินค้าที่ยังเปิดขายอยู่และสต็อกใกล้หมด สำหรับแจ้งเตือนแอดมิน
  const lowStockProducts = useMemo(
    () => adminProducts.filter((p) => p.isActive && p.stock <= LOW_STOCK_THRESHOLD),
    [adminProducts]
  );

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        products,
        adminProducts,
        lowStockProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductStatus,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        cartTotal,
        cartCount,
        checkout,
        placeOrder,
        receipts,
        favorites,
        toggleFavorite,
        fetchProducts,
        fetchAdminProducts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within AppProvider");
  }
  return ctx;
}
