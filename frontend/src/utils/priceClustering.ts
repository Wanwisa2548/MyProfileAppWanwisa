import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

// จัดกลุ่มสินค้าตามราคาด้วย K-Means (1 มิติ: ใช้ราคาเป็น feature เดียว) เป็น 3 กลุ่ม:
// ถูก (cheap) / กลาง (mid) / แพง (expensive) — แนวทางเดียวกับที่ใช้จัดกลุ่มหุ้นในเลกเชอร์
//
// ผลลัพธ์ "จริง" (แม่นยำที่สุด) มาจาก analysis/clustering.py ซึ่งใช้ scikit-learn
// (StandardScaler + KMeans n_init=10) แล้วบันทึกกลับลง database — ฟังก์ชัน `withPriceTiers`
// ด้านล่างจะใช้ค่านั้นก่อนเสมอถ้ามีครบทุกชิ้น ถ้ายังไม่มี (เช่นยังไม่เคยรันสคริปต์) จึงคำนวณสดฝั่งนี้แทน
export type PriceTier = "cheap" | "mid" | "expensive";

const TIER_ORDER: PriceTier[] = ["cheap", "mid", "expensive"];

export function isPriceTier(value: unknown): value is PriceTier {
  return value === "cheap" || value === "mid" || value === "expensive";
}

// หาจุดตัดที่ดีที่สุดจริง (exact optimum) สำหรับ k-means บนข้อมูล 1 มิติ แทนการวนซ้ำแบบ Lloyd's
// algorithm ที่ต้องเดา centroid เริ่มต้นและอาจติด local minimum — ข้อมูล 1 มิติมีคุณสมบัติว่า
// กลุ่มที่ optimal ที่สุดของ k-means ต้องเป็นช่วงต่อเนื่องบนข้อมูลที่เรียงแล้วเสมอ จึงหาคำตอบที่ดีที่สุด
// ได้ด้วยการลองทุกตำแหน่งจุดตัดที่เป็นไปได้ แล้วเลือกจุดตัดที่ทำให้ within-cluster variance รวมต่ำที่สุด
function exactOptimalCutPoints(sortedValues: number[], k: 1 | 2 | 3): number[] {
  const n = sortedValues.length;
  const prefixSum = new Array(n + 1).fill(0);
  const prefixSumSq = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    prefixSum[i + 1] = prefixSum[i] + sortedValues[i];
    prefixSumSq[i + 1] = prefixSumSq[i] + sortedValues[i] * sortedValues[i];
  }
  // ต้นทุน (within-cluster sum of squares) ของช่วง [l, r) แบบ O(1) ด้วย prefix sum
  const segmentCost = (l: number, r: number) => {
    const count = r - l;
    if (count <= 0) return 0;
    const sum = prefixSum[r] - prefixSum[l];
    const sumSq = prefixSumSq[r] - prefixSumSq[l];
    return sumSq - (sum * sum) / count;
  };

  // คืนเฉพาะจุดตัด "ภายใน" ข้อมูล (ไม่รวม 0 หรือ n ที่เป็นขอบเขตอยู่แล้ว) — ผู้เรียกเป็นคนต่อ n เข้าไปเอง
  if (k === 1) return [];

  if (k === 2) {
    let bestCost = Infinity;
    let bestCut = Math.ceil(n / 2);
    for (let i = 1; i < n; i++) {
      const cost = segmentCost(0, i) + segmentCost(i, n);
      if (cost < bestCost) {
        bestCost = cost;
        bestCut = i;
      }
    }
    return [bestCut];
  }

  // k === 3: ลองทุกคู่ของจุดตัด (i, j) — O(n^2) ซึ่งเร็วเพียงพอสำหรับจำนวนสินค้าระดับร้านค้าทั่วไป
  let bestCost = Infinity;
  let bestCuts: [number, number] = [Math.floor(n / 3), Math.floor((2 * n) / 3)];
  for (let i = 1; i < n - 1; i++) {
    const costLeft = segmentCost(0, i);
    for (let j = i + 1; j < n; j++) {
      const cost = costLeft + segmentCost(i, j) + segmentCost(j, n);
      if (cost < bestCost) {
        bestCost = cost;
        bestCuts = [i, j];
      }
    }
  }
  return bestCuts;
}

