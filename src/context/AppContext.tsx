import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase"; // 🔌 ดึงตัวเชื่อมต่อจากไฟล์ supabase.ts ที่เราสร้างไว้

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
export type User = { username: string; email: string; role: Role };
export type CartItem = { productId: string; quantity: number };
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
  addProduct: (product: Omit<Product, "id">) => Promise<void>; // ✨ ปรับให้เป็น Async
  deleteProduct: (id: string) => Promise<void>; // ✨ ปรับให้เป็น Async
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
  fetchProducts: () => Promise<void>; // 🌐 เพิ่มฟังก์ชันสำหรับดึงข้อมูลใหม่
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const MOCK_USERS = [{ username: "admin", password: "1234", email: "admin@plugtech.com", role: "admin" as Role }];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]); // ✨ เริ่มต้นเป็นอาเรย์ว่างเพื่อรอโหลดจาก Supabase
  const [users, setUsers] = useState(MOCK_USERS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // 🌐 1. ฟังก์ชันดึงข้อมูลสินค้าทั้งหมดมาจาก Supabase
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false }); // สินค้าใหม่ล่าสุดขึ้นก่อน

      if (error) throw error;

      if (data) {
        // แปลงค่า id ใน db ให้เป็น string เสมอเพื่อให้สอดคล้องกับประเภทข้อมูลในแอปของหนู
        const formattedProducts: Product[] = data.map((p: any) => ({
          id: String(p.id),
          name: p.name,
          brand: p.brand,
          price: Number(p.price),
          oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
          rating: p.rating ? Number(p.rating) : 0,
          category: p.category,
          image: p.image,
        }));
        setProducts(formattedProducts);
      }
    } catch (err) {
      console.error("Error fetching products from Supabase:", err);
    }
  };

  // 🔄 เรียกดึงข้อมูลสินค้าจริงทันทีที่เปิดแอปพลิเคชัน
  useEffect(() => {
    fetchProducts();
  }, []);

  const login = (username: string, password: string) => {
    const found = users.find((u) => u.username === username && u.password === password);
    if (found) { setUser({ username: found.username, email: found.email, role: found.role }); return true; }
    return false;
  };

  const register = (username: string, email: string, password: string, role: string = "user") => {
    if (users.some((u) => u.username === username)) return false;
    const assignedRole: Role = role === "admin" ? "admin" : "user";
    setUsers((prev) => [...prev, { username, email, password, role: assignedRole }]);
    setUser({ username, email, role: assignedRole });
    return true;
  };

  const logout = () => { setUser(null); setCart([]); };

  // ➕ 2. ปรับปรุงฟังก์ชันเพิ่มสินค้าให้บันทึกลงฐานข้อมูล Supabase จริงๆ
  const addProduct = async (product: Omit<Product, "id">) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .insert([product])
        .select(); // ดึงข้อมูลแถวที่เพิ่มสำเร็จกลับมาด้วยเพื่อเอา id จริง

      if (error) throw error;

      if (data && data[0]) {
        const newProduct: Product = {
          ...product,
          id: String(data[0].id),
        };
        setProducts((prev) => [newProduct, ...prev]);
      }
    } catch (err) {
      console.error("Error adding product to Supabase:", err);
    }
  };

  // 🔴 3. ปรับปรุงฟังก์ชันลบสินค้าให้ลบออกจาก Supabase จริงๆ
  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // เมื่อบน Cloud ลบสำเร็จ ให้เคลียร์ข้อมูลหน้าจอตาม
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setCart((prev) => prev.filter((c) => c.productId !== id));
    } catch (err) {
      console.error("Error deleting product from Supabase:", err);
    }
  };

  const addToCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === productId);
      if (existing) return prev.map((c) => (c.productId === productId ? { ...c, quantity: c.quantity + 1 } : c));
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setCart((prev) => prev.map((c) => (c.productId === productId ? { ...c, quantity } : c)));
  };

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const cartTotal = cart.reduce((sum, c) => {
    const p = products.find((p) => p.id === c.productId);
    return sum + (p ? p.price * c.quantity : 0);
  }, 0);

  const checkout = (): Receipt | null => {
    if (cart.length === 0) return null;
    const items = cart.map((c) => {
      const p = products.find((p) => p.id === c.productId);
      return { name: p?.name ?? "สินค้าไม่ทราบชื่อ", price: p?.price ?? 0, quantity: c.quantity };
    });
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const receipt: Receipt = { id: Date.now().toString(), date: new Date().toLocaleString("th-TH"), items, total };
    setReceipts((prev) => [receipt, ...prev]);
    setCart([]);
    return receipt;
  };

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => (prev.includes(productId) ? prev.filter((f) => f !== productId) : [...prev, productId]));
  };

  return (
    <AppContext.Provider
      value={{
        user, login, logout, register,
        products, addProduct, deleteProduct,
        cart, addToCart, removeFromCart, updateQuantity, cartTotal, cartCount, checkout, receipts,
        favorites, toggleFavorite, fetchProducts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}