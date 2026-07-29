import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useApp } from "../context/AppContext";

// 🔌 หมวดหมู่เฉพาะเรื่องปลั๊กไฟและอุปกรณ์ไฟฟ้า
const CATEGORIES = ["Power Strips", "Smart Plugs", "Adapters"];

export default function AddProduct() {
  const { user, addProduct } = useApp();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [loading, setLoading] = useState(false); // ⏳ สถานะกำลังบันทึกข้อมูล

  // 🔐 ตรวจสอบสิทธิ์ Admin
  if (!user || user.role !== "admin") {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.lockedTitle}>
          {!user ? "Log in before adding products" : "Admin only"}
        </Text>
        <Text style={styles.lockedSubtitle}>
          {!user 
            ? "You must log in before you can add a new power plug system" 
            : "Your account does not have permission to manage the power plug inventory."}
        </Text>
        <TouchableOpacity style={styles.lockedButton} onPress={() => router.push("/login")}>
          <Text style={styles.lockedButtonText}>Go to the login page.</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 🚀 ส่งข้อมูลไปยัง Cloud API
  const handleSubmit = async () => {
    if (!name.trim() || !brand.trim() || !price.trim() || !image.trim()) {
      Alert.alert("Incomplete information", "Please fill in the plug name, brand, price, and image link.");
      return;
    }

    try {
      setLoading(true); // เปิดตัวหมุนรอ

      const parsedPrice = Number(price);
      const parsedOldPrice = oldPrice.trim() ? Number(oldPrice) : null;

      // Call addProduct (Async/Await)
      await addProduct({ 
        name: name.trim(), 
        brand: brand.trim(), 
        price: parsedPrice, 
        oldPrice: parsedOldPrice,
        // ✨ ส่งแบบ snake_case เผื่อไว้กรณี Supabase ใช้ชื่อคอลัมน์ old_price
        ...(parsedOldPrice !== null && { old_price: parsedOldPrice }), 
        rating: 5.0, 
        category, 
        image: image.trim() 
      } as any);

      Alert.alert(
        "Successful", 
        "Power plug device information has been successfully added to Cloud server.", 
        [{ 
          text: "Agree", 
          // ✨ เปลี่ยนเป็น replace เพื่อไม่ให้กด Back กลับมาหน้าเพิ่มได้อีก
          onPress: () => router.replace("/") 
        }]
      );

      // เคลียร์ค่าใน ฟอร์ม
      setName(""); setBrand(""); setPrice(""); setOldPrice(""); setImage("");
    } catch (error) {
      Alert.alert("Error", "Failed to add product. Please check your connection.");
    } finally {
      setLoading(false); // ปิดตัวหมุนรอ
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.header}>Added new power plug products.</Text>
        
        <Text style={styles.label}>Product Name/Model</Text>
        <TextInput 
          style={styles.input} 
          value={name} 
          onChangeText={setName} 
          placeholder="Such as the Smart Plug Wi-Fi IoT V2 or extra fire-resistant strip." 
          placeholderTextColor="#94a3b8" 
        />
        
        <Text style={styles.label}>Manufacturer brand</Text>
        <TextInput 
          style={styles.input} 
          value={brand} 
          onChangeText={setBrand} 
          placeholder="Such as Toshino, Anitech, Belkin" 
          placeholderTextColor="#94a3b8" 
        />
        
        <Text style={styles.label}>Equipment Category</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity 
              key={c} 
              style={[styles.catChip, category === c && styles.catChipActive]} 
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.catChipText, category === c && styles.catChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.label}>Selling price (Baht)</Text>
        <TextInput 
          style={styles.input} 
          value={price} 
          onChangeText={setPrice} 
          keyboardType="numeric" 
          placeholder="e.g. 350" 
          placeholderTextColor="#94a3b8" 
        />
        
        <Text style={styles.label}>Original price before discount (if applicable, optional)</Text>
        <TextInput 
          style={styles.input} 
          value={oldPrice} 
          onChangeText={setOldPrice} 
          keyboardType="numeric" 
          placeholder="e.g. 450" 
          placeholderTextColor="#94a3b8" 
        />
        
        <Text style={styles.label}>Product image link (URL)</Text>
        <TextInput 
          style={styles.input} 
          value={image} 
          onChangeText={setImage} 
          placeholder="https://images.unsplash.com/photo-..." 
          autoCapitalize="none" 
          placeholderTextColor="#94a3b8" 
        />
        
        {/* ปุ่มบันทึก พร้อมแสดงสถานะ Loading */}
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Save and display in the store.</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, backgroundColor: "#f8fafc" },
  lockedTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 8 },
  lockedSubtitle: { fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 20 },
  lockedButton: { backgroundColor: "#0284c7", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  lockedButtonText: { color: "#fff", fontWeight: "700" },
  
  form: { padding: 20 },
  header: { fontSize: 20, fontWeight: "800", marginBottom: 20, color: "#0f172a", letterSpacing: 0.5 },
  label: { fontSize: 13, fontWeight: "700", color: "#334155", marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: "#cbd5e1", fontSize: 14, color: "#0f172a" },
  
  categoryRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0" },
  catChipActive: { backgroundColor: "#0ea5e9", borderColor: "#0ea5e9" },
  catChipText: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  catChipTextActive: { color: "#fff", fontWeight: "700" },
  
  submitButton: { backgroundColor: "#0284c7", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 32 },
  submitButtonDisabled: { backgroundColor: "#94a3b8" },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 }
});