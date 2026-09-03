import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
    Easing,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { useApp } from "../context/AppContext";

// 💫 วงแหวนเรืองแสงเต้นจังหวะ (radar ping) ใช้ดึงความสนใจแบบเบาๆ ไม่รบกวนสายตา
function PulseGlow({ color, size = 44 }: { color: string; size?: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }), -1, false);
  }, [progress]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - progress.value),
    transform: [{ scale: 1 + progress.value * 0.6 }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          pointerEvents: "none",
        },
        ringStyle,
      ]}
    />
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { products, user, lowStockProducts } = useApp();

  if (!user || user.role !== "admin") {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="shield-outline" size={72} color="#DC2626" />
        <Text style={styles.errorText}>Access Denied: Restricted to Administrator</Text>
        <AnimatedPressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Return to Safe Zone</Text>
        </AnimatedPressable>
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

  const graphData: Array<{ label: string; height: number; colors: [string, string] }> = [
    { label: "Confirmed", height: 55, colors: ["#34D399", "#059669"] },
    { label: "Pooled", height: 85, colors: ["#4ADE80", "#16A34A"] },
    { label: "Refunded", height: 15, colors: ["#F87171", "#DC2626"] },
    { label: "Shipped", height: 95, colors: ["#7DD3FC", "#0EA5E9"] },
  ];

  const miniCards: Array<{
    key: string;
    icon: keyof typeof Ionicons.glyphMap;
    value: string | number;
    label: string;
    iconColor: string;
    gradient: [string, string];
    valueColor?: string;
  }> = [
    { key: "items", icon: "cube", value: dashboardData.newItems, label: "STORE ITEMS", iconColor: "#2563EB", gradient: ["#EFF6FF", "#DBEAFE"] },
    { key: "orders", icon: "cart", value: dashboardData.newOrders, label: "NEW ORDERS", iconColor: "#16A34A", gradient: ["#ECFDF5", "#D1FAE5"] },
    { key: "refunds", icon: "refresh-circle", value: dashboardData.refunds, label: "REFUND REQ.", iconColor: "#DC2626", gradient: ["#FEF2F2", "#FEE2E2"], valueColor: "#DC2626" },
    { key: "messages", icon: "chatbubbles", value: dashboardData.messages, label: "INCOMING MSG", iconColor: "#D97706", gradient: ["#FFFBEB", "#FEF3C7"] },
    { key: "clients", icon: "people", value: dashboardData.activeUsers, label: "ACTIVE CLIENTS", iconColor: "#7C3AED", gradient: ["#FAF5FF", "#F3E8FF"] },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* 🌈 Gradient Header */}
      <LinearGradient colors={["#4F46E5", "#7C3AED"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
        <AnimatedPressable style={styles.backIconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>POWER PLUGS DASHBOARD</Text>
        <View style={styles.avatarRing}>
          <View style={styles.avatarGlow}>
            <Text style={styles.avatarText}>A</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ⚠️ แจ้งเตือนสต็อกใกล้หมด */}
        {lowStockProducts.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <AnimatedPressable
              style={styles.lowStockCard}
              activeOpacity={0.85}
              onPress={() => router.push("/admin-products")}
            >
              <LinearGradient
                colors={["#FEF3C7", "#FDE68A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.lowStockHeader}>
                <View style={styles.lowStockIconWrapper}>
                  <PulseGlow color="#D97706" size={40} />
                  <Ionicons name="warning" size={18} color="#D97706" />
                </View>
                <Text style={styles.lowStockTitle}>
                  Low stock alert · {lowStockProducts.length} item{lowStockProducts.length > 1 ? "s" : ""}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#92400E" />
              </View>
              {lowStockProducts.slice(0, 3).map((p) => (
                <View key={p.id} style={styles.lowStockRow}>
                  <Text style={styles.lowStockName} numberOfLines={1}>{p.name}</Text>
                  <Text style={[styles.lowStockQty, p.stock <= 0 && styles.lowStockQtyOut]}>
                    {p.stock <= 0 ? "Out of stock" : `${p.stock} left`}
                  </Text>
                </View>
              ))}
              {lowStockProducts.length > 3 && (
                <Text style={styles.lowStockMore}>+{lowStockProducts.length - 3} more</Text>
              )}
            </AnimatedPressable>
          </Animated.View>
        )}

        {/* 💎 การ์ดยอดขาย - Gradient แบบมีมิติ */}
        <Animated.View entering={FadeInDown.duration(450).delay(60)}>
          <LinearGradient
            colors={["#4F46E5", "#7C3AED", "#DB2777"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glassCard}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardSub}>NET REVENUE</Text>
              <View style={styles.coinBadge}>
                <Ionicons name="logo-bitcoin" size={20} color="#FCD34D" />
              </View>
            </View>
            <Text style={styles.revenueMain}>฿{dashboardData.totalSales.toLocaleString()}</Text>
            <View style={styles.cardFooter}>
              <View style={styles.liveTagPill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveTag}>LIVE UPDATE</Text>
              </View>
              <Text style={styles.percentageText}>+18.4% from last week</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Real-time Terminal Activity */}
        <Text style={styles.sectionTitle}>Real-time Terminal Activity</Text>
        <View style={styles.gridContainer}>
          {miniCards.map((card, index) => (
            <Animated.View
              key={card.key}
              style={styles.miniCardSlot}
              entering={FadeInDown.duration(400).delay(120 + index * 70)}
            >
              <LinearGradient colors={card.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.luxuryMiniCard}>
                <View style={[styles.miniIconWrapper, { backgroundColor: card.iconColor, shadowColor: card.iconColor }]}>
                  <Ionicons name={card.icon} size={18} color="#fff" />
                </View>
                <Text style={[styles.miniNumber, card.valueColor && { color: card.valueColor }]}>{card.value}</Text>
                <Text style={styles.miniLabel}>{card.label}</Text>
                <View style={[styles.miniAccentBar, { backgroundColor: card.iconColor }]} />
              </LinearGradient>
            </Animated.View>
          ))}

          <Animated.View style={styles.miniCardSlot} entering={FadeInDown.duration(400).delay(120 + miniCards.length * 70)}>
            <AnimatedPressable activeOpacity={0.85}>
              <LinearGradient colors={["#22C55E", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.luxuryMiniCard, styles.actionCard]}>
                <View style={styles.actionIconWrapper}>
                  <PulseGlow color="#ffffff" size={40} />
                  <Ionicons name="sparkles" size={22} color="#fff" />
                </View>
                <Text style={styles.actionText}>SYSTEM OPTIMIZE</Text>
              </LinearGradient>
            </AnimatedPressable>
          </Animated.View>
        </View>

        {/* กราฟสถิติ */}
        <Text style={styles.sectionTitle}>Sales Volume & Logistics Analytics</Text>
        <Animated.View style={styles.premiumChartContainer} entering={FadeInDown.duration(450).delay(120 + (miniCards.length + 1) * 70)}>
          <View style={styles.chartLineBackground}>
            <View style={styles.dashedLine} />
            <View style={styles.dashedLine} />
            <View style={styles.dashedLine} />
          </View>
          <View style={styles.chartArea}>
            {graphData.map((item, index) => (
              <View key={index} style={styles.barWrapper}>
                <View style={styles.barTrack}>
                  <LinearGradient
                    colors={item.colors}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={[styles.barCore, { height: `${item.height}%` }]}
                  >
                    <View style={[styles.barPeakDot, { backgroundColor: item.colors[0], shadowColor: item.colors[1] }]} />
                  </LinearGradient>
                </View>
                <Text style={styles.barLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, shadowColor: "#4F46E5", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  backIconButton: { padding: 8, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 12 },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 1 },
  avatarRing: { padding: 2, borderRadius: 20, borderWidth: 2, borderColor: "rgba(255,255,255,0.5)" },
  avatarGlow: { width: 32, height: 32, backgroundColor: "#16A34A", borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "900", fontSize: 14 },

  /* ปรับระยะเผื่อไว้ 100 ให้พอดีกับความสูงของแถบเมนูลอยตัวหลัก ไม่ให้บังเนื้อหาด้านล่าง */
  scrollContent: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#5B6B85", textTransform: "uppercase", letterSpacing: 1, marginTop: 24, marginBottom: 12 },

  /* ⚠️ Low Stock Alert Card */
  lowStockCard: { borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#FCD34D", marginBottom: 20, overflow: "hidden", shadowColor: "#D97706", shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  lowStockHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  lowStockIconWrapper: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#FEF3C7", alignItems: "center", justifyContent: "center" },
  lowStockTitle: { flex: 1, fontSize: 13, fontWeight: "800", color: "#92400E" },
  lowStockRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingLeft: 40 },
  lowStockName: { flex: 1, fontSize: 13, color: "#78350F", marginRight: 8 },
  lowStockQty: { fontSize: 12, fontWeight: "800", color: "#D97706" },
  lowStockQtyOut: { color: "#DC2626" },
  lowStockMore: { fontSize: 11, color: "#92400E", fontWeight: "700", marginTop: 8, paddingLeft: 40 },

  /* Cards & Grid */
  glassCard: { borderRadius: 20, padding: 20, shadowColor: "#7C3AED", shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardSub: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  coinBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  revenueMain: { color: "#fff", fontSize: 32, fontWeight: "900", marginTop: 8, letterSpacing: -0.5 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  liveTagPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ADE80" },
  liveTag: { color: "#fff", fontSize: 11, fontWeight: "800" },
  percentageText: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600" },

  gridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  miniCardSlot: { width: "48%" },
  luxuryMiniCard: { borderRadius: 16, padding: 16, shadowColor: "#8A97AC", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2, overflow: "hidden" },
  miniIconWrapper: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 12, shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  miniNumber: { fontSize: 24, fontWeight: "900", color: "#0F1E33", letterSpacing: -0.5 },
  miniLabel: { fontSize: 10, fontWeight: "700", color: "#5B6B85", marginTop: 4, letterSpacing: 0.5 },
  miniAccentBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  actionCard: { justifyContent: "center", alignItems: "center" },
  actionIconWrapper: { alignItems: "center", justifyContent: "center", width: 44, height: 44 },
  actionText: { color: "#fff", fontSize: 11, fontWeight: "800", marginTop: 8, letterSpacing: 1 },

  /* Chart */
  premiumChartContainer: { backgroundColor: "#ffffff", borderRadius: 20, padding: 20, height: 220, borderWidth: 1, borderColor: "#E2E9F5", position: "relative", justifyContent: "flex-end", shadowColor: "#8A97AC", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  chartLineBackground: { position: "absolute", top: 20, left: 20, right: 20, bottom: 50, justifyContent: "space-between", zIndex: 0 },
  dashedLine: { width: "100%", height: 1, backgroundColor: "#EAF1FB" },
  chartArea: { flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end", height: "100%", width: "100%", zIndex: 1 },
  barWrapper: { alignItems: "center", flex: 1 },
  barTrack: { width: 16, height: 140, backgroundColor: "#EAF1FB", borderRadius: 10, justifyContent: "flex-end", overflow: "hidden" },
  barCore: { width: "100%", borderRadius: 10, alignItems: "center" },
  barPeakDot: { width: 10, height: 10, borderRadius: 5, marginTop: -5, shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  barLabel: { fontSize: 11, color: "#5B6B85", fontWeight: "700", marginTop: 12 },
});
