import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { Receipt, useApp } from "../context/AppContext";
import { showAlert } from "../utils/crossPlatformAlert";

export default function Payment() {
  const router = useRouter();
  const { cart, products, cartTotal, placeOrder } = useApp();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [slipUri, setSlipUri] = useState("");
  const [slipName, setSlipName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const formatPrice = (value: number) => `฿${value.toLocaleString()}`;
  const cartProducts = cart
    .map((item) => ({ item, product: products.find((product) => product.id === item.productId) }))
    .filter((entry) => entry.product);

  const handlePickSlip = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    const asset = result.assets[0];
    setSlipUri(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
    setSlipName(result.assets[0].fileName || "Payment slip selected");
  };

  const handleConfirmPayment = async () => {
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      showAlert("Incomplete information", "Please enter the recipient name, phone number, and delivery address.");
      return;
    }
    if (!slipUri) {
      showAlert("Payment slip required", "Please attach your transfer slip before confirming the order.");
      return;
    }
    try {
      setSubmitting(true);
      const completedReceipt = await placeOrder({
        recipientName: fullName,
        phone,
        deliveryAddress: address,
        paymentSlip: slipUri,
      });
      setReceipt(completedReceipt);
    } catch (error) {
      showAlert("Order failed", error instanceof Error ? error.message : "Could not submit your order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (receipt) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.successWrap}>
          <View style={styles.successHero}>
            <View style={styles.successIconOuter}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={42} color="#fff" />
              </View>
            </View>
            <View style={styles.statusPill}>
              <Ionicons name="time-outline" size={14} color="#B45309" />
              <Text style={styles.statusPillText}>Pending payment verification</Text>
            </View>
            <Text style={styles.successTitle}>Order received</Text>
            <Text style={styles.successSubtitle}>Thank you for shopping with Papengie. We will verify your slip and prepare your order.</Text>
          </View>
          <View style={styles.receiptCard}>
            <View style={styles.receiptHeader}>
              <View>
                <Text style={styles.receiptLabel}>Order reference</Text>
                <Text style={styles.receiptValue}>#{receipt.id.slice(-8).toUpperCase()}</Text>
              </View>
              <View style={styles.receiptIcon}>
                <Ionicons name="receipt-outline" size={21} color="#2563EB" />
              </View>
            </View>
            <View style={styles.divider} />
            <Text style={styles.receiptLabel}>Delivery to</Text>
            <Text style={styles.receiptValue}>{fullName}</Text>
            <Text style={styles.receiptSecondary}>{phone}</Text>
            <Text style={styles.receiptSecondary}>{address}</Text>
            <View style={styles.divider} />
            <View style={styles.successTotalRow}>
              <View>
                <Text style={styles.receiptLabel}>Order total</Text>
                <Text style={styles.receiptSecondary}>Bank transfer</Text>
              </View>
              <Text style={styles.totalValue}>{formatPrice(receipt.total)}</Text>
            </View>
          </View>
          <AnimatedPressable style={styles.primaryButton} onPress={() => router.replace("/")}>
            <Ionicons name="bag-handle-outline" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Back to store</Text>
          </AnimatedPressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <AnimatedPressable style={styles.primaryButton} onPress={() => router.replace("/")}>
          <Text style={styles.primaryButtonText}>Back to store</Text>
        </AnimatedPressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.headerRow}>
          <AnimatedPressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back</Text>
          </AnimatedPressable>
          <View>
            <Text style={styles.title}>Complete payment</Text>
            <Text style={styles.subtitle}>Secure your order in a few steps</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order summary</Text>
          {cartProducts.map(({ item, product }) => (
            <View key={item.productId} style={styles.orderRow}>
              <Image source={{ uri: product!.image }} style={styles.productImage} />
              <View style={styles.orderInfo}>
                <Text style={styles.productName} numberOfLines={1}>{product!.name}</Text>
                <Text style={styles.quantity}>Qty {item.quantity}</Text>
              </View>
              <Text style={styles.lineTotal}>{formatPrice(product!.price * item.quantity)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(cartTotal)}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Delivery details</Text>
          <Text style={styles.label}>Recipient name</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Full name" placeholderTextColor="#8A97AC" />
          <Text style={styles.label}>Phone number</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="08X-XXX-XXXX" placeholderTextColor="#8A97AC" />
          <Text style={styles.label}>Delivery address</Text>
          <TextInput style={[styles.input, styles.addressInput]} value={address} onChangeText={setAddress} multiline placeholder="House number, street, district, province, postal code" placeholderTextColor="#8A97AC" />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Bank transfer</Text>
          <View style={styles.bankBox}>
            <Text style={styles.bankName}>Papengie Store</Text>
            <Text style={styles.bankDetail}>Kasikorn Bank 123-4-56789-0</Text>
            <Text style={styles.bankHint}>Transfer exactly {formatPrice(cartTotal)}</Text>
          </View>
          <Text style={styles.label}>Payment slip</Text>
          <AnimatedPressable style={styles.uploadButton} onPress={handlePickSlip}>
            <Text style={styles.uploadButtonText}>{slipName || "Attach transfer slip"}</Text>
          </AnimatedPressable>
          {slipUri ? <Image source={{ uri: slipUri }} style={styles.slipPreview} resizeMode="contain" /> : null}
        </View>

        <AnimatedPressable style={[styles.primaryButton, submitting && styles.disabledButton]} onPress={handleConfirmPayment} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Confirm order and payment</Text>}
        </AnimatedPressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" },
  form: { padding: 16, paddingTop: 28, paddingBottom: 140 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  backButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#EAF1FB" },
  backButtonText: { color: "#1D4ED8", fontWeight: "700", fontSize: 12 },
  title: { color: "#0F1E33", fontSize: 22, fontWeight: "900" },
  subtitle: { color: "#5B6B85", fontSize: 12, marginTop: 2 },
  sectionCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#E2E9F5", shadowColor: "#2563EB", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  sectionTitle: { color: "#0F1E33", fontSize: 16, fontWeight: "800", marginBottom: 12 },
  orderRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  productImage: { width: 52, height: 52, borderRadius: 10, backgroundColor: "#F4F7FC" },
  orderInfo: { flex: 1, marginLeft: 10 },
  productName: { color: "#0F1E33", fontSize: 13, fontWeight: "700" },
  quantity: { color: "#8A97AC", fontSize: 12, marginTop: 3 },
  lineTotal: { color: "#2563EB", fontSize: 13, fontWeight: "800" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#EAF1FB", paddingTop: 12, marginTop: 4 },
  totalLabel: { color: "#5B6B85", fontSize: 14, fontWeight: "700" },
  totalValue: { color: "#0F1E33", fontSize: 20, fontWeight: "900" },
  label: { color: "#0F1E33", fontSize: 12, fontWeight: "700", marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: "#F9FBFF", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: "#D7E5F6", color: "#0F1E33", fontSize: 13 },
  addressInput: { minHeight: 78, textAlignVertical: "top" },
  bankBox: { backgroundColor: "#EEF6FF", borderRadius: 12, padding: 13, borderLeftWidth: 4, borderLeftColor: "#2563EB" },
  bankName: { color: "#0F1E33", fontWeight: "800", fontSize: 14 },
  bankDetail: { color: "#1D4ED8", fontWeight: "700", marginTop: 4, fontSize: 13 },
  bankHint: { color: "#5B6B85", marginTop: 5, fontSize: 12 },
  uploadButton: { alignItems: "center", justifyContent: "center", minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: "#93C5FD", backgroundColor: "#EFF6FF", paddingHorizontal: 12 },
  uploadButtonText: { color: "#1D4ED8", fontWeight: "800", fontSize: 13, textAlign: "center" },
  slipPreview: { width: "100%", height: 150, marginTop: 10, borderRadius: 10, backgroundColor: "#F4F7FC" },
  primaryButton: { minHeight: 52, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#2563EB", marginTop: 4, shadowColor: "#2563EB", shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  primaryButtonText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  disabledButton: { opacity: 0.65 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F7FC", padding: 24 },
  emptyTitle: { color: "#0F1E33", fontSize: 20, fontWeight: "800", marginBottom: 18 },
  successWrap: { alignItems: "center", padding: 20, paddingTop: 46, paddingBottom: 140 },
  successHero: { alignItems: "center", width: "100%", marginBottom: 20 },
  successIconOuter: { width: 94, height: 94, borderRadius: 47, alignItems: "center", justifyContent: "center", backgroundColor: "#DCFCE7", shadowColor: "#16A34A", shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 8 },
  successIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#16A34A", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#86EFAC" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#FEF3C7", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, marginTop: 14 },
  statusPillText: { color: "#B45309", fontSize: 11, fontWeight: "800" },
  successTitle: { color: "#0F1E33", fontSize: 25, fontWeight: "900", marginTop: 14 },
  successSubtitle: { color: "#5B6B85", fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 6, maxWidth: 320 },
  receiptCard: { width: "100%", backgroundColor: "#fff", borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "#D7E5F6", shadowColor: "#0F1E33", shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  receiptHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  receiptIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#EAF1FB" },
  receiptLabel: { color: "#8A97AC", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  receiptValue: { color: "#0F1E33", fontSize: 16, fontWeight: "800", marginTop: 4 },
  receiptSecondary: { color: "#5B6B85", fontSize: 13, marginTop: 3 },
  divider: { height: 1, backgroundColor: "#EAF1FB", marginVertical: 14 },
  successTotalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
