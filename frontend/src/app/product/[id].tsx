import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "../../components/AnimatedPressable";
import { LOW_STOCK_THRESHOLD, useApp } from "../../context/AppContext";
import { showAlert } from "../../utils/crossPlatformAlert";

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    products,
    adminProducts,
    user,
    cart,
    addToCart,
    updateQuantity,
    favorites,
    toggleFavorite,
    updateProduct,
    deleteProduct,
  } = useApp();
  const isAdmin = user?.role === "admin";

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editOldPrice, setEditOldPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const product = (isAdmin ? adminProducts : products).find((p) => p.id === String(id));

  if (!product) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Ionicons name="alert-circle-outline" size={56} color="#8A97AC" />
        <Text style={styles.notFoundText}>Product not found.</Text>
        <AnimatedPressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </AnimatedPressable>
      </SafeAreaView>
    );
  }

  const formatPrice = (n: number) => `฿${n.toLocaleString()}`;
  const isFav = favorites.includes(product.id);
  const qty = cart.find((c) => c.productId === product.id)?.quantity ?? 0;
  const discountPercent = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;

  const handleOpenEdit = () => {
    setEditName(product.name);
    setEditBrand(product.brand);
    setEditPrice(String(product.price));
    setEditOldPrice(product.oldPrice ? String(product.oldPrice) : "");
    setEditStock(String(product.stock ?? 0));
    setEditCategory(product.category);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      await updateProduct(product.id, {
        name: editName.trim(),
        brand: editBrand.trim(),
        price: Number(editPrice),
        oldPrice: editOldPrice.trim() ? Number(editOldPrice) : null,
        stock: Number(editStock) || 0,
        category: editCategory,
      });
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update product.";
      showAlert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await deleteProduct(product.id);
      setIsDeleting(false);
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete product.";
      showAlert("Error", message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <AnimatedPressable style={styles.headerIconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0F1E33" />
        </AnimatedPressable>
        <AnimatedPressable style={styles.headerIconBtn} onPress={() => toggleFavorite(product.id)}>
          <Ionicons name={isFav ? "heart" : "heart-outline"} size={22} color={isFav ? "#DC2626" : "#0F1E33"} />
        </AnimatedPressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: product.image }} style={styles.image} resizeMode="contain" />
          {product.oldPrice ? (
            <View style={styles.discountTag}>
              <Text style={styles.discountText}>-{discountPercent}%</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#eab308" />
            <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{product.category}</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {product.oldPrice ? <Text style={styles.oldPrice}>{formatPrice(product.oldPrice)}</Text> : null}
          </View>

          {product.stock <= 0 ? (
            <View style={[styles.stockBadge, styles.stockOut]}>
              <Ionicons name="close-circle" size={14} color="#DC2626" />
              <Text style={[styles.stockText, styles.stockOutText]}>Out of stock</Text>
            </View>
          ) : product.stock <= LOW_STOCK_THRESHOLD ? (
            <View style={[styles.stockBadge, styles.stockLow]}>
              <Ionicons name="alert-circle" size={14} color="#D97706" />
              <Text style={[styles.stockText, styles.stockLowText]}>Only {product.stock} left — order soon</Text>
            </View>
          ) : (
            <View style={[styles.stockBadge, styles.stockIn]}>
              <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
              <Text style={[styles.stockText, styles.stockInText]}>In stock</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Specifications</Text>
          <View style={styles.specCard}>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Brand</Text>
              <Text style={styles.specValue}>{product.brand}</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Category</Text>
              <Text style={styles.specValue}>{product.category}</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Rating</Text>
              <Text style={styles.specValue}>{product.rating.toFixed(1)} / 5.0</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Availability</Text>
              <Text style={styles.specValue}>{product.stock > 0 ? `${product.stock} units` : "Out of stock"}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* แถบปุ่มด้านล่าง: ลูกค้าเห็นปุ่มสั่งซื้อ / แอดมินเห็นปุ่มจัดการสินค้าแทน */}
      {isAdmin ? (
        <View style={styles.bottomBar}>
          <AnimatedPressable style={styles.editButton} onPress={handleOpenEdit}>
            <Ionicons name="pencil" size={16} color="#fff" />
            <Text style={styles.editButtonText}>Edit</Text>
          </AnimatedPressable>
          <AnimatedPressable style={styles.deleteButton} onPress={() => setIsDeleting(true)}>
            <Ionicons name="trash" size={16} color="#fff" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </AnimatedPressable>
        </View>
      ) : (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomBarLabel}>Price</Text>
            <Text style={styles.bottomBarPrice}>{formatPrice(product.price)}</Text>
          </View>

          {product.stock <= 0 ? (
            <View style={styles.disabledButton}>
              <Text style={styles.disabledButtonText}>Out of stock</Text>
            </View>
          ) : qty === 0 ? (
            <AnimatedPressable style={styles.addButton} onPress={() => addToCart(product.id)}>
              <Ionicons name="cart" size={16} color="#fff" />
              <Text style={styles.addButtonText}>Add to cart</Text>
            </AnimatedPressable>
          ) : (
            <View style={styles.stepper}>
              <AnimatedPressable style={styles.stepperBtn} onPress={() => updateQuantity(product.id, qty - 1)}>
                <Ionicons name="remove" size={16} color="#1D4ED8" />
              </AnimatedPressable>
              <Text style={styles.stepperQty}>{qty}</Text>
              <AnimatedPressable style={styles.stepperBtn} onPress={() => updateQuantity(product.id, qty + 1)}>
                <Ionicons name="add" size={16} color="#1D4ED8" />
              </AnimatedPressable>
            </View>
          )}
        </View>
      )}

      {/* ✏️ Edit Product Modal (แอดมิน) */}
      <Modal visible={isEditing} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Product</Text>

            <ScrollView style={{ maxHeight: 380 }}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput style={styles.modalInput} value={editName} onChangeText={setEditName} />
              <Text style={styles.inputLabel}>Brand</Text>
              <TextInput style={styles.modalInput} value={editBrand} onChangeText={setEditBrand} />
              <Text style={styles.inputLabel}>Price (฿)</Text>
              <TextInput style={styles.modalInput} keyboardType="numeric" value={editPrice} onChangeText={setEditPrice} />
              <Text style={styles.inputLabel}>Old Price (฿)</Text>
              <TextInput style={styles.modalInput} keyboardType="numeric" value={editOldPrice} onChangeText={setEditOldPrice} />
              <Text style={styles.inputLabel}>Stock</Text>
              <TextInput style={styles.modalInput} keyboardType="numeric" value={editStock} onChangeText={setEditStock} />
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput style={styles.modalInput} value={editCategory} onChangeText={setEditCategory} />
            </ScrollView>

            <View style={styles.modalButtons}>
              <AnimatedPressable style={styles.cancelBtn} onPress={() => setIsEditing(false)} disabled={saving}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </AnimatedPressable>
              <AnimatedPressable style={styles.saveBtn} onPress={handleSaveEdit} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🗑️ Delete Confirmation Modal (แอดมิน) */}
      <Modal visible={isDeleting} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.warningIconBg}>
              <Ionicons name="trash-outline" size={32} color="#DC2626" />
            </View>
            <Text style={styles.deleteTitle}>Delete Product?</Text>
            <Text style={styles.deleteSubtitle}>
              Are you sure you want to delete{" "}
              <Text style={{ fontWeight: "700", color: "#0F1E33" }}>"{product.name}"</Text>? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <AnimatedPressable style={styles.cancelBtn} onPress={() => setIsDeleting(false)} disabled={deleting}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </AnimatedPressable>
              <AnimatedPressable style={styles.confirmDeleteBtn} onPress={handleConfirmDelete} disabled={deleting}>
                {deleting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmDeleteBtnText}>Yes, Delete</Text>}
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" },
  notFoundContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 12, backgroundColor: "#F4F7FC" },
  notFoundText: { fontSize: 15, color: "#5B6B85", fontWeight: "600" },
  backBtn: { backgroundColor: "#2563EB", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  backBtnText: { color: "#fff", fontWeight: "700" },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  headerIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E9F5" },

  scrollContent: { paddingBottom: 140 },
  imageWrapper: { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 20, padding: 16, position: "relative", borderWidth: 1, borderColor: "#E2E9F5" },
  image: { width: "100%", height: 260 },
  discountTag: { position: "absolute", top: 16, left: 16, backgroundColor: "#DC2626", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  discountText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  infoBlock: { padding: 20 },
  brand: { fontSize: 12, color: "#8A97AC", textTransform: "uppercase", fontWeight: "700", letterSpacing: 0.5 },
  name: { fontSize: 22, fontWeight: "800", color: "#0F1E33", marginTop: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  ratingText: { fontSize: 13, color: "#5B6B85", fontWeight: "700" },
  categoryPill: { backgroundColor: "#EAF1FB", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginLeft: 6 },
  categoryPillText: { fontSize: 11, color: "#1D4ED8", fontWeight: "700" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 14 },
  price: { fontSize: 28, fontWeight: "900", color: "#2563EB" },
  oldPrice: { fontSize: 15, color: "#8A97AC", textDecorationLine: "line-through" },

  stockBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginTop: 14 },
  stockIn: { backgroundColor: "#E3F8EA" },
  stockInText: { color: "#16A34A" },
  stockLow: { backgroundColor: "#FEF3C7" },
  stockLowText: { color: "#D97706" },
  stockOut: { backgroundColor: "#FDE7E7" },
  stockOutText: { color: "#DC2626" },
  stockText: { fontSize: 12, fontWeight: "700" },

  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#5B6B85", textTransform: "uppercase", letterSpacing: 1, marginTop: 28, marginBottom: 10 },
  specCard: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#E2E9F5", padding: 4 },
  specRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12 },
  specLabel: { fontSize: 13, color: "#5B6B85", fontWeight: "600" },
  specValue: { fontSize: 13, color: "#0F1E33", fontWeight: "700" },
  specDivider: { height: 1, backgroundColor: "#EAF1FB", marginHorizontal: 14 },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: "#E2E9F5",
    shadowColor: "#0F1E33",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 6,
  },
  bottomBarLabel: { fontSize: 11, color: "#8A97AC", fontWeight: "600" },
  bottomBarPrice: { fontSize: 20, fontWeight: "900", color: "#0F1E33" },
  addButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#2563EB", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, gap: 8 },
  addButtonText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  disabledButton: { backgroundColor: "#E2E9F5", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 },
  disabledButtonText: { color: "#8A97AC", fontSize: 14, fontWeight: "800" },
  stepper: { flexDirection: "row", alignItems: "center", backgroundColor: "#EAF1FB", borderRadius: 14, paddingVertical: 6, paddingHorizontal: 6, gap: 4 },
  stepperBtn: { padding: 10, backgroundColor: "#fff", borderRadius: 10 },
  stepperQty: { color: "#1D4ED8", fontWeight: "800", fontSize: 16, minWidth: 24, textAlign: "center" },

  /* ✏️🗑️ ปุ่มจัดการสินค้าสำหรับแอดมิน (แทนปุ่ม Add to cart) */
  editButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#D97706", borderRadius: 14, paddingVertical: 14, gap: 8, marginRight: 10 },
  editButtonText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  deleteButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#DC2626", borderRadius: 14, paddingVertical: 14, gap: 8 },
  deleteButtonText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  /* Edit / Delete Modals */
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", width: "90%", maxWidth: 450, borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 12, color: "#0F1E33" },
  inputLabel: { fontSize: 12, fontWeight: "700", color: "#5B6B85", marginTop: 8 },
  modalInput: { borderWidth: 1, borderColor: "#E2E9F5", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, marginTop: 2 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16, width: "100%" },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "#EAF1FB" },
  cancelBtnText: { color: "#5B6B85", fontWeight: "700", fontSize: 14 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "#2563EB" },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  deleteModalContent: { backgroundColor: "#fff", width: "90%", maxWidth: 400, borderRadius: 20, padding: 24, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 10 },
  warningIconBg: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#FDE7E7", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  deleteTitle: { fontSize: 20, fontWeight: "800", color: "#0F1E33", marginBottom: 8 },
  deleteSubtitle: { fontSize: 14, color: "#5B6B85", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  confirmDeleteBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: "#DC2626" },
  confirmDeleteBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
