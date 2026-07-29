import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Product, useApp } from "../context/AppContext";

export default function AdminProducts() {
  const { products, user, deleteProduct, updateProduct } = useApp();
  const router = useRouter();

  // ✏️ State สำหรับแก้ไขสินค้า
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editOldPrice, setEditOldPrice] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editImage, setEditImage] = useState("");
  const [saving, setSaving] = useState(false);

  // 🗑️ State สำหรับ Modal ยืนยันการลบแบบสวยงาม
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 🔐 เช็กสิทธิ์ Admin
  if (!user || user.role !== "admin") {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="lock-closed-outline" size={64} color="#ef4444" />
        <Text style={styles.lockedTitle}>Access Denied</Text>
        <Text style={styles.lockedSubtitle}>
          Admin permission is required to manage products.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 🗑️ เปิด Modal ยืนยันการลบ
  const handleOpenDelete = (product: Product) => {
    setDeletingProduct(product);
  };

  // 🔴 ยืนยันสั่งลบจริงผ่าน API
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    try {
      setDeleting(true);
      await deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setDeleting(false);
    }
  };

  // ✏️ เปิด Modal แก้ไข
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditBrand(p.brand);
    setEditPrice(String(p.price));
    setEditOldPrice(p.oldPrice ? String(p.oldPrice) : "");
    setEditCategory(p.category);
    setEditImage(p.image);
  };

  // 💾 บันทึกการแก้ไข
  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    try {
      setSaving(true);
      await updateProduct(editingProduct.id, {
        name: editName.trim(),
        brand: editBrand.trim(),
        price: Number(editPrice),
        oldPrice: editOldPrice.trim() ? Number(editOldPrice) : null,
        category: editCategory,
        image: editImage.trim(),
      });
      setEditingProduct(null);
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/add")}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* List รายการสินค้า */}
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.productRow}>
            <Image
              source={{ uri: item.image }}
              style={styles.productImg}
              resizeMode="contain"
            />
            <View style={styles.productInfo}>
              <Text style={styles.brand}>{item.brand}</Text>
              <Text style={styles.productName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.price}>฿{item.price.toLocaleString()}</Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => handleOpenEdit(item)}
              >
                <Ionicons name="pencil" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleOpenDelete(item)}
              >
                <Ionicons name="trash" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* ⚠️ DELETE CONFIRMATION MODAL (แบบมืออาชีพ สวยงาม) */}
      <Modal visible={!!deletingProduct} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.warningIconBg}>
              <Ionicons name="trash-outline" size={32} color="#ef4444" />
            </View>
            <Text style={styles.deleteTitle}>Delete Product?</Text>
            <Text style={styles.deleteSubtitle}>
              Are you sure you want to delete{" "}
              <Text style={{ fontWeight: "700", color: "#0f172a" }}>
                "{deletingProduct?.name}"
              </Text>
              ? This action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setDeletingProduct(null)}
                disabled={deleting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmDeleteBtnText}>Yes, Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 📝 EDIT PRODUCT MODAL */}
      <Modal visible={!!editingProduct} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Product</Text>

            <ScrollView style={{ maxHeight: 380 }}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
              />
              <Text style={styles.inputLabel}>Brand</Text>
              <TextInput
                style={styles.modalInput}
                value={editBrand}
                onChangeText={setEditBrand}
              />
              <Text style={styles.inputLabel}>Price (฿)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={editPrice}
                onChangeText={setEditPrice}
              />
              <Text style={styles.inputLabel}>Old Price (฿)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={editOldPrice}
                onChangeText={setEditOldPrice}
              />
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.modalInput}
                value={editCategory}
                onChangeText={setEditCategory}
              />
              <Text style={styles.inputLabel}>Image URL</Text>
              <TextInput
                style={styles.modalInput}
                value={editImage}
                onChangeText={setEditImage}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditingProduct(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveEdit}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  lockedTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", marginTop: 12 },
  lockedSubtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  backBtn: { marginTop: 20, backgroundColor: "#0284c7", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backBtnText: { color: "#fff", fontWeight: "700" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  addBtn: { backgroundColor: "#0284c7", padding: 6, borderRadius: 8 },
  productRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  productImg: { width: 60, height: 60, borderRadius: 8, backgroundColor: "#f1f5f9" },
  productInfo: { flex: 1, marginLeft: 12 },
  brand: { fontSize: 10, color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" },
  productName: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  price: { fontSize: 14, fontWeight: "800", color: "#0284c7", marginTop: 2 },
  actionButtons: { flexDirection: "row", gap: 8 },
  editBtn: { backgroundColor: "#f59e0b", padding: 8, borderRadius: 8 },
  deleteBtn: { backgroundColor: "#ef4444", padding: 8, borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "center", alignItems: "center" },
  
  // 🗑️ Delete Modal Styling
  deleteModalContent: { backgroundColor: "#fff", width: "90%", maxWidth: 400, borderRadius: 20, padding: 24, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 10 },
  warningIconBg: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#fef2f2", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  deleteTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 8 },
  deleteSubtitle: { fontSize: 14, color: "#64748b", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  confirmDeleteBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: "#ef4444" },
  confirmDeleteBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // ✏️ Edit Modal Styling
  modalContent: { backgroundColor: "#fff", width: "90%", maxWidth: 450, borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 12, color: "#0f172a" },
  inputLabel: { fontSize: 12, fontWeight: "700", color: "#475569", marginTop: 8 },
  modalInput: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, marginTop: 2 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16, width: "100%" },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "#f1f5f9" },
  cancelBtnText: { color: "#475569", fontWeight: "700", fontSize: 14 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "#0284c7" },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});