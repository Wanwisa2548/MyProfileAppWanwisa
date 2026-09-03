import { Ionicons } from "@expo/vector-icons";
// 🌟 แก้ไข: เพิ่ม Platform เข้ามาในบรรทัด import นี้แล้วค่ะ!
import { useRouter } from "expo-router";
import { Image, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { useApp } from "../context/AppContext";

export default function Cart() {
  const { cart, products, updateQuantity, removeFromCart, cartTotal } = useApp();
  const router = useRouter();

  const formatPrice = (n: number) => `฿${n.toLocaleString()}`;

  // --- Main Cart Screen ---
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Shopping Cart</Text>
      
      {cart.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={64} color="#E2E9F5" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
            {cart.map((c) => {
              const p = products.find((prod) => prod.id === c.productId);
              if (!p) return null;
              return (
                <View key={c.productId} style={styles.cartItem}>
                  <Image source={{ uri: p.image }} style={styles.cartImage} />
                  
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.cartName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.cartPrice}>{formatPrice(p.price)}</Text>
                    
                    {/* Modern Clean Stepper */}
                    <View style={styles.stepper}>
                      <AnimatedPressable style={styles.stepperBtn} onPress={() => updateQuantity(c.productId, c.quantity - 1)}>
                        <Ionicons name="remove" size={14} color="#1D4ED8" />
                      </AnimatedPressable>
                      <Text style={styles.stepperQty}>{c.quantity}</Text>
                      <AnimatedPressable style={styles.stepperBtn} onPress={() => updateQuantity(c.productId, c.quantity + 1)}>
                        <Ionicons name="add" size={14} color="#1D4ED8" />
                      </AnimatedPressable>
                    </View>
                  </View>
                  
                  {/* Styled Trash Button */}
                  <AnimatedPressable style={styles.removeButton} onPress={() => removeFromCart(c.productId)}>
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  </AnimatedPressable>
                </View>
              );
            })}
          </ScrollView>
          
          {/* Bottom Checkout Bar */}
          <View style={styles.checkoutBar}>
            <View>
              <Text style={styles.totalLabel}>Total Price</Text>
              <Text style={styles.totalValue}>{formatPrice(cartTotal)}</Text>
            </View>
            <AnimatedPressable style={styles.checkoutButton} onPress={() => router.push("/payment")}>
              <Text style={styles.checkoutButtonText}>Checkout</Text>
            </AnimatedPressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" }, 
  header: { fontSize: 24, fontWeight: "700", color: "#0F1E33", padding: 20, paddingBottom: 8 },
  
  // Empty State
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyText: { color: "#8A97AC", fontSize: 16, fontWeight: "500" },
  
  // Cart Items
  cartItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#EAF1FB" },
  cartImage: { width: 70, height: 70, borderRadius: 12, backgroundColor: "#F4F7FC" },
  cartName: { fontWeight: "700", fontSize: 15, color: "#0F1E33" },
  cartPrice: { color: "#2563EB", fontWeight: "700", fontSize: 14, marginTop: 2 },
  
  // Refined Blue Stepper
  stepper: { flexDirection: "row", alignItems: "center", backgroundColor: "#EAF1FB", borderRadius: 8, alignSelf: "flex-start", marginTop: 8, paddingHorizontal: 4, paddingVertical: 4, gap: 4 },
  stepperBtn: { padding: 4, backgroundColor: "#fff", borderRadius: 6 },
  stepperQty: { color: "#1D4ED8", fontWeight: "700", fontSize: 13, minWidth: 24, textAlign: "center" },
  removeButton: { padding: 8, backgroundColor: "#FDE7E7", borderRadius: 10 },
  
  // Bottom Checkout Section (หลบแถบเมนูลอยตัวด้านล่างพ้นพอดีเป๊ะ)
  checkoutBar: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 20, 
    paddingTop: 16, 
    paddingBottom: 16,
    marginBottom: Platform.OS === "ios" ? 104 : 94,
    backgroundColor: "#fff", 
    borderTopWidth: 1, 
    borderTopColor: "#E2E9F5",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  totalLabel: { fontSize: 13, color: "#5B6B85", fontWeight: "500" },
  totalValue: { fontSize: 22, fontWeight: "800", color: "#0F1E33" },
  checkoutButton: { backgroundColor: "#2563EB", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 2 },
  checkoutButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  
  // Receipt Layout
  receiptWrap: { padding: 24, paddingTop: 40 },
  receiptCard: { backgroundColor: "#fff", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "#E2E9F5" },
  receiptTitle: { fontSize: 22, fontWeight: "800", textAlign: "center", color: "#0F1E33" },
  receiptSub: { textAlign: "center", color: "#5B6B85", fontSize: 13, fontWeight: "500", marginTop: 6 },
  receiptDate: { textAlign: "center", color: "#8A97AC", fontSize: 12, marginTop: 2, marginBottom: 8 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#E2E9F5", borderStyle: "dashed", marginVertical: 16 },
  receiptRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  receiptItemName: { fontSize: 14, color: "#0F1E33", flex: 1 },
  receiptItemPrice: { fontSize: 14, color: "#0F1E33", fontWeight: "600" },
  receiptTotalLabel: { fontSize: 16, fontWeight: "800", color: "#0F1E33" },
  receiptTotalValue: { fontSize: 18, fontWeight: "800", color: "#2563EB" },
  
  // Button to dismiss receipt
  doneButton: { backgroundColor: "#2563EB", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 24 },
  doneButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});