import { useState } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useApp } from "../context/AppContext";

export default function Login() {
  const { user, login, register, logout } = useApp();
  const [mode, setMode] = useState("login"); // "login" หรือ "register"
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("user"); // "user" หรือ "admin"

  // ส่วนแสดงผลเมื่อล็อกอินสำเร็จแล้ว (Profile)
  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.profileName}>{user.username}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
          
          <View style={[
            styles.badge, 
            { backgroundColor: user.role === "admin" ? "#e0f2fe" : "#e6f4ea" }
          ]}>
            <Text style={[
              styles.badgeText, 
              { color: user.role === "admin" ? "#0369a1" : "#137333" }
            ]}>
              {user.role === "admin" ? "⚡ ADMIN" : "🛒 CUSTOMER"}
            </Text>
          </View>

          <Text style={styles.welcomeTip}>You have successfully logged in! You can now use the system.</Text>

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ฟังก์ชันเวลายื่นฟอร์ม
  const handleSubmit = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Incomplete information", "Please enter your Username and Password");
      return;
    }

    if (mode === "login") {
      if (!login(username.trim(), password)) {
        Alert.alert("Login failed", "Incorrect username or password.");
      }
    } else {
      if (!email.trim()) {
        Alert.alert("Incomplete information", "Please enter your email address.");
        return;
      }
      // ส่งค่า selectedRole ("user" หรือ "admin") ไปตอนลงทะเบียนด้วย
      if (!register(username.trim(), email.trim(), password, selectedRole)) {
        Alert.alert("Registration failed", "This username is already in use.");
      } else {
        Alert.alert("Successful", "Registration complete! You've been logged in immediately.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.appLogo}>⚡ PAPENGIE PLUG</Text>
        <Text style={styles.header}>{mode === "login" ? "Log in to the power strip shop" : "Register as a new member"}</Text>
        
        {/* ช่องกรอก Username */}
        <Text style={styles.label}>Username</Text>
        <TextInput 
          style={styles.input} 
          value={username} 
          onChangeText={setUsername} 
          autoCapitalize="none" 
          placeholder="Enter username" 
          placeholderTextColor="#94a3b8"
        />
        
        {/* ช่องกรอก Email (แสดงเฉพาะตอนสมัครสมาชิก) */}
        {mode === "register" && (
          <>
            <Text style={styles.label}>Email</Text>
            <TextInput 
              style={styles.input} 
              value={email} 
              onChangeText={setEmail} 
              autoCapitalize="none" 
              keyboardType="email-address" 
              placeholder="name@example.com" 
              placeholderTextColor="#94a3b8"
            />

            {/* ส่วนเลือกสถานะผู้ใช้งาน (แสดงเฉพาะตอนสมัครสมาชิกตามบรีฟ) */}
            <Text style={styles.label}>Select user type.</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[styles.roleButton, selectedRole === "user" && styles.roleButtonActive]} 
                onPress={() => setSelectedRole("user")}
              >
                <Text style={[styles.roleButtonText, selectedRole === "user" && styles.roleButtonTextActive]}>🛒Customer</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.roleButton, selectedRole === "admin" && styles.roleButtonActive]} 
                onPress={() => setSelectedRole("admin")}
              >
                <Text style={[styles.roleButtonText, selectedRole === "admin" && styles.roleButtonTextActive]}>⚡Admin</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        
        {/* ช่องกรอก Password */}
        <Text style={styles.label}>Password</Text>
        <TextInput 
          style={styles.input} 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
          placeholder="••••••••" 
          placeholderTextColor="#94a3b8"
        />
        
        {/* ปุ่มกดยืนยันหลัก */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>{mode === "login" ? "Log in" : "Sign up and register"}</Text>
        </TouchableOpacity>
        
        {/* สลับหน้าจอ สมัครสมาชิก / ล็อคอิน */}
        <TouchableOpacity onPress={() => setMode(mode === "login" ? "register" : "login")}>
          <Text style={styles.switchText}>
            {mode === "login" ? "Don't have an account yet? Sign up here" : "Already have an account? Return to login page"}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.hint}>Test admin account: username "admin" / password "1234"</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  form: { padding: 24, paddingTop: 40 },
  appLogo: { fontSize: 24, fontWeight: "900", color: "#0284c7", textAlign: "center", marginBottom: 8, letterSpacing: 1 },
  header: { fontSize: 18, fontWeight: "700", marginBottom: 24, color: "#0f172a", textAlign: "center" },
  label: { fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: "#e2e8f0", fontSize: 15, color: "#0f172a" },
  
  // ตัวเลือกบทบาท
  roleContainer: { flexDirection: "row", gap: 10, marginTop: 4 },
  roleButton: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: "#cbd5e1", alignItems: "center" },
  roleButtonActive: { backgroundColor: "#0284c7", borderColor: "#0284c7" },
  roleButtonText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  roleButtonTextActive: { color: "#fff", fontWeight: "700" },

  submitButton: { backgroundColor: "#0284c7", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 28 },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  switchText: { color: "#0284c7", textAlign: "center", marginTop: 20, fontWeight: "600", fontSize: 14 },
  hint: { textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 30 },
  
  // หน้าโปรไฟล์หลังล็อกอิน
  profileCard: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, marginTop: 60 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#0ea5e9", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  avatarText: { color: "#fff", fontSize: 36, fontWeight: "700" },
  profileName: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
  profileEmail: { fontSize: 14, color: "#64748b", marginTop: 4, marginBottom: 12 },
  badge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  badgeText: { fontSize: 13, fontWeight: "700" },
  welcomeTip: { color: "#64748b", fontSize: 14, marginBottom: 40, textAlign: "center" },
  logoutButton: { borderWidth: 1.5, borderColor: "#ef4444", paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12, width: "100%", alignItems: "center" },
  logoutButtonText: { color: "#ef4444", fontWeight: "700", fontSize: 15 },
});