// รับสินค้าที่มี field `price` แล้วคืนสินค้าเดิมพร้อม `priceTier` ที่ได้จาก K-Means
// การจัดกลุ่มคำนวณจากราคาของสินค้า "ทั้งหมด" ที่ส่งเข้ามา เพื่อให้ระดับราคาคงที่ไม่ขึ้นกับตัวกรอง/คำค้นหาที่ผู้ใช้เลือกอยู่
export function clusterProductsByPrice<T extends { price: number }>(products: T[]): (T & { priceTier: PriceTier })[] {
  if (products.length === 0) return [];

  const distinctPriceCount = new Set(products.map((p) => p.price)).size;
  const k = Math.min(3, distinctPriceCount) as 1 | 2 | 3;

  const order = products
    .map((product, index) => ({ product, index }))
    .sort((a, b) => a.product.price - b.product.price);
  const sortedPrices = order.map((o) => o.product.price);

  const cuts = exactOptimalCutPoints(sortedPrices, k || 1);
  const tierNames = k === 3 ? TIER_ORDER : k === 2 ? (["cheap", "expensive"] as PriceTier[]) : (["mid"] as PriceTier[]);

  // boundaries ต้องมีสมาชิก tierNames.length + 1 เสมอ (จุดเริ่ม 0, จุดตัดภายใน, จุดจบ sortedPrices.length)
  const boundaries = [0, ...cuts, sortedPrices.length];
  const tierByOriginalIndex = new Map<number, PriceTier>();
  for (let segment = 0; segment < tierNames.length; segment++) {
    for (let pos = boundaries[segment]; pos < boundaries[segment + 1]; pos++) {
      tierByOriginalIndex.set(order[pos].index, tierNames[segment]);
    }
  }

  return products.map((product, i) => ({ ...product, priceTier: tierByOriginalIndex.get(i)! }));
}

// ใช้ระดับราคาที่ analysis/clustering.py คำนวณไว้แล้ว (บันทึกใน database เป็น field `priceTier`)
// ถ้ามีครบทุกชิ้น — ถือว่าแม่นยำที่สุดเพราะรันด้วย scikit-learn จริง; ถ้ายังไม่มี (ยังไม่เคยรันสคริปต์)
// จึงคำนวณสดด้วย exact k-means ด้านบนแทน เพื่อให้หน้าสินค้ายังแสดงผลได้เสมอ
export function withPriceTiers<T extends { price: number; priceTier?: PriceTier | null }>(
  products: T[]
): (T & { priceTier: PriceTier })[] {
  const hasCompleteBackendTiers = products.length > 0 && products.every((p) => isPriceTier(p.priceTier));
  if (hasCompleteBackendTiers) {
    return products as (T & { priceTier: PriceTier })[];
  }
  return clusterProductsByPrice(products);
}

export const PRICE_TIER_LABELS: Record<"th" | "en", Record<PriceTier, string>> = {
  th: { cheap: "ราคาถูก", mid: "ราคากลาง", expensive: "ราคาแพง" },
  en: { cheap: "Budget", mid: "Mid-range", expensive: "Premium" },
};

export const PRICE_TIER_COLORS: Record<PriceTier, { bg: string; text: string; border: string }> = {
  cheap: { bg: "#E3F8EA", text: "#16A34A", border: "#86EFAC" },
  mid: { bg: "#FEF3C7", text: "#D97706", border: "#FCD34D" },
  expensive: { bg: "#EDE4FF", text: "#7C3AED", border: "#C4B5FD" },
};

export const PRICE_TIER_ICONS: Record<PriceTier, ComponentProps<typeof Ionicons>["name"]> = {
  cheap: "wallet-outline",
  mid: "options-outline",
  expensive: "diamond-outline",
};

// ===== รายงานการจัดกลุ่มสำหรับหน้าแอดมิน (/admin-clusters): รองรับ k ใดก็ได้ (ไม่ใช่แค่ 3) =====
// ใช้หลักการเดียวกับ exactOptimalCutPoints ด้านบน แต่ทำเป็น dynamic programming ทั่วไป (O(k·n²))
// เพื่อคำนวณทั้งเส้น inertia ของทุกค่า k (สำหรับกราฟ Elbow Method) และ assignment ที่ optimal จริง
// สำหรับ k ที่เลือก ในการรันครั้งเดียว
export type KMeansPriceReport = {
  /** inertiaByK[i] คือค่า inertia (within-cluster SSE ต่ำสุดที่เป็นไปได้) เมื่อใช้ i+1 กลุ่ม */
  inertiaByK: number[];
  /** ค่า k ที่ elbow method แนะนำ (จุดที่ห่างจากเส้นตรงระหว่างจุดแรก-จุดสุดท้ายมากที่สุด) */
  elbowK: number;
  /** คืน cluster index (0 = ราคาต่ำสุด ... k-1 = ราคาสูงสุด) เรียงตามลำดับสินค้าที่ส่งเข้ามาตอนแรก */
  assignmentsForK: (k: number) => number[];
};

