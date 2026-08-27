import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useApp } from "../context/AppContext";
import { showAlert } from "../utils/crossPlatformAlert";
import { uploadImageToGitHub } from "../utils/githubImageUpload";

const CATEGORIES = ["Power Strips", "Smart Plugs", "Adapters"];

export default function AddProduct() {
  const { user, addProduct } = useApp();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [image, setImage] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const handleSubmit = async () => {
    if (!name.trim() || !brand.trim() || !price.trim() || !image.trim()) {
      showAlert("Incomplete information", "Please fill in the plug name, brand, price, and image.");
      return;
    }

    if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
      showAlert("Invalid price", "Please enter a valid selling price.");
      return;
    }

    if (image.startsWith("data:") && image.length > 15_000_000) {
      showAlert("Image is too large", "Please choose a smaller image.");
      return;
    }

    try {
      setLoading(true);

      const parsedPrice = Number(price);
      const parsedOldPrice = oldPrice.trim() ? Number(oldPrice) : null;

      // ถ้าเลือกรูปจากเครื่อง (data URL) ให้อัปโหลดขึ้น GitHub ก่อน แล้วใช้ลิงก์
      // raw.githubusercontent.com แทน เพื่อไม่ให้ backend ของเราต้องรับ
      // request ก้อนใหญ่ (ซึ่งเป็นสาเหตุของ 413 Payload Too Large เดิม)
      let finalImage = image.trim();
      if (finalImage.startsWith("data:")) {
        setUploadingImage(true);
        try {
          finalImage = await uploadImageToGitHub(finalImage, imageFileName || `product-${Date.now()}.jpg`);
        } finally {
          setUploadingImage(false);
        }
      }

      await addProduct({
        name: name.trim(),
        brand: brand.trim(),
        price: parsedPrice,
        oldPrice: parsedOldPrice,
        rating: 5.0,
        category,
        image: finalImage
      } as any);

      showAlert(
        "Successful",
        "Power plug device information has been successfully added to Cloud server.",
        [{
          text: "Agree",
          onPress: () => router.replace("/")
        }]
      );

      setName(""); setBrand(""); setPrice(""); setOldPrice(""); setImage("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add product.";
      console.error("Error adding product:", error);
      showAlert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
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

    setImage(`data:image/jpeg;base64,${compressed.base64}`);
    setImageFileName(asset.fileName || "Selected image");
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
          placeholderTextColor="#8A97AC" 
        />
        
        <Text style={styles.label}>Manufacturer brand</Text>
        <TextInput 
          style={styles.input} 
          value={brand} 
          onChangeText={setBrand} 
          placeholder="Such as Toshino, Anitech, Belkin" 
          placeholderTextColor="#8A97AC" 
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
          placeholderTextColor="#8A97AC" 
        />
        
        <Text style={styles.label}>Original price before discount (if applicable, optional)</Text>
        <TextInput 
          style={styles.input} 
          value={oldPrice} 
          onChangeText={setOldPrice} 
          keyboardType="numeric" 
          placeholder="e.g. 450" 
          placeholderTextColor="#8A97AC" 
        />
        
        <Text style={styles.label}>Product image</Text>
        <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
          <Text style={styles.imagePickerButtonText}>Choose JPEG / PNG from device</Text>
        </TouchableOpacity>
        {imageFileName ? <Text style={styles.selectedFile}>{imageFileName}</Text> : null}
        {image ? <Image source={{ uri: image }} style={styles.imagePreview} resizeMode="contain" /> : null}
        <Text style={styles.orText}>Or enter an image URL</Text>
        <TextInput 
          style={styles.input} 
          value={image} 
          onChangeText={(value) => { setImage(value); setImageFileName(""); }} 
          placeholder="https://images.unsplash.com/photo-..." 
          autoCapitalize="none" 
          placeholderTextColor="#8A97AC" 
        />
        
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" />
              {uploadingImage ? (
                <Text style={styles.submitButtonText}>Uploading image...</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Save and display in the store.</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, backgroundColor: "#F4F7FC" },
  lockedTitle: { fontSize: 18, fontWeight: "700", color: "#0F1E33", marginBottom: 8 },
  lockedSubtitle: { fontSize: 13, color: "#5B6B85", textAlign: "center", marginBottom: 20 },
  lockedButton: { backgroundColor: "#2563EB", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  lockedButtonText: { color: "#fff", fontWeight: "700" },
  
  form: { padding: 20, paddingBottom: 140 },
  header: { fontSize: 20, fontWeight: "800", marginBottom: 20, color: "#0F1E33", letterSpacing: 0.5 },
  label: { fontSize: 13, fontWeight: "700", color: "#0F1E33", marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: "#E2E9F5", fontSize: 14, color: "#0F1E33" },
  
  categoryRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E9F5" },
  catChipActive: { backgroundColor: "#38BDF8", borderColor: "#38BDF8" },
  catChipText: { fontSize: 13, color: "#5B6B85", fontWeight: "600" },
  catChipTextActive: { color: "#fff", fontWeight: "700" },
  
  submitButton: { backgroundColor: "#2563EB", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 32 },
  submitButtonDisabled: { backgroundColor: "#8A97AC" },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  imagePickerButton: { backgroundColor: "#EAF1FB", borderWidth: 1, borderColor: "#BFD3F2", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  imagePickerButtonText: { color: "#1D4ED8", fontWeight: "700", fontSize: 14 },
  selectedFile: { color: "#16A34A", fontSize: 12, marginTop: 6 },
  imagePreview: { width: "100%", height: 160, marginTop: 10, borderRadius: 10, backgroundColor: "#fff" },
  orText: { color: "#5B6B85", fontSize: 12, marginTop: 10, marginBottom: 2 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 }
});