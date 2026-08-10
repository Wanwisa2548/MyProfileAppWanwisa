import { createContext, ReactNode, useContext, useEffect, useState } from "react";

// 🌐 ใช้ค่า API Base URL จาก environment ของ Expo ถ้ามี
const DEFAULT_API_BASE_URL = "http://localhost:3038/api/products";
const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, "");
const API_BASE_URL = configuredApiBaseUrl && configuredApiBaseUrl.length > 0
  ? configuredApiBaseUrl.endsWith("/api/products")
    ? configuredApiBaseUrl
    : `${configuredApiBaseUrl}/api/products`
  : DEFAULT_API_BASE_URL;

export type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  oldPrice: number | null;
  rating: number;
  category: string;
  image: string;
};

export type Role = "admin" | "user";

export type User = {
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

type AppContextType = {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  register: (username: string, email: string, password: string, role?: string) => boolean;
  products: Product[];
  addProduct: (product: Omit<Product, "id">) => Promise<void>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  cart: CartItem[];
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  cartTotal: number;
  cartCount: number;
  checkout: () => Receipt | null;
  receipts: Receipt[];
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  fetchProducts: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const MOCK_USERS = [
  { username: "admin", password: "1234", email: "admin@plugtech.com", role: "admin" as Role }
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState(MOCK_USERS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // 🌐 1. ดึงข้อมูลสินค้าจาก Express Backend บน Cloud
  const fetchProducts = async () => {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const rawData = await response.json();
      
      // รองรับทั้งแบบ Array ตรงๆ และแบบ { data: [...] }
      const items = Array.isArray(rawData) ? rawData : (rawData?.data || []);

      const formattedProducts: Product[] = items.map((p: Record<string, unknown>) => ({
        id: String(p.id ?? ""),
        name: String(p.name ?? ""),
        brand: String(p.brand ?? ""),
        price: Number(p.price ?? 0),
        oldPrice: p.oldPrice !== null && p.oldPrice !== undefined ? Number(p.oldPrice) : null,
        rating: p.rating !== null && p.rating !== undefined ? Number(p.rating) : 5,
        category: String(p.category ?? "General"),
        image: String(p.image ?? ""),
      }));

      setProducts(formattedProducts);
    } catch (err) {
      console.error("Error fetching products from Backend API:", err);
    }
  };

  // 🔄 เรียกดึงข้อมูลเมื่อเปิดแอป
  useEffect(() => {
    fetchProducts();
  }, []);

  const login = (username: string, password: string) => {
    const cleanUser = username.trim();
    const cleanPass = password.trim();
    const found = users.find((u) => u.username === cleanUser && u.password === cleanPass);
    if (found) {
      setUser({ username: found.username, email: found.email, role: found.role });
      return true;
    }
    return false;
  };

  const register = (username: string, email: string, password: string, role: string = "user") => {
    const cleanUser = username.trim();
    if (users.some((u) => u.username === cleanUser)) return false;

    const assignedRole: Role = role === "admin" ? "admin" : "user";
    const newUser = { username: cleanUser, email: email.trim(), password: password.trim(), role: assignedRole };
    
    setUsers((prev) => [...prev, newUser]);
    setUser({ username: cleanUser, email: email.trim(), role: assignedRole });
    return true;
  };

  const logout = () => {
    setUser(null);
    setCart([]);
  };

  // ➕ 2. เพิ่มสินค้าผ่าน POST Request
  const addProduct = async (product: Omit<Product, "id">) => {
    try {
      const payload = {
        ...product,
        price: Number(product.price),
        oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
        rating: Number(product.rating || 5),
      };

      console.log("Sending POST request to add product:", payload);

      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorRes = await response.json().catch(() => ({}));
        throw new Error(errorRes.error || `Failed to add product (${response.status})`);
      }

      // โหลดข้อมูลล่าสุดจาก DB อีกครั้ง
      await fetchProducts();
    } catch (err) {
      console.error("Error adding product via Backend API:", err);
      throw err;
    }
  };

  // ✏️ 3. แก้ไขสินค้าผ่าน PUT Request
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

      console.log(`Sending PUT request to: ${API_BASE_URL}/${id}`);

      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorRes = await response.json().catch(() => ({}));
        throw new Error(errorRes.error || `Failed to update product (${response.status})`);
      }

      await fetchProducts();
    } catch (err) {
      console.error("Error updating product via Backend API:", err);
      throw err;
    }
  };

  // 🔴 4. ลบสินค้าผ่าน DELETE Request
  const deleteProduct = async (id: string) => {
    try {
      const targetId = String(id);
      console.log(`Sending DELETE request to: ${API_BASE_URL}/${targetId}`);

      const response = await fetch(`${API_BASE_URL}/${targetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorRes = await response.json().catch(() => ({}));
        throw new Error(errorRes.error || `Failed to delete product (${response.status})`);
      }

      setProducts((prev) => prev.filter((p) => String(p.id) !== targetId));
      setCart((prev) => prev.filter((c) => String(c.productId) !== targetId));
    } catch (err) {
      console.error("Error deleting product via Backend API:", err);
      throw err;
    }
  };

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

  const toggleFavorite = (productId: string) => {
    const idStr = String(productId);
    setFavorites((prev) =>
      prev.includes(idStr) ? prev.filter((f) => f !== idStr) : [...prev, idStr]
    );
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        cartTotal,
        cartCount,
        checkout,
        receipts,
        favorites,
        toggleFavorite,
        fetchProducts,
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