import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
// 🌟 แก้ไข: เพิ่ม Platform เข้ามาในบรรทัด import นี้แล้วค่ะ!
import { Alert, Image, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Receipt, useApp } from "../context/AppContext";

export default function Cart() {
  const { cart, products, updateQuantity, removeFromCart, cartTotal, checkout } = useApp();
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const formatPrice = (n: number) => `฿${n.toLocaleString()}`;

  const handleCheckout = () => {
    const r = checkout();
    if (r) {
      setReceipt(r);
    } else {
      Alert.alert("Empty Cart", "Please add some products to your cart before checking out.");
    }
  };

  // --- Success Receipt Screen ---
  if (receipt) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.receiptWrap}>
          <View style={styles.receiptCard}>
            {/* Tech Blue Success Icon */}
            <Ionicons name="checkmark-circle" size={56} color="#0284c7" style={{ alignSelf: "center", marginBottom: 12 }} />
            <Text style={styles.receiptTitle}>Payment Successful</Text>
            <Text style={styles.receiptSub}>Receipt #{receipt.id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.receiptDate}>{receipt.date}</Text>
            
            <View style={styles.divider} />
            
            {receipt.items.map((item, idx) => (
              <View key={idx} style={styles.receiptRow}>
                <Text style={styles.receiptItemName}>{item.name} x{item.quantity}</Text>
                <Text style={styles.receiptItemPrice}>{formatPrice(item.price * item.quantity)}</Text>
              </View>
            ))}
            
            <View style={styles.divider} />
            
            <View style={styles.receiptRow}>
              <Text style={styles.receiptTotalLabel}>Total Paid</Text>
              <Text style={styles.receiptTotalValue}>{formatPrice(receipt.total)}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.doneButton} onPress={() => setReceipt(null)}>
            <Text style={styles.doneButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Main Cart Screen ---
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Shopping Cart</Text>
      
      {cart.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={64} color="#cbd5e1" />
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
                      <TouchableOpacity style={styles.stepperBtn} onPress={() => updateQuantity(c.productId, c.quantity - 1)}>
                        <Ionicons name="remove" size={14} color="#0369a1" />
                      </TouchableOpacity>
                      <Text style={styles.stepperQty}>{c.quantity}</Text>
                      <TouchableOpacity style={styles.stepperBtn} onPress={() => updateQuantity(c.productId, c.quantity + 1)}>
                        <Ionicons name="add" size={14} color="#0369a1" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Styled Trash Button */}
                  <TouchableOpacity style={styles.removeButton} onPress={() => removeFromCart(c.productId)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
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
            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" }, 
  header: { fontSize: 24, fontWeight: "700", color: "#0f172a", padding: 20, paddingBottom: 8 },
  
  // Empty State
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyText: { color: "#94a3b8", fontSize: 16, fontWeight: "500" },
  
  // Cart Items
  cartItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#f1f5f9" },
  cartImage: { width: 70, height: 70, borderRadius: 12, backgroundColor: "#f8fafc" },
  cartName: { fontWeight: "700", fontSize: 15, color: "#1e293b" },
  cartPrice: { color: "#0284c7", fontWeight: "700", fontSize: 14, marginTop: 2 },
  
  // Refined Blue Stepper
  stepper: { flexDirection: "row", alignItems: "center", backgroundColor: "#e0f2fe", borderRadius: 8, alignSelf: "flex-start", marginTop: 8, paddingHorizontal: 4, paddingVertical: 4, gap: 4 },
  stepperBtn: { padding: 4, backgroundColor: "#fff", borderRadius: 6 },
  stepperQty: { color: "#0369a1", fontWeight: "700", fontSize: 13, minWidth: 24, textAlign: "center" },
  removeButton: { padding: 8, backgroundColor: "#fef2f2", borderRadius: 10 },
  
  // Bottom Checkout Section (หลบแถบเมนูลอยตัวด้านล่างพ้นพอดีเป๊ะ)
  checkoutBar: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 20, 
    paddingTop: 16, 
    paddingBottom: Platform.OS === "ios" ? 96 : 84, 
    backgroundColor: "#fff", 
    borderTopWidth: 1, 
    borderTopColor: "#e2e8f0",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  totalLabel: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  totalValue: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  checkoutButton: { backgroundColor: "#0284c7", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, shadowColor: "#0284c7", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 2 },
  checkoutButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  
  // Receipt Layout
  receiptWrap: { padding: 24, paddingTop: 40 },
  receiptCard: { backgroundColor: "#fff", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "#e2e8f0" },
  receiptTitle: { fontSize: 22, fontWeight: "800", textAlign: "center", color: "#0f172a" },
  receiptSub: { textAlign: "center", color: "#64748b", fontSize: 13, fontWeight: "500", marginTop: 6 },
  receiptDate: { textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 2, marginBottom: 8 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e2e8f0", borderStyle: "dashed", marginVertical: 16 },
  receiptRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  receiptItemName: { fontSize: 14, color: "#334155", flex: 1 },
  receiptItemPrice: { fontSize: 14, color: "#0f172a", fontWeight: "600" },
  receiptTotalLabel: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  receiptTotalValue: { fontSize: 18, fontWeight: "800", color: "#0284c7" },
  
  // Button to dismiss receipt
  doneButton: { backgroundColor: "#0284c7", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 24 },
  doneButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});