function findElbowK(inertias: number[]): number {
  const maxK = inertias.length;
  if (maxK <= 2) return maxK || 1;

  // ปรับสเกลแกน x (จำนวน k) และแกน y (inertia) ให้อยู่ในช่วง 0–1 ทั้งคู่ก่อน
  // เพราะสองแกนนี้หน่วยต่างกันมาก การหาระยะห่างจากเส้นตรงตรงๆ จะเอนเอียงไปทางแกนที่ตัวเลขใหญ่กว่า
  const minY = Math.min(...inertias);
  const maxY = Math.max(...inertias);
  const rangeY = maxY - minY || 1;
  const points = inertias.map((y, idx) => ({ x: idx / (maxK - 1), y: (y - minY) / rangeY }));
  const { x: x1, y: y1 } = points[0];
  const { x: x2, y: y2 } = points[points.length - 1];
  const denom = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2) || 1;

  let bestK = 1;
  let bestDistance = -1;
  points.forEach((p, idx) => {
    const distance = Math.abs((y2 - y1) * p.x - (x2 - x1) * p.y + x2 * y1 - y2 * x1) / denom;
    if (distance > bestDistance) {
      bestDistance = distance;
      bestK = idx + 1;
    }
  });
  return bestK;
}

export function analyzePricesWithKMeans(prices: number[], maxK: number): KMeansPriceReport {
  const n = prices.length;
  if (n === 0) {
    return { inertiaByK: [], elbowK: 1, assignmentsForK: () => [] };
  }

  const order = prices.map((price, index) => ({ price, index })).sort((a, b) => a.price - b.price);
  const sorted = order.map((o) => o.price);

  const prefixSum = new Array(n + 1).fill(0);
  const prefixSumSq = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    prefixSum[i + 1] = prefixSum[i] + sorted[i];
    prefixSumSq[i + 1] = prefixSumSq[i] + sorted[i] * sorted[i];
  }
  const segmentCost = (l: number, r: number) => {
    const count = r - l;
    if (count <= 0) return 0;
    const sum = prefixSum[r] - prefixSum[l];
    const sumSq = prefixSumSq[r] - prefixSumSq[l];
    return sumSq - (sum * sum) / count;
  };

  const cappedMaxK = Math.max(1, Math.min(maxK, n));
  // dp[k][i] = ต้นทุนต่ำสุดของการแบ่งสินค้า i ตัวแรก (ที่เรียงราคาแล้ว) ออกเป็น k กลุ่ม
  // prev[k][i] = ตำแหน่งจุดตัดที่ทำให้ได้ต้นทุนต่ำสุดนั้น (ไว้ backtrack หาขอบเขตกลุ่มจริง)
  const dp: number[][] = Array.from({ length: cappedMaxK + 1 }, () => new Array(n + 1).fill(Infinity));
  const prev: number[][] = Array.from({ length: cappedMaxK + 1 }, () => new Array(n + 1).fill(0));
  dp[0][0] = 0;
  for (let k = 1; k <= cappedMaxK; k++) {
    for (let i = k; i <= n; i++) {
      for (let j = k - 1; j < i; j++) {
        if (dp[k - 1][j] === Infinity) continue;
        const cost = dp[k - 1][j] + segmentCost(j, i);
        if (cost < dp[k][i]) {
          dp[k][i] = cost;
          prev[k][i] = j;
        }
      }
    }
  }

  const inertiaByK: number[] = [];
  for (let k = 1; k <= cappedMaxK; k++) inertiaByK.push(dp[k][n]);

  const assignmentsForK = (requestedK: number): number[] => {
    const k = Math.max(1, Math.min(requestedK, cappedMaxK));
    const cuts: number[] = [];
    let i = n;
    let remaining = k;
    while (remaining > 0) {
      cuts.unshift(i);
      i = prev[remaining][i];
      remaining--;
    }
    const boundaries = [0, ...cuts];
    const clusterByOriginalIndex = new Array(n).fill(0);
    // segment 0 มีราคาต่ำสุดเสมอเพราะ `order` เรียงจากน้อยไปมาก จึงไม่ต้อง sort cluster ตาม mean ซ้ำ
    for (let segment = 0; segment < k; segment++) {
      for (let pos = boundaries[segment]; pos < boundaries[segment + 1]; pos++) {
        clusterByOriginalIndex[order[pos].index] = segment;
      }
    }
    return clusterByOriginalIndex;
  };

  return { inertiaByK, elbowK: findElbowK(inertiaByK), assignmentsForK };
}
