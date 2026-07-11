import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useApp } from "../context/AppContext";

const CATEGORIES = ["All", "Power Strips", "Smart Plugs", "Adapters"];

export default function Index() {
  const { products, cart, addToCart, updateQuantity, cartCount, favorites, toggleFavorite, user, deleteProduct } = useApp();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // 🔒 GUARD: บังคับให้อยู่หน้า Login ก่อน
  if (!user) {
    return (
      <SafeAreaView style={styles.lockedContainer}>
        <Ionicons name="lock-closed" size={64} color="#0284c7" />
        <Text style={styles.lockedTitle}>Please log in before accessing the site.</Text>
        <Text style={styles.lockedSubtitle}>You need to log in to browse and manage power plug products.</Text>
        <TouchableOpacity style={styles.goToLoginBtn} onPress={() => router.push("/login")}>
          <Text style={styles.goToLoginBtnText}>Go to the Keyword login page.</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const q = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const formatPrice = (n: number) => `฿${n.toLocaleString()}`;
  const getQty = (id: string) => cart.find((c) => c.productId === id)?.quantity ?? 0;

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Confirm item deletion",
      `Do you want to delete the item "${name}" logged out??`,
      [
        { text: "cancel", style: "cancel" },
        { 
          text: "Remove product", 
          style: "destructive", 
          onPress: () => {
            if (deleteProduct) {
              deleteProduct(id);
              Alert.alert("Successful", "Item successfully removed.");
            } else {
              Alert.alert("Notification", "Please bind the deleteProduct function in the AppContext first.");
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Menu / Navigation Bar */}
      <View style={styles.topMenu}>
        <View>
          <Text style={styles.title}>PAPENGIE GROUP</Text>
          <View style={styles.userRow}>
            <Text style={styles.userHello}>hello: {user.username} ({user.role === "admin" ? "💻 Admin" : "🛒 Customer"})</Text>
            
            {user.role === "admin" && (
              <TouchableOpacity 
                style={styles.dashboardBtn}
                onPress={() => router.push("/admin-dashboard")}
              >
                <Text style={styles.dashboardBtnText}>View the dashboard. 📊</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/cart")}>
          <Ionicons name="cart-outline" size={24} color="#0f172a" />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={20} color="#64748b" />
        <TextInput 
          style={styles.searchInput} 
          placeholder="Find power outlets, smart plugs..." 
          placeholderTextColor="#94a3b8" 
          value={search} 
          onChangeText={setSearch} 
        />
      </View>

      {/* Category Horizontal Selector (ปรับเพิ่มพื้นที่ตรงนี้) */}
      <View style={styles.categoryContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}
        >
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
            <Ionicons name="flash-outline" size={56} color="#cbd5e1" />
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
                  
                  <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(p.id)}>
                    <Ionicons name={isFav ? "heart" : "heart-outline"} size={18} color={isFav ? "#ef4444" : "#64748b"} />
                  </TouchableOpacity>

                  {user.role === "admin" && (
                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(p.id, p.name)}>
                      <Ionicons name="trash" size={16} color="#fff" />
                    </TouchableOpacity>
                  )}

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
                      <Ionicons name="remove" size={14} color="#0369a1" />
                    </TouchableOpacity>
                    <Text style={styles.stepperQty}>{qty}</Text>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => updateQuantity(p.id, qty + 1)}>
                      <Ionicons name="add" size={14} color="#0369a1" />
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
  container: { flex: 1, backgroundColor: "#f8fafc" },
  topMenu: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, backgroundColor: "#f8fafc" },
  title: { color: "#0f172a", fontSize: 18, fontWeight: "800", letterSpacing: 1 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  userHello: { fontSize: 12, color: "#64748b" },
  
  dashboardBtn: { 
    backgroundColor: "#8b5cf6", 
    paddingHorizontal: 12, 
    paddingVertical: 5, 
    borderRadius: 20, 
    borderWidth: 1,
    borderColor: "#a78bfa", 
    shadowColor: "#8b5cf6", 
    shadowOpacity: 0.6, 
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4, 
  },
  dashboardBtnText: { 
    color: "#fff", 
    fontSize: 11, 
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase" 
  },

  iconButton: { position: "relative", padding: 4 },
  badge: { position: "absolute", top: -2, right: -2, backgroundColor: "#0284c7", borderRadius: 10, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  
  // 🔍 ปรับระยะความสูงของกล่องค้นหาให้กระชับ
  searchWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 16, paddingHorizontal: 16, height: 46, borderRadius: 14, gap: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  searchInput: { flex: 1, fontSize: 15, color: "#0f172a", paddingVertical: 0 },
  
  // 🏷️ ปรับพื้นที่ครอบแถวหมวดหมู่ใหม่ ไม่ให้โดนบีบจนจม
  categoryContainer: { marginTop: 12, height: 46, justifyContent: 'center' },
  categoryChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 24, backgroundColor: "#fff", marginRight: 10, borderWidth: 1, borderColor: "#e2e8f0", justifyContent: 'center', alignItems: 'center' },
  categoryChipActive: { backgroundColor: "#0ea5e9", borderColor: "#0ea5e9" },
  categoryText: { color: "#64748b", fontSize: 14, fontWeight: "600", includeFontPadding: false },
  categoryTextActive: { color: "#fff", fontWeight: "700" },
  
  productContainer: { marginTop: 10, paddingHorizontal: 12 },
  productGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", gap: "2%", paddingBottom: 32 },
  
  card: { width: "48%", maxWidth: 340, backgroundColor: "#fff", borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: "#f1f5f9" },
  imageWrapper: { position: "relative", backgroundColor: "#f8fafc", borderRadius: 12, padding: 8, overflow: "hidden" },
  image: { width: "100%", height: 160, borderRadius: 8 },
  favoriteButton: { position: "absolute", top: 8, right: 8, backgroundColor: "#fff", borderRadius: 16, padding: 6, shadowColor: "#000", shadowOpacity: 0.1, elevation: 2 },
  deleteButton: { position: "absolute", top: 8, left: 8, backgroundColor: "#ef4444", borderRadius: 16, padding: 6, shadowColor: "#000", shadowOpacity: 0.2, elevation: 3 },
  discountTag: { position: "absolute", bottom: 8, left: 8, backgroundColor: "#ef4444", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  discountText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  brand: { fontSize: 11, color: "#94a3b8", textTransform: "uppercase", fontWeight: "600", marginTop: 8 },
  productName: { fontSize: 14, fontWeight: "700", color: "#1e293b", marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  ratingText: { fontSize: 12, color: "#475569", fontWeight: "500" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 6 },
  price: { color: "#0284c7", fontWeight: "800", fontSize: 16 },
  oldPrice: { color: "#cbd5e1", fontSize: 12, textDecorationLine: "line-through" },
  addButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#0284c7", borderRadius: 10, paddingVertical: 10, marginTop: 12, gap: 4 },
  addButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#e0f2fe", borderRadius: 10, marginTop: 12, paddingVertical: 4, paddingHorizontal: 4 },
  stepperBtn: { padding: 6, backgroundColor: "#fff", borderRadius: 8 },
  stepperQty: { color: "#0369a1", fontWeight: "800", fontSize: 14 },
  emptyState: { width: "100%", alignItems: "center", justifyContent: "center", marginTop: 80, gap: 8 },
  emptyText: { color: "#94a3b8", fontSize: 15, fontWeight: "500" },
  lockedContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, backgroundColor: "#f8fafc" },
  lockedTitle: { fontSize: 20, fontWeight: "700", color: "#0f172a", marginTop: 16, marginBottom: 8 },
  lockedSubtitle: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 32, paddingHorizontal: 10 },
  goToLoginBtn: { backgroundColor: "#0284c7", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  goToLoginBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});