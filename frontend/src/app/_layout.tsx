import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, useApp } from "../context/AppContext";

function TabsNav() {
  const { user, cartCount, favorites } = useApp();
  const isAdmin = user?.role === "admin";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        
        // 🌟 เปิดใช้งาน Label ระบบ และตั้งค่าให้มันใจว่าจะขึ้นแน่นอน
        tabBarShowLabel: true, 
        tabBarLabelPosition: "below-icon",
        
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#5B6B85", 
        tabBarStyle: styles.floatingTabBar,
        tabBarLabelStyle: styles.globalTabBarLabel,
        tabBarItemStyle: styles.tabItemLayout,
      }}
    >
      {/* 1. Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} color={color} size={20} />
          )
        }}
      />

      {/* หน้ารายละเอียดสินค้า: ไม่โชว์เป็นแท็บ และซ่อนแถบเมนูลอยเพื่อให้แถบสั่งซื้อด้านล่างของหน้านี้ไม่ถูกบัง */}
      <Tabs.Screen
        name="product/[id]"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />

      {/* Payment flow: open from the cart without adding another bottom tab. */}
      <Tabs.Screen
        name="payment"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />

      {/* 2. Cart (ซ่อนสำหรับแอดมิน) */}
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarLabel: "Cart",
          href: isAdmin ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconWrap}>
              <Ionicons name={focused ? "cart" : "cart-outline"} color={color} size={20} />
              {cartCount > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{cartCount}</Text>
                </View>
              )}
            </View>
          )
        }}
      />

      {/* 3. Add (เฉพาะแอดมิน) */}
      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
          tabBarLabel: "Add",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "add-circle" : "add-circle-outline"} color={color} size={20} />
          )
        }}
      />

      {/* 4. Favorites (ซ่อนสำหรับแอดมิน) */}
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
          tabBarLabel: "Favorites",
          href: isAdmin ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconWrap}>
              <Ionicons name={focused ? "heart" : "heart-outline"} color={color} size={20} />
              {favorites.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{favorites.length}</Text>
                </View>
              )}
            </View>
          )
        }}
      />

      {/* 5. Login */}
      <Tabs.Screen 
        name="login" 
        options={{ 
          title: "Login",
          tabBarLabel: user ? "Account" : "Login", 
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "log-in" : "log-in-outline"} color={color} size={20} /> 
          ) 
        }} 
      />

      {/* 6. Admin Dashboard (เฉพาะแอดมิน) */}
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          title: "Admin",
          tabBarLabel: "Admin",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} color={color} size={20} />
          )
        }}
      />

      {/* 7. Admin Products (เฉพาะแอดมิน) */}
      <Tabs.Screen
        name="admin-products"
        options={{
          title: "Products",
          tabBarLabel: "Products",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "cube" : "cube-outline"} color={color} size={20} />
          )
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        {Platform.OS === "web" ? (
          <View style={styles.webViewport}>
            <View style={styles.phoneFrame}>
              <View style={styles.phoneSpeaker} />
              <View style={styles.phoneCamera} />
              <View pointerEvents="none" style={styles.phoneInnerGlow} />
              <TabsNav />
            </View>
          </View>
        ) : (
          <TabsNav />
        )}
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  webViewport: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  phoneFrame: {
    width: 390,
    height: 820,
    maxWidth: "92%",
    maxHeight: "92%",
    overflow: "hidden",
    backgroundColor: "#F4F7FC",
    borderWidth: 3,
    borderColor: "#C89421",
    borderRadius: 46,
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 18,
  },
  phoneSpeaker: {
    position: "absolute",
    zIndex: 20,
    top: 12,
    alignSelf: "center",
    width: 64,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#111827",
    opacity: 0.85,
  },
  phoneCamera: {
    position: "absolute",
    zIndex: 20,
    top: 12,
    left: "50%",
    marginLeft: 42,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#273449",
    borderWidth: 1,
    borderColor: "#64748B",
  },
  phoneInnerGlow: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 19,
    borderRadius: 43,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
  },
  tabIconWrap: {
    width: 28,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadge: {
    position: "absolute",
    top: -5,
    right: -7,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  tabBadgeText: {
    color: "#fff",
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "800",
  },
  floatingTabBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 30 : 20, 
    left: 8,                    
    right: 8,
    height: 70, // ลดความสูงลงมานิดนึงเพื่อให้องค์ประกอบเบียดกันพอดี ไม่ตกขอบ
    backgroundColor: "#ffffff",
    borderRadius: 32,          
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: "#EAF1FB",
    paddingTop: 8, // ดันไอคอนลงมาจากขอบบนเล็กน้อย
    paddingBottom: Platform.OS === "ios" ? 12 : 8,
    
    shadowColor: "#0F1E33",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  
  /* จัดตำแหน่งโครงสร้างภายในแต่ละปุ่มของระบบ */
  tabItemLayout: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  
  /* บังคับสไตล์ข้อความภาษาอังกฤษให้โชว์ตัวเล็กกำลังดี ไม่ตัดคำ */
  globalTabBarLabel: { 
    fontSize: 9, 
    fontWeight: "600",
    textAlign: "center",
    marginTop: 2, 
    minWidth: 45, // ป้องกันการขึ้นบรรทัดใหม่
  },
});