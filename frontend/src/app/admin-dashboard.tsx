import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useApp } from "../context/AppContext";

export default function AdminDashboard() {
  const router = useRouter();
  const { products, user } = useApp();

  if (!user || user.role !== "admin") {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="shield-outline" size={72} color="#DC2626" />
        <Text style={styles.errorText}>Access Denied: Restricted to Administrator</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Return to Safe Zone</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const dashboardData = {
    totalSales: 189240,
    newItems: products?.length || 0,
    newOrders: 142,
    refunds: 5,
    messages: 8,
    activeUsers: 1240
  };

  const graphData: Array<{ label: string; height: number; color: string }> = [
    { label: "Confirmed", height: 55, color: "#16A34A" },
    { label: "Pooled", height: 85, color: "#16A34A" },
    { label: "Refunded", height: 15, color: "#DC2626" },
    { label: "Shipped", height: 95, color: "#38BDF8" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Clean Light Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#0F1E33" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PAPENGIE DASHBOARD</Text>
        <View style={styles.avatarGlow}>
          <Text style={styles.avatarText}>A</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* คลีนการ์ด ยอดขาย */}
        <View style={styles.glassCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardSub}>NET REVENUE</Text>
            <Ionicons name="logo-bitcoin" size={24} color="#D97706" />
          </View>
          <Text style={styles.revenueMain}>฿{dashboardData.totalSales.toLocaleString()}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.liveTag}>● LIVE UPDATE</Text>
            <Text style={styles.percentageText}>+18.4% from last week</Text>
          </View>
        </View>

        {/* Real-time Terminal Activity */}
        <Text style={styles.sectionTitle}>Real-time Terminal Activity</Text>
        <View style={styles.gridContainer}>
          <View style={styles.luxuryMiniCard}>
            <View style={[styles.miniIconWrapper, { backgroundColor: "#EAF1FB" }]}>
              <Ionicons name="cube" size={18} color="#2563EB" />
            </View>
            <Text style={styles.miniNumber}>{dashboardData.newItems}</Text>
            <Text style={styles.miniLabel}>STORE ITEMS</Text>
          </View>

          <View style={styles.luxuryMiniCard}>
            <View style={[styles.miniIconWrapper, { backgroundColor: "#d1fae5" }]}>
              <Ionicons name="cart" size={18} color="#16A34A" />
            </View>
            <Text style={styles.miniNumber}>{dashboardData.newOrders}</Text>
            <Text style={styles.miniLabel}>NEW ORDERS</Text>
          </View>

          <View style={styles.luxuryMiniCard}>
            <View style={[styles.miniIconWrapper, { backgroundColor: "#FDE7E7" }]}>
              <Ionicons name="refresh-circle" size={18} color="#dc2626" />
            </View>
            <Text style={[styles.miniNumber, { color: "#DC2626" }]}>{dashboardData.refunds}</Text>
            <Text style={styles.miniLabel}>REFUND REQ.</Text>
          </View>

          <View style={styles.luxuryMiniCard}>
            <View style={[styles.miniIconWrapper, { backgroundColor: "#fef3c7" }]}>
              <Ionicons name="chatbubbles" size={18} color="#d97706" />
            </View>
            <Text style={styles.miniNumber}>{dashboardData.messages}</Text>
            <Text style={styles.miniLabel}>INCOMING MSG</Text>
          </View>

          <View style={styles.luxuryMiniCard}>
            <View style={[styles.miniIconWrapper, { backgroundColor: "#f3e8ff" }]}>
              <Ionicons name="people" size={18} color="#7c3aed" />
            </View>
            <Text style={styles.miniNumber}>{dashboardData.activeUsers}</Text>
            <Text style={styles.miniLabel}>ACTIVE CLIENTS</Text>
          </View>

          <TouchableOpacity style={[styles.luxuryMiniCard, styles.actionCard]} activeOpacity={0.8}>
            <Ionicons name="sparkles" size={24} color="#fff" />
            <Text style={styles.actionText}>SYSTEM OPTIMIZE</Text>
          </TouchableOpacity>
        </View>

        {/* กราฟสถิติ */}
        <Text style={styles.sectionTitle}>Sales Volume & Logistics Analytics</Text>
        <View style={styles.premiumChartContainer}>
          <View style={styles.chartLineBackground}>
            <View style={styles.dashedLine} />
            <View style={styles.dashedLine} />
            <View style={styles.dashedLine} />
          </View>
          <View style={styles.chartArea}>
            {graphData.map((item, index) => (
              <View key={index} style={styles.barWrapper}>
                <View style={styles.barTrack}>
                  <View style={[styles.barCore, { height: `${item.height}%`, backgroundColor: item.color }]} />
                </View>
                <Text style={styles.barLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      
      {/* ✂️ ตัด View floatingTabBar เดิมออกเรียบร้อยแล้วค่ะ เพื่อป้องกันการซ้อนทับกันอีก */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EAF1FB" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#EAF1FB" },
  errorText: { fontSize: 16, color: "#5B6B85", textAlign: "center", marginTop: 16, marginBottom: 24 },
  backBtn: { backgroundColor: "#DC2626", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  backBtnText: { color: "#fff", fontWeight: "700" },

  /* Header */
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, backgroundColor: "#ffffff", borderBottomWidth: 1, borderColor: "#E2E9F5" },
  backIconButton: { padding: 8, backgroundColor: "#EAF1FB", borderRadius: 12 },
  headerTitle: { color: "#0F1E33", fontSize: 16, fontWeight: "900", letterSpacing: 1 },
  avatarGlow: { width: 36, height: 36, backgroundColor: "#16A34A", borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  /* ปรับระยะเผื่อไว้ 100 ให้พอดีกับความสูงของแถบเมนูลอยตัวหลัก ไม่ให้บังเนื้อหาด้านล่าง */
  scrollContent: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#5B6B85", textTransform: "uppercase", letterSpacing: 1, marginTop: 24, marginBottom: 12 },

  /* Cards & Grid */
  glassCard: { backgroundColor: "#ffffff", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#E2E9F5", shadowColor: "#8A97AC", shadowOpacity: 0.1, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardSub: { color: "#5B6B85", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  revenueMain: { color: "#0F1E33", fontSize: 32, fontWeight: "900", marginTop: 8, letterSpacing: -0.5 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderColor: "#EAF1FB" },
  liveTag: { color: "#16A34A", fontSize: 11, fontWeight: "800" },
  percentageText: { color: "#5B6B85", fontSize: 12 },

  gridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  luxuryMiniCard: { width: "48%", backgroundColor: "#ffffff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E2E9F5", shadowColor: "#8A97AC", shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  miniIconWrapper: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  miniNumber: { fontSize: 24, fontWeight: "900", color: "#0F1E33", letterSpacing: -0.5 },
  miniLabel: { fontSize: 10, fontWeight: "700", color: "#5B6B85", marginTop: 4, letterSpacing: 0.5 },
  actionCard: { backgroundColor: "#16A34A", justifyContent: "center", alignItems: "center", borderColor: "transparent" },
  actionText: { color: "#fff", fontSize: 11, fontWeight: "800", marginTop: 8, letterSpacing: 1 },

  /* Chart */
  premiumChartContainer: { backgroundColor: "#ffffff", borderRadius: 20, padding: 20, height: 220, borderWidth: 1, borderColor: "#E2E9F5", position: "relative", justifyContent: "flex-end", shadowColor: "#8A97AC", shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  chartLineBackground: { position: "absolute", top: 20, left: 20, right: 20, bottom: 50, justifyContent: "space-between", zIndex: 0 },
  dashedLine: { width: "100%", height: 1, backgroundColor: "#EAF1FB" },
  chartArea: { flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end", height: "100%", width: "100%", zIndex: 1 },
  barWrapper: { alignItems: "center", flex: 1 },
  barTrack: { width: 16, height: 140, backgroundColor: "#EAF1FB", borderRadius: 10, justifyContent: "flex-end", overflow: "hidden" },
  barCore: { width: "100%", borderRadius: 10 },
  barLabel: { fontSize: 11, color: "#5B6B85", fontWeight: "700", marginTop: 12 },
});