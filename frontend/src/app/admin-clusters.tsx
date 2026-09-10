import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { useApp } from "../context/AppContext";
import { analyzePricesWithKMeans } from "../utils/priceClustering";

const MAX_K = 4;
const CLUSTER_COLORS = ["#16A34A", "#D97706", "#7C3AED", "#DC2626"];
const CLUSTER_LABELS: Record<number, string[]> = {
  1: ["สินค้าทั้งหมด"],
  2: ["ราคาถูก", "ราคาแพง"],
  3: ["ราคาถูก", "ราคากลาง", "ราคาแพง"],
  4: ["ราคาถูกที่สุด", "ราคาถูก", "ราคาแพง", "ราคาแพงที่สุด"],
};

const formatBaht = (n: number) => `฿${Math.round(n).toLocaleString()}`;

export default function AdminClusters() {
  const router = useRouter();
  const { adminProducts, user, fetchAdminProducts } = useApp();
  const [kMode, setKMode] = useState<"auto" | 2 | 3 | 4>("auto");

  // ทุก useMemo ต้องอยู่ก่อน `if (!user...) return` เสมอ — hook ทุกตัวต้องถูกเรียกทุก render
  // ไม่งั้น React จะ error "Rendered more hooks than during the previous render" ตอน session
  // หมดอายุ/สลับ user ระหว่างที่หน้านี้เปิดอยู่ (adminProducts เป็น [] เสมอเวลายังไม่ login จึงคำนวณได้อย่างปลอดภัย)
  const prices = adminProducts.map((p) => p.price);
  const report = useMemo(() => analyzePricesWithKMeans(prices, MAX_K), [prices.join(",")]);
  const availableK = report.inertiaByK.length;
  const effectiveK = Math.min(kMode === "auto" ? report.elbowK : kMode, availableK || 1);
  const assignments = useMemo(() => report.assignmentsForK(effectiveK), [report, effectiveK]);
  const labels = CLUSTER_LABELS[effectiveK] ?? CLUSTER_LABELS[3];

  const groups = useMemo(() => {
    return Array.from({ length: effectiveK }, (_, rank) => {
      const items = adminProducts.filter((_, i) => assignments[i] === rank);
      const groupPrices = items.map((p) => p.price);
      return {
        rank,
        items,
        priceMin: groupPrices.length ? Math.min(...groupPrices) : 0,
        priceMax: groupPrices.length ? Math.max(...groupPrices) : 0,
        priceAvg: groupPrices.length ? groupPrices.reduce((a, b) => a + b, 0) / groupPrices.length : 0,
        totalStock: items.reduce((sum, p) => sum + p.stock, 0),
        stockValue: items.reduce((sum, p) => sum + p.price * p.stock, 0),
      };
    });
  }, [adminProducts, assignments, effectiveK]);

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

  const stocks = adminProducts.map((p) => p.stock);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const minStock = stocks.length ? Math.min(...stocks) : 0;
  const maxStock = stocks.length ? Math.max(...stocks) : 0;
  const priceRange = maxPrice - minPrice || 1;
  const stockRange = maxStock - minStock || 1;

  const maxInertia = Math.max(...report.inertiaByK, 1);
  const maxGroupCount = Math.max(...groups.map((g) => g.items.length), 1);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#0F1E3D", "#1B3A66"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
        <AnimatedPressable style={styles.backIconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </AnimatedPressable>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerEyebrow}>PAPENGIE · AI/ML</Text>
          <Text style={styles.headerTitle}>จัดกลุ่มราคาสินค้า (K-Means)</Text>
        </View>
        <AnimatedPressable style={styles.backIconButton} onPress={() => fetchAdminProducts()}>
          <Ionicons name="refresh-outline" size={20} color="#fff" />
        </AnimatedPressable>
      </LinearGradient>

      {adminProducts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cube-outline" size={56} color="#8A97AC" />
          <Text style={styles.emptyText}>ยังไม่มีสินค้าให้จัดกลุ่ม</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* จำนวนกลุ่ม (k) */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>จำนวนกลุ่ม (k)</Text>
            <Text style={styles.cardSubtitle}>เลือก "อัตโนมัติ" ให้ระบบหาค่า k ด้วย Elbow Method หรือกำหนดเองก็ได้</Text>
            <View style={styles.kRow}>
              {(["auto", 2, 3, 4] as const).map((mode) => {
                const isActive = kMode === mode;
                return (
                  <AnimatedPressable
                    key={mode}
                    style={[styles.kPill, isActive && styles.kPillActive]}
                    onPress={() => setKMode(mode)}
                  >
                    <Text style={[styles.kPillText, isActive && styles.kPillTextActive]}>
                      {mode === "auto" ? "อัตโนมัติ" : `k = ${mode}`}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>สินค้าทั้งหมด {adminProducts.length} รายการ</Text>
              <Text style={styles.summaryText}>
                แบ่งได้ {effectiveK} กลุ่ม{kMode === "auto" ? " (อัตโนมัติ)" : ""}
              </Text>
            </View>
          </View>

          {/* กราฟการจัดกลุ่ม (scatter) */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>กราฟการจัดกลุ่ม</Text>
              <Text style={styles.cardSubtitle}>แกนนอน = ราคา • แกนตั้ง = จำนวนสต็อก</Text>
            </View>
            <View style={styles.scatterArea}>
              <Text style={[styles.axisLabel, styles.axisTopLeft]}>{maxStock}</Text>
              <Text style={[styles.axisLabel, styles.axisBottomLeftY]}>{minStock}</Text>
              {adminProducts.map((p, i) => {
                const xPct = ((p.price - minPrice) / priceRange) * 100;
                const yPct = ((p.stock - minStock) / stockRange) * 100;
                return (
                  <View
                    key={p.id}
                    style={[
                      styles.scatterDot,
                      { left: `${xPct}%`, bottom: `${yPct}%`, backgroundColor: CLUSTER_COLORS[assignments[i]] },
                    ]}
                  />
                );
              })}
            </View>
            <View style={styles.axisXRow}>
              <Text style={styles.axisLabel}>{formatBaht(minPrice)}</Text>
              <Text style={styles.axisLabel}>{formatBaht((minPrice + maxPrice) / 2)}</Text>
              <Text style={styles.axisLabel}>{formatBaht(maxPrice)}</Text>
            </View>
            <View style={styles.legendRow}>
              {groups.map((g) => (
                <View key={g.rank} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: CLUSTER_COLORS[g.rank] }]} />
                  <Text style={styles.legendText}>
                    {labels[g.rank]} ({g.items.length})
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* จำนวนสินค้าในแต่ละกลุ่ม */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>จำนวนสินค้าในแต่ละกลุ่ม</Text>
            {groups.map((g) => (
              <View key={g.rank} style={styles.groupBarRow}>
                <Text style={styles.groupBarLabel} numberOfLines={1}>{labels[g.rank]}</Text>
                <View style={styles.groupBarTrack}>
                  <View
                    style={[
                      styles.groupBarFill,
                      { width: `${(g.items.length / maxGroupCount) * 100}%`, backgroundColor: CLUSTER_COLORS[g.rank] },
                    ]}
                  />
                </View>
                <Text style={styles.groupBarCount}>{g.items.length}</Text>
              </View>
            ))}
          </View>

          {/* Elbow Method */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Elbow Method</Text>
            <Text style={styles.cardSubtitle}>แท่งเตี้ยลงช้าแล้ว = จุดหักศอก</Text>
            <View style={styles.elbowArea}>
              {report.inertiaByK.map((inertia, idx) => {
                const k = idx + 1;
                const isElbow = k === report.elbowK;
                const heightPct = Math.max((inertia / maxInertia) * 100, 2);
                return (
                  <View key={k} style={styles.elbowBarWrapper}>
                    <View style={styles.elbowBarTrack}>
                      <View
                        style={[
                          styles.elbowBarFill,
                          { height: `${heightPct}%`, backgroundColor: isElbow ? "#2563EB" : "#DCE3F5" },
                        ]}
                      />
                    </View>
                    <Text style={[styles.elbowBarLabel, isElbow && styles.elbowBarLabelActive]}>{k}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.elbowCaption}>
              ค่าความคลาดเคลื่อนรวม (Inertia) ของแต่ละค่า k — ระบบเลือก k = {report.elbowK} เป็นจุดคุ้มค่าที่สุด
            </Text>
          </View>

          {/* รายละเอียดแต่ละกลุ่ม */}
          <Text style={styles.sectionTitle}>รายละเอียดแต่ละกลุ่ม</Text>
          {groups.map((g) => (
            <View key={g.rank} style={[styles.groupCard, { borderColor: CLUSTER_COLORS[g.rank] + "55" }]}>
              <View style={styles.groupCardHeader}>
                <View style={[styles.groupPill, { backgroundColor: CLUSTER_COLORS[g.rank] }]}>
                  <Text style={styles.groupPillText}>กลุ่ม {g.rank}</Text>
                </View>
                <Text style={styles.groupCardLabel}>{labels[g.rank]}</Text>
                <Text style={styles.groupCardCount}>{g.items.length} รายการ</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>ช่วงราคา</Text>
                  <Text style={styles.statValue}>{formatBaht(g.priceMin)} - {formatBaht(g.priceMax)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>ราคาเฉลี่ย</Text>
                  <Text style={styles.statValue}>{formatBaht(g.priceAvg)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>สต็อกรวม</Text>
                  <Text style={styles.statValue}>{g.totalStock} ชิ้น</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>มูลค่าสต็อก</Text>
                  <Text style={styles.statValue}>{formatBaht(g.stockValue)}</Text>
                </View>
              </View>

              {g.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemMeta}>{item.brand} • {item.category} • สต็อก {item.stock} ชิ้น</Text>
                  </View>
                  <Text style={[styles.itemPrice, { color: CLUSTER_COLORS[g.rank] }]}>{formatBaht(item.price)}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" },
  centerContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  errorText: { fontSize: 16, color: "#5B6B85", textAlign: "center", marginTop: 16, marginBottom: 24 },
  emptyText: { fontSize: 14, color: "#8A97AC", fontWeight: "600" },
  backBtn: { backgroundColor: "#DC2626", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  backBtnText: { color: "#fff", fontWeight: "700" },

  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  backIconButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12 },
  headerTextBlock: { flex: 1 },
  headerEyebrow: { color: "#7DD3FC", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "900", marginTop: 2 },

  scrollContent: { padding: 16, paddingBottom: 60, gap: 16 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#EAF1FB", shadowColor: "#0F1E33", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#0F1E33" },
  cardSubtitle: { fontSize: 12, color: "#8A97AC", marginTop: 4 },

  kRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  kPill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: "#F4F7FC", borderWidth: 1, borderColor: "#E2E9F5" },
  kPillActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  kPillText: { color: "#5B6B85", fontSize: 13, fontWeight: "700" },
  kPillTextActive: { color: "#fff" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderColor: "#EAF1FB" },
  summaryText: { fontSize: 12, color: "#5B6B85", fontWeight: "600" },

  scatterArea: { height: 200, marginTop: 14, backgroundColor: "#F9FBFE", borderRadius: 12, borderWidth: 1, borderColor: "#EAF1FB", position: "relative", overflow: "hidden" },
  scatterDot: { position: "absolute", width: 12, height: 12, borderRadius: 6, marginLeft: -6, marginBottom: -6, borderWidth: 2, borderColor: "#fff" },
  axisLabel: { fontSize: 10, color: "#8A97AC", fontWeight: "600" },
  axisTopLeft: { position: "absolute", top: 6, left: 8 },
  axisBottomLeftY: { position: "absolute", bottom: 6, left: 8 },
  axisXRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 12, color: "#5B6B85", fontWeight: "600" },

  groupBarRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  groupBarLabel: { width: 78, fontSize: 12, color: "#5B6B85", fontWeight: "700" },
  groupBarTrack: { flex: 1, height: 20, borderRadius: 10, backgroundColor: "#F0F4FB", overflow: "hidden" },
  groupBarFill: { height: "100%", borderRadius: 10 },
  groupBarCount: { width: 24, textAlign: "right", fontSize: 13, fontWeight: "800", color: "#0F1E33" },

  elbowArea: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", height: 140, marginTop: 14 },
  elbowBarWrapper: { alignItems: "center", flex: 1 },
  elbowBarTrack: { width: 28, height: 110, justifyContent: "flex-end" },
  elbowBarFill: { width: "100%", borderRadius: 6 },
  elbowBarLabel: { fontSize: 12, color: "#8A97AC", fontWeight: "700", marginTop: 8 },
  elbowBarLabelActive: { color: "#2563EB" },
  elbowCaption: { fontSize: 11, color: "#8A97AC", marginTop: 12, lineHeight: 16 },

  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#5B6B85", textTransform: "uppercase", letterSpacing: 1 },
  groupCard: { backgroundColor: "#fff", borderRadius: 18, padding: 16, borderWidth: 1.5, shadowColor: "#0F1E33", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  groupCardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  groupPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  groupPillText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  groupCardLabel: { flex: 1, fontSize: 14, fontWeight: "800", color: "#0F1E33" },
  groupCardCount: { fontSize: 12, color: "#8A97AC", fontWeight: "600" },

  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  statBox: { flexGrow: 1, minWidth: "45%", backgroundColor: "#F9FBFE", borderRadius: 10, padding: 10 },
  statLabel: { fontSize: 10, color: "#8A97AC", fontWeight: "700", textTransform: "uppercase" },
  statValue: { fontSize: 13, color: "#0F1E33", fontWeight: "800", marginTop: 3 },

  itemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 9, borderTopWidth: 1, borderColor: "#F0F4FB" },
  itemName: { fontSize: 13, fontWeight: "700", color: "#0F1E33" },
  itemMeta: { fontSize: 11, color: "#8A97AC", marginTop: 2 },
  itemPrice: { fontSize: 13, fontWeight: "800", marginLeft: 10 },
});
