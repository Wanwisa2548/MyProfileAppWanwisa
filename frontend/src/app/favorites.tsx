import { Ionicons } from "@expo/vector-icons";
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useApp } from "../context/AppContext";

export default function Favorites() {
  const { products, favorites, toggleFavorite, addToCart } = useApp();
  const favProducts = products.filter((p) => favorites.includes(p.id));
  const formatPrice = (n: number) => `฿${n.toLocaleString()}`;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Favorite products</Text>
      {favProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={48} color="#8A97AC" />
          <Text style={styles.emptyText}>There's nothing I like yet.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {favProducts.map((p) => (
            <View key={p.id} style={styles.card}>
              <Image source={{ uri: p.image }} style={styles.image} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.brand}>{p.brand}</Text>
                <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.price}>{formatPrice(p.price)}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(p.id)}>
                    <Text style={styles.addBtnText}>Add to cart</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => toggleFavorite(p.id)}>
                    <Ionicons name="heart" size={22} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" },
  header: { fontSize: 22, fontWeight: "800", color: "#0F1E33", padding: 20, paddingBottom: 4 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyText: { color: "#8A97AC", marginTop: 10, fontSize: 15, fontWeight: "500" },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 16, padding: 12, marginBottom: 12, alignItems: "center", borderWidth: 1, borderColor: "#E2E9F5" },
  image: { width: 72, height: 72, borderRadius: 12, backgroundColor: "#EAF1FB" },
  brand: { fontSize: 11, color: "#8A97AC", textTransform: "uppercase", fontWeight: "700" },
  name: { fontSize: 14, fontWeight: "700", color: "#0F1E33", marginTop: 2 },
  price: { color: "#2563EB", fontWeight: "800", fontSize: 15, marginTop: 4 },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  addBtn: { backgroundColor: "#0A1830", paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  addBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});