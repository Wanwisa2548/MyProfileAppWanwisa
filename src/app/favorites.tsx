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
          <Ionicons name="heart-outline" size={48} color="#ccc" />
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
                    <Ionicons name="heart" size={22} color="#e63946" />
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
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { fontSize: 20, fontWeight: "700", color: "#222", padding: 16, paddingBottom: 0 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#999", marginTop: 10, fontSize: 14 },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, padding: 10, marginBottom: 12, alignItems: "center" },
  image: { width: 70, height: 70, borderRadius: 10 },
  brand: { fontSize: 11, color: "#999", textTransform: "uppercase" },
  name: { fontSize: 14, fontWeight: "700", color: "#222" },
  price: { color: "#bfa14a", fontWeight: "700", marginTop: 2 },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  addBtn: { backgroundColor: "#000", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  addBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});