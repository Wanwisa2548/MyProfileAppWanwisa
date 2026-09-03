import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    ScrollView,
    Switch,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { LOW_STOCK_THRESHOLD, Product, useApp } from "../context/AppContext";
import { showAlert } from "../utils/crossPlatformAlert";
import { mirrorImageUrlToGitHub, uploadImageToGitHub } from "../utils/githubImageUpload";

export default function AdminProducts() {
  const { adminProducts, user, deleteProduct, updateProduct, toggleProductStatus } = useApp();
  const router = useRouter();

  // ✏️ State สำหรับแก้ไขสินค้า
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editOldPrice, setEditOldPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editImageFileName, setEditImageFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [changingStatusId, setChangingStatusId] = useState<string | null>(null);

  // 🗑️ State สำหรับ Modal ยืนยันการลบแบบสวยงาม
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 🔐 เช็กสิทธิ์ Admin
  if (!user || user.role !== "admin") {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="lock-closed-outline" size={64} color="#DC2626" />
        <Text style={styles.lockedTitle}>Access Denied</Text>
        <Text style={styles.lockedSubtitle}>
          Admin permission is required to manage products.
        </Text>
        <AnimatedPressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </AnimatedPressable>
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
      const message = error instanceof Error ? error.message : "Failed to delete product.";
      console.error("Delete failed", error);
      showAlert("Error", message);
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
    setEditStock(String(p.stock ?? 0));
    setEditCategory(p.category);
    setEditImage(p.image);
    setEditImageFileName("");
  };

  // 🖼️ เลือกรูปใหม่จากเครื่องตอนแก้ไข
  const handleEditPickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert("Permission required", "Please allow access to your photos to choose a product image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    });

    const asset = result.canceled ? null : result.assets[0];
    if (!asset?.uri) return;

    const compressed = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    if (!compressed.base64) return;

    setEditImage(`data:image/jpeg;base64,${compressed.base64}`);
    setEditImageFileName(asset.fileName || "Selected image");
  };

  // 💾 บันทึกการแก้ไข
  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    try {
      setSaving(true);

      // ถ้าเลือกรูปใหม่จากเครื่อง (data URL) ให้อัปโหลดขึ้น GitHub ก่อน แล้วใช้ลิงก์แทน
      // ถ้าเป็น URL รูปจากที่อื่น ก็ดาวน์โหลดมาอัปโหลดขึ้น GitHub เหมือนกัน (ถ้าเป็นลิงก์ GitHub
      // ของ repo นี้อยู่แล้วจะข้ามไม่อัปโหลดซ้ำ)
      let finalImage = editImage.trim();
      if (finalImage.startsWith("data:")) {
        setUploadingEditImage(true);
        try {
          finalImage = await uploadImageToGitHub(finalImage, editImageFileName || `product-${Date.now()}.jpg`);
        } finally {
          setUploadingEditImage(false);
        }
      } else if (/^https?:\/\//i.test(finalImage)) {
        setUploadingEditImage(true);
        try {
          finalImage = await mirrorImageUrlToGitHub(finalImage);
        } finally {
          setUploadingEditImage(false);
        }
      }

      await updateProduct(editingProduct.id, {
        name: editName.trim(),
        brand: editBrand.trim(),
        price: Number(editPrice),
        oldPrice: editOldPrice.trim() ? Number(editOldPrice) : null,
        stock: Number(editStock) || 0,
        category: editCategory,
        image: finalImage,
      });
      setEditingProduct(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update product.";
      console.error("Update failed", err);
      showAlert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (product: Product, nextStatus: boolean) => {
    try {
      setChangingStatusId(product.id);
      await toggleProductStatus(product.id, nextStatus);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update product status.";
      console.error("Status update failed", err);
      showAlert("Error", message);
    } finally {
      setChangingStatusId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F1E33" />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>Inventory Management</Text>
        <AnimatedPressable style={styles.addBtn} onPress={() => router.push("/add")}>
          <Ionicons name="add" size={20} color="#fff" />
        </AnimatedPressable>
      </View>

      {/* List รายการสินค้า */}
      <FlatList
        data={adminProducts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
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
              <View style={styles.badgeRow}>
                <View style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusInactive]}>
                  <Text style={[styles.statusText, item.isActive ? styles.statusActiveText : styles.statusInactiveText]}>
                    {item.isActive ? "Active" : "Inactive"}
                  </Text>
                </View>
                {item.stock <= 0 ? (
                  <View style={[styles.statusBadge, styles.stockOut]}>
                    <Text style={[styles.statusText, styles.stockOutText]}>Out of stock</Text>
                  </View>
                ) : item.stock <= LOW_STOCK_THRESHOLD ? (
                  <View style={[styles.statusBadge, styles.stockLow]}>
                    <Text style={[styles.statusText, styles.stockLowText]}>Low stock: {item.stock}</Text>
                  </View>
                ) : (
                  <Text style={styles.stockNormalText}>Stock: {item.stock}</Text>
                )}
              </View>
            </View>

            <View style={styles.actionButtons}>
              <Switch
                value={item.isActive}
                onValueChange={(nextStatus) => handleToggleStatus(item, nextStatus)}
                disabled={changingStatusId === item.id}
                trackColor={{ false: "#E2E9F5", true: "#86efac" }}
                thumbColor={item.isActive ? "#16a34a" : "#5B6B85"}
              />
              <AnimatedPressable
                style={styles.editBtn}
                onPress={() => handleOpenEdit(item)}
              >
                <Ionicons name="pencil" size={16} color="#fff" />
              </AnimatedPressable>
              <AnimatedPressable
                style={styles.deleteBtn}
                onPress={() => handleOpenDelete(item)}
              >
                <Ionicons name="trash" size={16} color="#fff" />
              </AnimatedPressable>
            </View>
          </View>
        )}
      />

      {/* ⚠️ DELETE CONFIRMATION MODAL (แบบมืออาชีพ สวยงาม) */}
      <Modal visible={!!deletingProduct} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.warningIconBg}>
              <Ionicons name="trash-outline" size={32} color="#DC2626" />
            </View>
            <Text style={styles.deleteTitle}>Delete Product?</Text>
            <Text style={styles.deleteSubtitle}>
              Are you sure you want to delete{" "}
              <Text style={{ fontWeight: "700", color: "#0F1E33" }}>
                "{deletingProduct?.name}"
              </Text>
              ? This action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <AnimatedPressable
                style={styles.cancelBtn}
                onPress={() => setDeletingProduct(null)}
                disabled={deleting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={styles.confirmDeleteBtn}
                onPress={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmDeleteBtnText}>Yes, Delete</Text>
                )}
              </AnimatedPressable>
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
              <Text style={styles.inputLabel}>Stock</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={editStock}
                onChangeText={setEditStock}
              />
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.modalInput}
                value={editCategory}
                onChangeText={setEditCategory}
              />
              <Text style={styles.inputLabel}>Product Image</Text>
              <AnimatedPressable style={styles.imagePickerButton} onPress={handleEditPickImage}>
                <Text style={styles.imagePickerButtonText}>Choose JPEG / PNG from device</Text>
              </AnimatedPressable>
              {editImageFileName ? <Text style={styles.selectedFile}>{editImageFileName}</Text> : null}
              {editImage ? (
                <Image source={{ uri: editImage }} style={styles.editImagePreview} resizeMode="contain" />
              ) : null}
              <Text style={styles.inputLabel}>Or enter an image URL</Text>
              <TextInput
                style={styles.modalInput}
                value={editImage}
                onChangeText={(value) => { setEditImage(value); setEditImageFileName(""); }}
                autoCapitalize="none"
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <AnimatedPressable
                style={styles.cancelBtn}
                onPress={() => setEditingProduct(null)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={styles.saveBtn}
                onPress={handleSaveEdit}
                disabled={saving}
              >
                {saving ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ActivityIndicator color="#fff" />
                    {uploadingEditImage ? (
                      <Text style={styles.saveBtnText}>Uploading image...</Text>
                    ) : null}
                  </View>
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  lockedTitle: { fontSize: 20, fontWeight: "800", color: "#0F1E33", marginTop: 12 },
  lockedSubtitle: { fontSize: 14, color: "#5B6B85", marginTop: 4 },
  backBtn: { marginTop: 20, backgroundColor: "#2563EB", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backBtnText: { color: "#fff", fontWeight: "700" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E2E9F5" },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0F1E33" },
  addBtn: { backgroundColor: "#2563EB", padding: 6, borderRadius: 8 },
  productRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: "#E2E9F5" },
  productImg: { width: 60, height: 60, borderRadius: 8, backgroundColor: "#EAF1FB" },
  productInfo: { flex: 1, marginLeft: 12 },
  brand: { fontSize: 10, color: "#8A97AC", fontWeight: "700", textTransform: "uppercase" },
  productName: { fontSize: 14, fontWeight: "700", color: "#0F1E33" },
  price: { fontSize: 14, fontWeight: "800", color: "#2563EB", marginTop: 2 },
  badgeRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 5 },
  statusBadge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusActive: { backgroundColor: "#E3F8EA" },
  statusInactive: { backgroundColor: "#FDE7E7" },
  statusText: { fontSize: 10, fontWeight: "800" },
  statusActiveText: { color: "#16A34A" },
  statusInactiveText: { color: "#DC2626" },
  stockLow: { backgroundColor: "#FEF3C7" },
  stockLowText: { color: "#D97706" },
  stockOut: { backgroundColor: "#FDE7E7" },
  stockOutText: { color: "#DC2626" },
  stockNormalText: { fontSize: 11, color: "#5B6B85", fontWeight: "600" },
  actionButtons: { flexDirection: "row", gap: 8 },
  editBtn: { backgroundColor: "#D97706", padding: 8, borderRadius: 8 },
  deleteBtn: { backgroundColor: "#DC2626", padding: 8, borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "center", alignItems: "center" },
  
  // 🗑️ Delete Modal Styling
  deleteModalContent: { backgroundColor: "#fff", width: "90%", maxWidth: 400, borderRadius: 20, padding: 24, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 10 },
  warningIconBg: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#FDE7E7", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  deleteTitle: { fontSize: 20, fontWeight: "800", color: "#0F1E33", marginBottom: 8 },
  deleteSubtitle: { fontSize: 14, color: "#5B6B85", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  confirmDeleteBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: "#DC2626" },
  confirmDeleteBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // ✏️ Edit Modal Styling
  modalContent: { backgroundColor: "#fff", width: "90%", maxWidth: 450, borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 12, color: "#0F1E33" },
  inputLabel: { fontSize: 12, fontWeight: "700", color: "#5B6B85", marginTop: 8 },
  modalInput: { borderWidth: 1, borderColor: "#E2E9F5", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, marginTop: 2 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16, width: "100%" },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "#EAF1FB" },
  cancelBtnText: { color: "#5B6B85", fontWeight: "700", fontSize: 14 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "#2563EB" },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  imagePickerButton: { backgroundColor: "#EAF1FB", borderWidth: 1, borderColor: "#BFD3F2", borderRadius: 8, paddingVertical: 10, alignItems: "center", marginTop: 2 },
  imagePickerButtonText: { color: "#1D4ED8", fontWeight: "700", fontSize: 13 },
  selectedFile: { color: "#16A34A", fontSize: 12, marginTop: 6 },
  editImagePreview: { width: "100%", height: 140, marginTop: 10, borderRadius: 8, backgroundColor: "#EAF1FB" },
});
