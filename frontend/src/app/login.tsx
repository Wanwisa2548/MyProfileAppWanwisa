import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { Role, useApp } from "../context/AppContext";

export default function Login() {
  const { user, login, logout, register } = useApp();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("customer");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);

  // ส่วนแสดงผลเมื่อล็อกอินสำเร็จแล้ว (Profile)
  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user.username || "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{user.username}</Text>
          <Text style={styles.profileEmail}>{user.email || "No email provided"}</Text>
          
          <View style={[
            styles.badge, 
            { backgroundColor: user.role === "admin" ? "#EAF1FB" : "#E3F8EA" }
          ]}>
            <View style={styles.badgeRow}>
              <Ionicons
                name={user.role === "admin" ? "flash" : "cart"}
                size={13}
                color={user.role === "admin" ? "#1D4ED8" : "#16A34A"}
              />
              <Text style={[
                styles.badgeText,
                { color: user.role === "admin" ? "#1D4ED8" : "#16A34A" }
              ]}>
                {user.role === "admin" ? "ADMIN" : "CUSTOMER"}
              </Text>
            </View>
          </View>

          <Text style={styles.welcomeTip}>You have successfully logged in! You can now use the system.</Text>

          <AnimatedPressable style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    );
  }

  // ฟังก์ชันยื่นฟอร์ม
  const handleSubmit = async () => {
    setFeedback(null);
    if (!username.trim() || !password.trim()) {
      setFeedback({ type: "error", message: "Please enter your username and password." });
      return;
    }

    if (mode === "register" && !email.trim()) {
      setFeedback({ type: "error", message: "Please enter your email address." });
      return;
    }

    setLoading(true);

    try {
      // เรียกใช้ login โดยรองรับรูปแบบ Parameter ปลอดภัย
      if (mode === "login") {
        await login(username.trim(), password, selectedRole, true);
      } else {
        await register(username.trim(), email.trim(), password, true);
      }
      setFeedback({ type: "success", message: mode === "login" ? "Logged in successfully." : "Registration complete." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Incorrect username or password." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.appLogoRow}>
          <View style={styles.loginLogoFrame}>
            <Image
              source={require("../../assets/images/papengie-logo.png")}
              style={styles.loginLogoImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.appLogo}>POWER PLUGS</Text>
        </View>
        <Text style={styles.header}>
          {mode === "login" ? "Log in to the power strip shop" : "Register as a new member"}
        </Text>
        
        {/* ช่องเลือกบทบาท (Role) */}
        {mode === "login" && <Text style={styles.label}>Select User Role</Text>}
        {mode === "login" &&
        <View style={styles.roleContainer}>
          <AnimatedPressable 
            style={[styles.roleButton, selectedRole === "customer" && styles.roleButtonActive]} 
            onPress={() => setSelectedRole("customer")}
          >
            <Ionicons name="cart" size={14} color={selectedRole === "customer" ? "#fff" : "#5B6B85"} />
            <Text style={[styles.roleButtonText, selectedRole === "customer" && styles.roleButtonTextActive]}>
              {" "}Customer
            </Text>
          </AnimatedPressable>

          <AnimatedPressable
            style={[styles.roleButton, selectedRole === "admin" && styles.roleButtonActive]}
            onPress={() => setSelectedRole("admin")}
          >
            <Ionicons name="flash" size={14} color={selectedRole === "admin" ? "#fff" : "#5B6B85"} />
            <Text style={[styles.roleButtonText, selectedRole === "admin" && styles.roleButtonTextActive]}>
              {" "}Admin
            </Text>
          </AnimatedPressable>
        </View>
        }

        {/* ช่องกรอก Username */}
        <Text style={styles.label}>Username</Text>
        <TextInput 
          style={styles.input} 
          value={username} 
          onChangeText={setUsername} 
          autoCapitalize="none" 
          placeholder="Enter username" 
          placeholderTextColor="#8A97AC"
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
              placeholderTextColor="#8A97AC"
            />
          </>
        )}
        
        {/* ช่องกรอก Password */}
        <Text style={styles.label}>Password</Text>
        <TextInput 
          style={styles.input} 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry={!passwordVisible}
          placeholder="••••••••" 
          placeholderTextColor="#8A97AC"
        />
        
        {/* ปุ่มกดยืนยันหลัก */}
        <AnimatedPressable style={styles.passwordToggle} onPress={() => setPasswordVisible((visible) => !visible)}>
          <Text style={styles.passwordToggleText}>{passwordVisible ? "Hide password" : "Show password"}</Text>
        </AnimatedPressable>

        <AnimatedPressable 
          style={[styles.submitButton, loading && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? "Processing..." : mode === "login" ? "Log in" : "Sign up and register"}
          </Text>
        </AnimatedPressable>

        {feedback && (
          <View style={[styles.feedback, feedback.type === "error" ? styles.feedbackError : styles.feedbackSuccess]}>
            <Text style={[styles.feedbackText, feedback.type === "error" ? styles.feedbackErrorText : styles.feedbackSuccessText]}>{feedback.message}</Text>
          </View>
        )}
        
        {/* สลับหน้าจอ สมัครสมาชิก / ล็อคอิน */}
        <AnimatedPressable onPress={() => { setMode(mode === "login" ? "register" : "login"); setFeedback(null); }}>
          <Text style={styles.switchText}>
            {mode === "login" 
              ? "Don't have an account yet? Sign up here" 
              : "Already have an account? Return to login page"}
          </Text>
        </AnimatedPressable>
        
        {mode === "register" && <Text style={styles.hint}>New accounts are created as customer accounts.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" },
  form: { padding: 24, paddingTop: 40 },
  appLogoRow: { alignItems: "center", justifyContent: "center", marginBottom: 8 },
  loginLogoFrame: { width: 112, height: 112, borderRadius: 56, overflow: "hidden", backgroundColor: "#fff", borderWidth: 3, borderColor: "#38BDF8", shadowColor: "#2563EB", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 8 },
  loginLogoImage: { width: "100%", height: "100%" },
  appLogo: { fontSize: 24, fontWeight: "900", color: "#0A1830", textAlign: "center", letterSpacing: 1 },
  header: { fontSize: 18, fontWeight: "700", marginBottom: 24, color: "#0F1E33", textAlign: "center" },
  label: { fontSize: 14, fontWeight: "600", color: "#0F1E33", marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: "#E2E9F5", fontSize: 15, color: "#0F1E33" },
  passwordToggle: { alignSelf: "flex-end", paddingVertical: 8, paddingHorizontal: 4 },
  passwordToggleText: { color: "#2563EB", fontWeight: "700", fontSize: 14 },
  
  roleContainer: { flexDirection: "row", gap: 10, marginTop: 4 },
  roleButton: { flex: 1, flexDirection: "row", paddingVertical: 12, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E9F5", alignItems: "center", justifyContent: "center" },
  roleButtonActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  roleButtonText: { fontSize: 13, fontWeight: "600", color: "#5B6B85" },
  roleButtonTextActive: { color: "#fff", fontWeight: "700" },

  submitButton: { backgroundColor: "#2563EB", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 28 },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  feedback: { borderRadius: 10, padding: 12, marginTop: 14 },
  feedbackError: { backgroundColor: "#FDE7E7", borderWidth: 1, borderColor: "#F3B4B4" },
  feedbackSuccess: { backgroundColor: "#E3F8EA", borderWidth: 1, borderColor: "#A7E8BE" },
  feedbackText: { fontSize: 14, textAlign: "center" },
  feedbackErrorText: { color: "#DC2626" },
  feedbackSuccessText: { color: "#16A34A" },
  switchText: { color: "#2563EB", textAlign: "center", marginTop: 20, fontWeight: "600", fontSize: 14 },
  hint: { textAlign: "center", color: "#8A97AC", fontSize: 12, marginTop: 30 },
  
  profileCard: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, marginTop: 60 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#38BDF8", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  avatarText: { color: "#fff", fontSize: 36, fontWeight: "700" },
  profileName: { fontSize: 22, fontWeight: "700", color: "#0F1E33" },
  profileEmail: { fontSize: 14, color: "#5B6B85", marginTop: 4, marginBottom: 12 },
  badge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  badgeText: { fontSize: 13, fontWeight: "700" },
  welcomeTip: { color: "#5B6B85", fontSize: 14, marginBottom: 40, textAlign: "center" },
  logoutButton: { borderWidth: 1.5, borderColor: "#DC2626", paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12, width: "100%", alignItems: "center" },
  logoutButtonText: { color: "#DC2626", fontWeight: "700", fontSize: 15 },
});
