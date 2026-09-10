import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
    Animated,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { useApp } from "../context/AppContext";
import { PRICE_TIER_COLORS, PRICE_TIER_ICONS, PRICE_TIER_LABELS, PriceTier, withPriceTiers } from "../utils/priceClustering";

const CATEGORIES = ["All", "Power Strips", "Smart Plugs", "Adapters"];
const PRICE_TIER_FILTERS: ("All" | PriceTier)[] = ["All", "cheap", "mid", "expensive"];

export default function Index() {
  const { products, cart, addToCart, updateQuantity, cartCount, favorites, toggleFavorite, user } = useApp();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activePriceTier, setActivePriceTier] = useState<"All" | PriceTier>("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "th">("en");
  const [darkMode, setDarkMode] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const isAdmin = user?.role === "admin";
  const text = language === "th"
    ? { search: "ค้นหาปลั๊กไฟและอุปกรณ์อัจฉริยะ...", all: "ทั้งหมด", powerStrips: "ปลั๊กพ่วง", smartPlugs: "ปลั๊กอัจฉริยะ", adapters: "อะแดปเตอร์", add: "เพิ่มลงรถเข็น", menu: "เมนู", language: "ภาษา", appearance: "รูปแบบการแสดงผล", light: "สว่าง", dark: "มืด", priceGroups: "จัดกลุ่มราคา (K-Means)" }
    : { search: "Find power outlets, smart plugs...", all: "All", powerStrips: "Power Strips", smartPlugs: "Smart Plugs", adapters: "Adapters", add: "Add to cart", menu: "Menu", language: "Language", appearance: "Appearance", light: "Light", dark: "Dark", priceGroups: "Price groups (K-Means)" };
  const categories = [text.all, text.powerStrips, text.smartPlugs, text.adapters];
  const categoryValues = CATEGORIES;

  // 🏷️ จัดกลุ่มสินค้าตามราคาเป็น 3 ระดับ: ถูก/กลาง/แพง — ใช้ผลจาก analysis/clustering.py
  // (scikit-learn K-Means ที่บันทึกไว้ใน database) ถ้ามีครบ ไม่งั้นคำนวณสดด้วย exact k-means แทน
  // คำนวณจากสินค้า "ทั้งหมด" (ไม่ใช่ที่กรองแล้ว) เพื่อให้ระดับราคาคงที่ไม่ขึ้นกับตัวกรอง/คำค้นหา
  // (ต้องอยู่ก่อน `if (!user) return` เสมอ — hook ทุกตัวต้องถูกเรียกทุก render ไม่งั้น React จะ error
  // "Rendered more hooks than during the previous render" ตอนสลับสถานะ login)
  const productsWithTier = useMemo(() => withPriceTiers(products), [products]);

  const tierCounts = useMemo(() => {
    const counts: Record<PriceTier, number> = { cheap: 0, mid: 0, expensive: 0 };
    productsWithTier.forEach((p) => counts[p.priceTier]++);
    return counts;
  }, [productsWithTier]);

  if (!user) {
    return (
      <SafeAreaView style={styles.lockedContainer}>
        <Ionicons name="lock-closed" size={64} color="#2563EB" />
        <Text style={styles.lockedTitle}>Please log in before accessing the site.</Text>
        <Text style={styles.lockedSubtitle}>You need to log in to browse and manage power plug products.</Text>
        <AnimatedPressable style={styles.goToLoginBtn} onPress={() => router.push("/login")}>
          <Text style={styles.goToLoginBtnText}>Go to the login page.</Text>
        </AnimatedPressable>
      </SafeAreaView>
    );
  }

  // 🔎 ค้นหาสินค้า: กรองจาก `productsWithTier` (ที่ AppContext ดึงมาจาก database ผ่าน GET /api/products)
  // ด้วย JavaScript ฝั่ง client — ไม่ได้ยิง query ไป database ใหม่ทุกครั้งที่พิมพ์
  // เทียบข้อความค้นหา (search) กับชื่อ, แบรนด์, และราคาของสินค้าแบบ case-insensitive
  const filteredProducts = productsWithTier.filter((p) => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const matchesPriceTier = activePriceTier === "All" || p.priceTier === activePriceTier;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.price.toString().includes(q);
    return matchesCategory && matchesPriceTier && matchesSearch;
  });

  const formatPrice = (n: number) => `฿${n.toLocaleString()}`;
  const getQty = (id: string) => cart.find((c) => c.productId === id)?.quantity ?? 0;

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
      {/* Top Menu */}
      <Animated.View
        style={[
          styles.topMenuContainer,
          {
            height: scrollY.interpolate({
              inputRange: [0, 100],
              outputRange: [186, 58],
              extrapolate: "clamp",
            }),
          },
        ]}
      >
      <View style={[styles.topMenu, darkMode && styles.darkTopMenu]}>
        <AnimatedPressable style={styles.menuButton} onPress={() => setMenuOpen((open) => !open)}>
          <Ionicons name={menuOpen ? "close" : "menu"} size={25} color={darkMode ? "#EAF1FB" : "#0F1E33"} />
        </AnimatedPressable>
        <View style={styles.brandBlock}>
          <View style={styles.brandRow}>
            <View style={styles.logoFrame}>
              <Image
                source={require("../../assets/images/papengie-logo.png")}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
          </View>
          <Text style={[styles.title, darkMode && styles.darkText]}>Power Plugs</Text>
          <View style={styles.userRow}>
            <Text style={styles.userHello}>hello: {user.username} ({user.role === "admin" ? "💻 Admin" : "🛒 Customer"})</Text>
            {user.role === "admin" && (
              <View style={{ flexDirection: "row", gap: 6 }}>
                <AnimatedPressable style={styles.dashboardBtn} onPress={() => router.push("/admin-dashboard")}>
                  <Text style={styles.dashboardBtnText}>Dashboard 📊</Text>
                </AnimatedPressable>
                {/* ⚙️ ปุ่มไปหน้าจัดการสินค้าเพื่อลบ/แก้ไข */}
                <AnimatedPressable style={styles.manageBtn} onPress={() => router.push("/admin-products")}>
                  <Text style={styles.dashboardBtnText}>Manage ⚙️</Text>
                </AnimatedPressable>
                {/* 📊 ปุ่มไปหน้ารายงานการจัดกลุ่มราคาสินค้า (K-Means) */}
                <AnimatedPressable style={styles.clustersBtn} onPress={() => router.push("/admin-clusters")}>
                  <Text style={styles.dashboardBtnText}>Clusters 📈</Text>
                </AnimatedPressable>
              </View>
            )}
          </View>
        </View>
        {!isAdmin && (
          <AnimatedPressable style={styles.iconButton} onPress={() => router.push("/cart")}>
            <Ionicons name="cart-outline" size={24} color="#0F1E33" />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </AnimatedPressable>
        )}
      </View>
      </Animated.View>

      {/* Search Bar */}
      {menuOpen && (
        <View style={[styles.menuPanel, darkMode && styles.darkPanel]}>
          <Text style={[styles.menuTitle, darkMode && styles.darkText]}>{text.menu}</Text>
          <Text style={[styles.menuLabel, darkMode && styles.darkSecondaryText]}>{text.language}</Text>
          <View style={styles.optionRow}>
            {(["th", "en"] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, language === option && styles.optionButtonActive]}
                onPress={() => setLanguage(option)}
              >
                <Text style={[styles.optionText, language === option && styles.optionTextActive]}>{option === "th" ? "ไทย" : "English"}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.menuLabel, darkMode && styles.darkSecondaryText]}>{text.appearance}</Text>
          <View style={styles.optionRow}>
            {([false, true] as const).map((option) => (
              <TouchableOpacity
                key={String(option)}
                style={[styles.optionButton, darkMode === option && styles.optionButtonActive]}
                onPress={() => setDarkMode(option)}
              >
                <Ionicons name={option ? "moon" : "sunny"} size={14} color={darkMode === option ? "#fff" : "#5B6B85"} />
                <Text style={[styles.optionText, darkMode === option && styles.optionTextActive]}>{option ? text.dark : text.light}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={[styles.searchWrapper, darkMode && styles.darkElement]}>
        <Ionicons name="search" size={20} color="#5B6B85" />
        <TextInput
          style={[styles.searchInput, darkMode && styles.darkText]}
          placeholder={text.search}
          placeholderTextColor="#8A97AC"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category Horizontal Selector */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}>
          {categoryValues.map((cat, index) => (
            <AnimatedPressable
              key={cat}
              style={[styles.categoryChip, darkMode && styles.darkElement, activeCategory === cat && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryText, darkMode && styles.darkSecondaryText, activeCategory === cat && styles.categoryTextActive]}>{categories[index]}</Text>
            </AnimatedPressable>
          ))}
        </ScrollView>
      </View>

      {/* 🏷️ ตัวกรองระดับราคา (จาก K-Means): ถูก / กลาง / แพง */}
      <View style={styles.tierFilterContainer}>
        <Text style={[styles.tierFilterLabel, darkMode && styles.darkSecondaryText]}>{text.priceGroups}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, alignItems: "center" }}>
          {PRICE_TIER_FILTERS.map((tier) => {
            const isActive = activePriceTier === tier;
            const isAll = tier === "All";
            const color = isAll ? null : PRICE_TIER_COLORS[tier];
            const count = isAll ? productsWithTier.length : tierCounts[tier];
            return (
              <AnimatedPressable
                key={tier}
                style={[
                  styles.tierChip,
                  darkMode && styles.darkElement,
                  isActive && (isAll ? styles.tierChipActiveNeutral : { backgroundColor: color!.bg, borderColor: color!.border }),
                ]}
                onPress={() => setActivePriceTier(tier)}
              >
                {!isAll && <Ionicons name={PRICE_TIER_ICONS[tier]} size={13} color={isActive ? color!.text : "#8A97AC"} />}
                <Text
                  style={[
                    styles.tierChipText,
                    darkMode && styles.darkSecondaryText,
                    isActive && { color: isAll ? "#0F1E33" : color!.text, fontWeight: "800" },
                  ]}
                >
                  {isAll ? text.all : PRICE_TIER_LABELS[language][tier]} ({count})
                </Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Product Grid */}
      <Animated.ScrollView
        style={styles.productContainer}
        contentContainerStyle={styles.productGrid}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
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
              <AnimatedPressable
                key={p.id}
                style={[styles.card, darkMode && styles.darkElement]}
                activeOpacity={0.85}
                onPress={() => router.push(`/product/${p.id}`)}
              >
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: p.image }} style={styles.image} resizeMode="contain" />

                  {/* 🏷️ ริบบิ้นระดับราคา (K-Means) ลอยอยู่มุมซ้ายบนของรูป */}
                  <View
                    style={[
                      styles.tierRibbon,
                      { backgroundColor: PRICE_TIER_COLORS[p.priceTier].text },
                    ]}
                  >
                    <Ionicons name={PRICE_TIER_ICONS[p.priceTier]} size={10} color="#fff" />
                    <Text style={styles.tierRibbonText}>{PRICE_TIER_LABELS[language][p.priceTier]}</Text>
                  </View>

                  {/* ปุ่ม Favorite (เฉพาะลูกค้า แอดมินไม่ต้องมี) */}
                  {!isAdmin && (
                    <AnimatedPressable style={styles.favoriteButton} onPress={() => toggleFavorite(p.id)}>
                      <Ionicons name={isFav ? "heart" : "heart-outline"} size={17} color={isFav ? "#DC2626" : "#5B6B85"} />
                    </AnimatedPressable>
                  )}

                  {p.oldPrice && (
                    <View style={styles.discountTag}>
                      <Text style={styles.discountText}>-{Math.round((1 - p.price / p.oldPrice) * 100)}%</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.brand, darkMode && styles.darkSecondaryText]}>{p.brand}</Text>
                <Text style={[styles.productName, darkMode && styles.darkText]} numberOfLines={1}>{p.name}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.ratingPill}>
                    <Ionicons name="star" size={11} color="#eab308" />
                    <Text style={[styles.ratingText, darkMode && styles.darkSecondaryText]}>{p.rating}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{formatPrice(p.price)}</Text>
                    {p.oldPrice && <Text style={styles.oldPrice}>{formatPrice(p.oldPrice)}</Text>}
                  </View>
                </View>

                {isAdmin ? (
                  <AnimatedPressable style={styles.editButton} onPress={() => router.push(`/product/${p.id}`)}>
                    <Ionicons name="pencil" size={14} color="#fff" />
                    <Text style={styles.editButtonText}>Edit product</Text>
                  </AnimatedPressable>
                ) : qty === 0 ? (
                  <AnimatedPressable style={styles.addButtonWrap} onPress={() => addToCart(p.id)}>
                    <LinearGradient
                      colors={["#38BDF8", "#2563EB"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.addButton}
                    >
                      <Ionicons name="add" size={16} color="#fff" />
                      <Text style={styles.addButtonText}>{text.add}</Text>
                    </LinearGradient>
                  </AnimatedPressable>
                ) : (
                  <View style={styles.stepper}>
                    <AnimatedPressable style={styles.stepperBtn} onPress={() => updateQuantity(p.id, qty - 1)}>
                      <Ionicons name="remove" size={14} color="#1D4ED8" />
                    </AnimatedPressable>
                    <Text style={styles.stepperQty}>{qty}</Text>
                    <AnimatedPressable style={styles.stepperBtn} onPress={() => updateQuantity(p.id, qty + 1)}>
                      <Ionicons name="add" size={14} color="#1D4ED8" />
                    </AnimatedPressable>
                  </View>
                )}
              </AnimatedPressable>
            );
          })
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" },
  darkContainer: { backgroundColor: "#070F20" },
  topMenuContainer: { overflow: "hidden", position: "relative", zIndex: 2 },
  topMenu: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#F4F7FC" },
  darkTopMenu: { backgroundColor: "#070F20" },
  menuButton: { position: "absolute", top: 10, left: 10, zIndex: 4, width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: "rgba(255, 255, 255, 0.88)", shadowColor: "#0F1E33", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  brandBlock: { flex: 1, alignItems: "center", marginTop: 8 },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  logoFrame: { width: 86, height: 86, borderRadius: 43, overflow: "hidden", backgroundColor: "#fff", borderWidth: 3, borderColor: "#38BDF8", shadowColor: "#2563EB", shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  logoImage: { width: "100%", height: "100%" },
  title: { color: "#0A1830", fontSize: 19, fontWeight: "800", letterSpacing: 0.2, textAlign: "center", marginTop: 5 },
  userRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 8, marginTop: 4 },
  userHello: { fontSize: 12, color: "#5B6B85" },
  dashboardBtn: { backgroundColor: "#1B3A66", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  manageBtn: { backgroundColor: "#2563EB", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  clustersBtn: { backgroundColor: "#7C3AED", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  dashboardBtnText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  iconButton: { position: "relative", padding: 4 },
  badge: { position: "absolute", top: -2, right: -2, backgroundColor: "#2563EB", borderRadius: 10, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  menuPanel: { position: "absolute", zIndex: 10, top: 58, left: 14, width: 230, padding: 16, borderRadius: 18, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E9F5", shadowColor: "#0F1E33", shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  darkPanel: { backgroundColor: "#101E38", borderColor: "#263D60" },
  menuTitle: { color: "#0F1E33", fontSize: 17, fontWeight: "800", marginBottom: 14 },
  menuLabel: { color: "#5B6B85", fontSize: 11, fontWeight: "700", marginBottom: 7, textTransform: "uppercase" },
  optionRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  optionButton: { flex: 1, minHeight: 36, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 9, backgroundColor: "#F4F7FC", borderWidth: 1, borderColor: "#E2E9F5" },
  optionButtonActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  optionText: { color: "#5B6B85", fontSize: 12, fontWeight: "700" },
  optionTextActive: { color: "#fff" },
  darkText: { color: "#EAF1FB" },
  darkSecondaryText: { color: "#93A5C2" },
  darkElement: { backgroundColor: "#101E38", borderColor: "#263D60" },
  searchWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 16, marginTop: 8, paddingHorizontal: 16, height: 46, borderRadius: 14, gap: 10, borderWidth: 1, borderColor: "#E2E9F5", position: "relative", zIndex: 1 },
  searchInput: { flex: 1, fontSize: 15, color: "#0F1E33" },
  categoryContainer: { marginTop: 12, height: 46, justifyContent: 'center' },
  categoryChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 24, backgroundColor: "#fff", marginRight: 10, borderWidth: 1, borderColor: "#E2E9F5" },
  categoryChipActive: { backgroundColor: "#38BDF8", borderColor: "#38BDF8" },
  categoryText: { color: "#5B6B85", fontSize: 14, fontWeight: "600" },
  categoryTextActive: { color: "#fff", fontWeight: "700" },
  tierFilterContainer: { marginTop: 10 },
  tierFilterLabel: { fontSize: 11, fontWeight: "700", color: "#8A97AC", textTransform: "uppercase", letterSpacing: 0.5, marginLeft: 16, marginBottom: 6 },
  tierChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#fff", marginRight: 8, borderWidth: 1, borderColor: "#E2E9F5" },
  tierChipActiveNeutral: { backgroundColor: "#EAF1FB", borderColor: "#38BDF8" },
  tierChipText: { color: "#5B6B85", fontSize: 12, fontWeight: "600" },
  productContainer: { flex: 1, marginTop: 10, paddingHorizontal: 12 },
  productGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 14, paddingBottom: 120 },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F0F4FB",
    shadowColor: "#0F1E33",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  imageWrapper: { position: "relative", backgroundColor: "#F4F7FC", borderRadius: 14, padding: 10, overflow: "hidden" },
  image: { width: "100%", aspectRatio: 1.15, borderRadius: 10 },
  tierRibbon: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: "#0F1E33",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tierRibbonText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 6,
    shadowColor: "#0F1E33",
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  discountTag: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "#DC2626",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    shadowColor: "#DC2626",
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  discountText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  brand: { fontSize: 10, color: "#8A97AC", textTransform: "uppercase", fontWeight: "700", letterSpacing: 0.3, marginTop: 8 },
  productName: { fontSize: 14, fontWeight: "700", color: "#0F1E33", marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  ratingPill: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#FEF9E7", borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  ratingText: { fontSize: 11, color: "#B45309", fontWeight: "700" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 5 },
  price: { color: "#2563EB", fontWeight: "800", fontSize: 15 },
  oldPrice: { color: "#C3CEE0", fontSize: 11, textDecorationLine: "line-through" },
  addButtonWrap: { borderRadius: 12, marginTop: 10, shadowColor: "#2563EB", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  addButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 12, paddingVertical: 10, gap: 4 },
  addButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  editButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#D97706", borderRadius: 12, paddingVertical: 10, marginTop: 10, gap: 4 },
  editButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#EAF1FB", borderRadius: 12, marginTop: 10, paddingVertical: 4, paddingHorizontal: 4 },
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