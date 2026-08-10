import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Alert, Clipboard, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useApp } from "../context/AppContext";

// 🎟️ เพิ่มลูกเล่นคูปองส่วนลดจำลองสำหรับร้านปลั๊กไฟ
const COUPONS = [
  { code: "PLUGTECH10", discount: "10% OFF", desc: "Min. spend ฿500 on Smart Plugs", expiry: "Exp: 31 Jul 2026" },
  { code: "SUPERFLASH50", discount: "฿50 OFF", desc: "For new users on first power strip purchase", expiry: "Exp: 15 Jul 2026" },
];

export default function Promotions() {
  const { products, addToCart, cart, updateQuantity } = useApp();

  // กรองเฉพาะปลั๊กไฟรุ่นที่มีการตั้งราคาลดเอาไว้ (มี oldPrice)
  const promoProducts = useMemo(() => {
    return products.filter((p) => p.oldPrice && p.oldPrice > p.price);
  }, [products]);

  const formatPrice = (n: number) => `฿${n.toLocaleString()}`;
  const getQty = (id: string) => cart.find((c) => c.productId === id)?.quantity ?? 0;

  const copyToClipboard = (code: string) => {
    Clipboard.setString(code);
    Alert.alert("Code Copied!", `Coupon code "${code}" has been copied to your clipboard.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* --- 🎁 SECTION 1: EXCLUSIVE COUPONS --- */}
        <Text style={styles.sectionTitle}>Exclusive Vouchers</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.couponRow} contentContainerStyle={{ paddingRight: 20 }}>
          {COUPONS.map((coupon) => (
            <View key={coupon.code} style={styles.couponCard}>
              <View style={styles.couponLeft}>
                <Ionicons name="ticket-outline" size={24} color="#0284c7" />
                <Text style={styles.couponDiscount}>{coupon.discount}</Text>
                <Text style={styles.couponDesc} numberOfLines={1}>{coupon.desc}</Text>
                <Text style={styles.couponExpiry}>{coupon.expiry}</Text>
              </View>
              
              {/* ปุ่มกดก๊อปปี้โค้ดแบบประทับตรา */}
              <TouchableOpacity style={styles.couponRight} onPress={() => copyToClipboard(coupon.code)}>
                <Text style={styles.couponCodeTitle}>CODE</Text>
                <Text style={styles.couponCodeText}>{coupon.code}</Text>
                <View style={styles.copyBadge}>
                  <Text style={styles.copyBadgeText}>COPY</Text>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* --- ⚡ SECTION 2: HOT DEALS (PRODUCTS ON SALE) --- */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Hot Deals & Flash Sales</Text>
        
        {promoProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="pricetag-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No promotions available right now.</Text>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {promoProducts.map((p) => {
              const qty = getQty(p.id);
              const discountPercent = Math.round((1 - p.price / p.oldPrice!) * 100);

              return (
                <View key={p.id} style={styles.productCard}>
                  <View style={styles.imageWrapper}>
                    <Image source={{ uri: p.image }} style={styles.productImage} />
                    {/* ป้ายแดงลดกระหน่ำลอยเด่นบนภาพ */}
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>SAVE {discountPercent}%</Text>
                    </View>
                  </View>

                  <Text style={styles.productBrand}>{p.brand}</Text>
                  <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.currentPrice}>{formatPrice(p.price)}</Text>
                    <Text style={styles.oldPrice}>{formatPrice(p.oldPrice!)}</Text>
                  </View>

                  {/* ปุ่มสั่งซื้อด่วน */}
                  {qty === 0 ? (
                    <TouchableOpacity style={styles.buyButton} onPress={() => addToCart(p.id)}>
                      <Ionicons name="flash" size={14} color="#fff" />
                      <Text style={styles.buyButtonText}>Claim Deal</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.stepper}>
                      <TouchableOpacity style={styles.stepperBtn} onPress={() => updateQuantity(p.id, qty - 1)}>
                        <Ionicons name="remove" size={12} color="#0369a1" />
                      </TouchableOpacity>
                      <Text style={styles.stepperQty}>{qty}</Text>
                      <TouchableOpacity style={styles.stepperBtn} onPress={() => updateQuantity(p.id, qty + 1)}>
                        <Ionicons name="add" size={12} color="#0369a1" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 14, letterSpacing: 0.3 },
  
  // 🎟️ Voucher Styles (ตั๋วคูปองสไตล์โมเดิร์น)
  couponRow: { flexDirection: "row", marginBottom: 4, flexGrow: 0 },
  couponCard: { width: 300, height: 110, backgroundColor: "#fff", borderRadius: 14, marginRight: 14, flexDirection: "row", borderWidth: 1, borderColor: "#e2e8f0", overflow: "hidden", shadowColor: "#0284c7", shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
  couponLeft: { flex: 1.8, padding: 12, justifyContent: "space-between" },
  couponDiscount: { fontSize: 18, fontWeight: "800", color: "#0284c7", marginTop: 2 },
  couponDesc: { fontSize: 12, color: "#475569", fontWeight: "500" },
  couponExpiry: { fontSize: 10, color: "#94a3b8" },
  couponRight: { flex: 1, backgroundColor: "#f0f9ff", borderLeftWidth: 1, borderLeftColor: "#e2e8f0", borderStyle: "dashed", alignItems: "center", justifyContent: "center", padding: 8 },
  couponCodeTitle: { fontSize: 9, color: "#64748b", fontWeight: "700" },
  couponCodeText: { fontSize: 12, color: "#0369a1", fontWeight: "800", marginTop: 2, marginBottom: 6 },
  copyBadge: { backgroundColor: "#0284c7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  copyBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },

  // ⚡ Product Sale Grid Styles
  productGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  productCard: { width: "48%", backgroundColor: "#fff", borderRadius: 16, padding: 12, marginBottom: 4, borderWidth: 1, borderColor: "#f1f5f9" },
  imageWrapper: { position: "relative" },
  productImage: { width: "100%", height: 130, borderRadius: 12, marginBottom: 8, backgroundColor: "#f8fafc" },
  discountBadge: { position: "absolute", top: 8, left: 8, backgroundColor: "#ef4444", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  discountBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  productBrand: { fontSize: 11, color: "#94a3b8", textTransform: "uppercase", fontWeight: "600" },
  productName: { fontSize: 14, fontWeight: "700", color: "#1e293b", marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 6, marginBottom: 10 },
  currentPrice: { color: "#0284c7", fontWeight: "800", fontSize: 16 },
  oldPrice: { color: "#cbd5e1", fontSize: 12, textDecorationLine: "line-through" },
  
  // Interaction Buttons
  buyButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#0284c7", borderRadius: 10, paddingVertical: 8, gap: 4 },
  buyButtonText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  
  // Stepper Mini
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#e0f2fe", borderRadius: 10, paddingHorizontal: 4, paddingVertical: 3 },
  stepperBtn: { padding: 4, backgroundColor: "#fff", borderRadius: 6 },
  stepperQty: { color: "#0369a1", fontWeight: "800", fontSize: 13, paddingHorizontal: 6 },

  emptyState: { alignItems: "center", marginTop: 40, gap: 8 },
  emptyText: { color: "#94a3b8", fontSize: 14, fontWeight: "500" }
});