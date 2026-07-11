import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import { AppProvider, useApp } from "../context/AppContext";

function TabsNav() {
  const { user } = useApp();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        
        // 🌟 เปิดใช้งาน Label ระบบ และตั้งค่าให้มันใจว่าจะขึ้นแน่นอน
        tabBarShowLabel: true, 
        tabBarLabelPosition: "below-icon", // บังคับให้ชื่ออยู่ใต้ไอคอนเสมอ
        
        tabBarActiveTintColor: "#00A3E0",   
        tabBarInactiveTintColor: "#64748b", 
        tabBarStyle: styles.floatingTabBar,
        tabBarLabelStyle: styles.globalTabBarLabel,
        tabBarItemStyle: styles.tabItemLayout, // จัดระยะช่องไฟปุ่ม
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

      {/* 2. Cart */}
      <Tabs.Screen 
        name="cart" 
        options={{ 
          title: "Cart",
          tabBarLabel: "Cart", 
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "cart" : "cart-outline"} color={color} size={20} /> 
          ) 
        }} 
      />

      {/* 3. Add */}
      <Tabs.Screen 
        name="add" 
        options={{ 
          title: "Add",
          tabBarLabel: "Add", 
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "add-circle" : "add-circle-outline"} color={color} size={20} /> 
          ) 
        }} 
      />

      {/* 4. Favorites */}
      <Tabs.Screen 
        name="favorites" 
        options={{ 
          title: "Favorites",
          tabBarLabel: "Favorites", 
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "heart" : "heart-outline"} color={color} size={20} /> 
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

      {/* 6. Brand (จากรูปมันโชว์คำว่า brand แสดงว่าชื่อไฟล์/โฟลเดอร์ของคุณต้องสะกดว่า brand แน่ๆ) */}
      <Tabs.Screen 
        name="brand"  // 🌟 เปลี่ยนจาก "Tags" กลับมาเป็น "brand" ตัวพิมพ์เล็กให้ตรงกับระบบไฟล์
        options={{ 
          title: "Brand",
          tabBarLabel: "Brand", 
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "pricetag" : "pricetag-outline"} color={color} size={20} /> 
          ) 
        }} 
      />

      {/* 7. Admin (จากรูปมันโชว์คำว่า admin-d... น่าจะเป็น admin-dashboard หรือ dashboard) */}
      <Tabs.Screen 
        name="admin-dashboard" // 🌟 ตรงนี้ให้เช็คดูนะคะ ถ้าชื่อไฟล์จริงๆ คือ admin-dashboard ให้เปลี่ยนแก้ตรงนี้เป็น "admin-dashboard" นะคะ
        options={{ 
          title: "Admin",
          tabBarLabel: "Admin",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} color={color} size={20} />
          )
        }} 
      />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <TabsNav />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
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
    borderColor: "#f1f5f9",
    paddingTop: 8, // ดันไอคอนลงมาจากขอบบนเล็กน้อย
    paddingBottom: Platform.OS === "ios" ? 12 : 8,
    
    shadowColor: "#0f172a",
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