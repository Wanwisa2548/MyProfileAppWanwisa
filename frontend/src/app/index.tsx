import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useApp } from "../context/AppContext";

const CATEGORIES = ["All", "Power Strips", "Smart Plugs", "Adapters"];

export default function Index() {
  const { products, cart, addToCart, updateQuantity, cartCount, favorites, toggleFavorite, user } = useApp();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  if (!user) {
    return (
      <SafeAreaView style={styles.lockedContainer}>
        <Ionicons name="lock-closed" size={64} color="#2563EB" />
        <Text style={styles.lockedTitle}>Please log in before accessing the site.</Text>
        <Text style={styles.lockedSubtitle}>You need to log in to browse and manage power plug products.</Text>
        <TouchableOpacity style={styles.goToLoginBtn} onPress={() => router.push("/login")}>
          <Text style={styles.goToLoginBtnText}>Go to the login page.</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.price.toString().includes(q);
    return matchesCategory && matchesSearch;
  });

  const formatPrice = (n: number) => `฿${n.toLocaleString()}`;
  const getQty = (id: string) => cart.find((c) => c.productId === id)?.quantity ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Menu */}
      <View style={styles.topMenu}>
        <View>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Ionicons name="flash" size={14} color="#fff" />
            </View>
            <Text style={styles.title}>Papengie</Text>
          </View>
          <View style={styles.userRow}>
            <Text style={styles.userHello}>hello: {user.username} ({user.role === "admin" ? "💻 Admin" : "🛒 Customer"})</Text>
            {user.role === "admin" && (
              <View style={{ flexDirection: "row", gap: 6 }}>
                <TouchableOpacity style={styles.dashboardBtn} onPress={() => router.push("/admin-dashboard")}>
                  <Text style={styles.dashboardBtnText}>Dashboard 📊</Text>
                </TouchableOpacity>
                {/* ⚙️ ปุ่มไปหน้าจัดการสินค้าเพื่อลบ/แก้ไข */}
                <TouchableOpacity style={styles.manageBtn} onPress={() => router.push("/admin-products")}>
                  <Text style={styles.dashboardBtnText}>Manage ⚙️</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/cart")}>
          <Ionicons name="cart-outline" size={24} color="#0F1E33" />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={20} color="#5B6B85" />
        <TextInput
          style={styles.searchInput}
          placeholder="Find power outlets, smart plugs..."
          placeholderTextColor="#8A97AC"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category Horizontal Selector */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product Grid */}
      <ScrollView style={styles.productContainer} contentContainerStyle={styles.productGrid}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flash-outline" size={56} color="#E2E9F5" />
            <Text style={styles.emptyText}>No products found matching your search.</Text>
          </View>
        ) : (
          filteredProducts.map((p) => {
            const qty = getQty(p.id);
            const isFav = favorites.includes(p.id);
            return (
              <View key={p.id} style={styles.card}>
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: p.image }} style={styles.image} resizeMode="contain" />
                  
                  {/* ปุ่ม Favorite */}
                  <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(p.id)}>
                    <Ionicons name={isFav ? "heart" : "heart-outline"} size={18} color={isFav ? "#DC2626" : "#5B6B85"} />
                  </TouchableOpacity>

                  {p.oldPrice && (
                    <View style={styles.discountTag}>
                      <Text style={styles.discountText}>-{Math.round((1 - p.price / p.oldPrice) * 100)}%</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.brand}>{p.brand}</Text>
                <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color="#eab308" />
                  <Text style={styles.ratingText}>{p.rating}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{formatPrice(p.price)}</Text>
                  {p.oldPrice && <Text style={styles.oldPrice}>{formatPrice(p.oldPrice)}</Text>}
                </View>

                {qty === 0 ? (
                  <TouchableOpacity style={styles.addButton} onPress={() => addToCart(p.id)}>
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text style={styles.addButtonText}>Add to cart</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.stepper}>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => updateQuantity(p.id, qty - 1)}>
                      <Ionicons name="remove" size={14} color="#1D4ED8" />
                    </TouchableOpacity>
                    <Text style={styles.stepperQty}>{qty}</Text>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => updateQuantity(p.id, qty + 1)}>
                      <Ionicons name="add" size={14} color="#1D4ED8" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" },
  topMenu: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, backgroundColor: "#F4F7FC" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoBadge: { width: 26, height: 26, borderRadius: 8, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center" },
  title: { color: "#0A1830", fontSize: 19, fontWeight: "800", letterSpacing: 0.2 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  userHello: { fontSize: 12, color: "#5B6B85" },
  dashboardBtn: { backgroundColor: "#1B3A66", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  manageBtn: { backgroundColor: "#2563EB", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  dashboardBtnText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  iconButton: { position: "relative", padding: 4 },
  badge: { position: "absolute", top: -2, right: -2, backgroundColor: "#2563EB", borderRadius: 10, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  searchWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 16, paddingHorizontal: 16, height: 46, borderRadius: 14, gap: 10, borderWidth: 1, borderColor: "#E2E9F5" },
  searchInput: { flex: 1, fontSize: 15, color: "#0F1E33" },
  categoryContainer: { marginTop: 12, height: 46, justifyContent: 'center' },
  categoryChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 24, backgroundColor: "#fff", marginRight: 10, borderWidth: 1, borderColor: "#E2E9F5" },
  categoryChipActive: { backgroundColor: "#38BDF8", borderColor: "#38BDF8" },
  categoryText: { color: "#5B6B85", fontSize: 14, fontWeight: "600" },
  categoryTextActive: { color: "#fff", fontWeight: "700" },
  productContainer: { marginTop: 10, paddingHorizontal: 12 },
  productGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8, paddingBottom: 32 },
  card: { width: "48%", backgroundColor: "#fff", borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: "#EAF1FB" },
  imageWrapper: { position: "relative", backgroundColor: "#F4F7FC", borderRadius: 12, padding: 8, overflow: "hidden" },
  image: { width: "100%", height: 160, borderRadius: 8 },
  favoriteButton: { position: "absolute", top: 8, right: 8, backgroundColor: "#fff", borderRadius: 16, padding: 6 },
  discountTag: { position: "absolute", bottom: 8, left: 8, backgroundColor: "#DC2626", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  discountText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  brand: { fontSize: 11, color: "#8A97AC", textTransform: "uppercase", fontWeight: "600", marginTop: 8 },
  productName: { fontSize: 14, fontWeight: "700", color: "#0F1E33", marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  ratingText: { fontSize: 12, color: "#5B6B85", fontWeight: "500" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 6 },
  price: { color: "#2563EB", fontWeight: "800", fontSize: 16 },
  oldPrice: { color: "#E2E9F5", fontSize: 12, textDecorationLine: "line-through" },
  addButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#2563EB", borderRadius: 10, paddingVertical: 10, marginTop: 12, gap: 4 },
  addButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#EAF1FB", borderRadius: 10, marginTop: 12, paddingVertical: 4, paddingHorizontal: 4 },
  stepperBtn: { padding: 6, backgroundColor: "#fff", borderRadius: 8 },
  stepperQty: { color: "#1D4ED8", fontWeight: "800", fontSize: 14 },
  emptyState: { width: "100%", alignItems: "center", justifyContent: "center", marginTop: 80 },
  emptyText: { color: "#8A97AC", fontSize: 15 },
  lockedContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, backgroundColor: "#F4F7FC" },
  lockedTitle: { fontSize: 20, fontWeight: "700", color: "#0F1E33", marginTop: 16 },
  lockedSubtitle: { fontSize: 14, color: "#5B6B85", textAlign: "center", marginBottom: 32 },
  goToLoginBtn: { backgroundColor: "#2563EB", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  goToLoginBtnText: { color: "#fff", fontWeight: "700" },
});