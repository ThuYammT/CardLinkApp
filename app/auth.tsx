//pull shark
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

/* ==== Theme ==== */
const BRAND = "#213BBB";
const BRAND_DARK = "#1B2FA4";
const SURFACE = "#FFFFFF";
const FIELD_BG = "#F7F7FA";
const TEXT_MUTED = "rgba(0,0,0,0.55)";
const BORDER = "rgba(33,59,187,0.18)";

/* ==== Reusable Field (HOISTED / MEMOIZED) ==== */
type FieldProps = {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
  keyboardType?:
    | "default"
    | "email-address"
    | "numeric"
    | "phone-pad"
    | "number-pad"
    | "url"
    | "decimal-pad";
  rightIcon?: React.ReactNode;
};

const Field = React.memo(function Field({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  autoCapitalize = "none",
  keyboardType = "default",
  rightIcon,
}: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={{
        backgroundColor: SURFACE,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: focused ? BRAND : BORDER,
        paddingHorizontal: 12,
        paddingVertical: 4,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
        marginBottom: 14,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: FIELD_BG,
          marginRight: 10,
        }}
      >
        {icon}
      </View>

      <TextInput
        placeholder={placeholder}
        placeholderTextColor={TEXT_MUTED}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          paddingVertical: 12,
          fontSize: 16,
          fontFamily: "Nunito",
          color: "#111",
        }}
      />

      {rightIcon}
    </View>
  );
});

/* ==== Screen ==== */
export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Animations
  const logoAnim = useRef(new Animated.Value(0)).current;
  const pillAnim = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(logoAnim, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    Animated.timing(pillAnim, {
      toValue: isLogin ? 0 : 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isLogin]);

  const pillLeft = pillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["4%", "52%"],
  });

  // Auth logic
  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !confirm)) {
      return Alert.alert("Error", "Please fill in all fields");
    }
    if (!isLogin && password !== confirm) {
      return Alert.alert("Error", "Passwords do not match");
    }

    try {
      setLoading(true);
      const url = isLogin
        ? "https://cardlink.onrender.com/api/auth/login"
        : "https://cardlink.onrender.com/api/auth/signup";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.token) {
        await SecureStore.setItemAsync("userToken", data.token);
        Alert.alert("Success", isLogin ? "Logged in!" : "Account created!");
        router.replace("/home");
      } else {
        Alert.alert("Error", data.message || "Something went wrong");
      }
    } catch (err) {
      setLoading(false);
      Alert.alert("Network Error", "Failed to connect to server");
    }
  };

  const ctaScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          {/* =================== FULL-BLEED HERO =================== */}
          <View style={{ height: 200 }}>
            {/* gradient fills the whole block (no rounded corners) */}
            <LinearGradient
              colors={[BRAND, BRAND_DARK]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            {/* floating circle accents */}
            <Animated.View
              style={{
                position: "absolute",
                width: 110,
                height: 110,
                borderRadius: 55,
                backgroundColor: "rgba(255,255,255,0.12)",
                right: 12,
                top: 24,
                transform: [
                  { translateY: breathe.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) },
                ],
              }}
            />
            <Animated.View
              style={{
                position: "absolute",
                width: 76,
                height: 76,
                borderRadius: 38,
                backgroundColor: "rgba(255,255,255,0.12)",
                left: 8,
                top: 80,
                transform: [
                  { translateY: breathe.interpolate({ inputRange: [0, 1], outputRange: [0, 5] }) },
                ],
              }}
            />
          </View>
          {/* ======================================================= */}

          {/* Logo */}
          <Animated.View
            style={{
              alignSelf: "center",
              marginTop: -36,
              marginBottom: 18,
              transform: [
                { scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
                { translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
              ],
              opacity: logoAnim,
            }}
          >
            <Image
              source={require("../assets/logo.png")}
              resizeMode="contain"
              style={{ width: 64, height: 64, borderRadius: 13, backgroundColor: "#fff" }}
            />
          </Animated.View>

          {/* Segmented control */}
          <View
            style={{
              alignSelf: "center",
              width: "78%",
              height: 46,
              backgroundColor: "#fff",
              borderRadius: 999,
              borderWidth: 1,
              borderColor: BORDER,
              position: "relative",
              marginBottom: 20,
              overflow: "hidden",
            }}
          >
            <Animated.View
              style={{
                position: "absolute",
                top: 4,
                left: pillLeft,
                width: "44%",
                height: 38,
                borderRadius: 999,
                backgroundColor: BRAND,
              }}
            />
            <View style={{ flexDirection: "row", width: "100%", height: "100%" }}>
              <Pressable style={{ flex: 1, alignItems: "center", justifyContent: "center" }} onPress={() => setIsLogin(true)}>
                <Text style={{ fontFamily: "Nunito", fontSize: 15, color: isLogin ? "#fff" : BRAND }}>Sign in</Text>
              </Pressable>
              <Pressable style={{ flex: 1, alignItems: "center", justifyContent: "center" }} onPress={() => setIsLogin(false)}>
                <Text style={{ fontFamily: "Nunito", fontSize: 15, color: !isLogin ? "#fff" : BRAND }}>Sign up</Text>
              </Pressable>
            </View>
          </View>

          {/* Form */}
          <View style={{ paddingHorizontal: 18 }}>
            <Field
              icon={<MaterialIcons name="mail-outline" size={18} color={BRAND} />}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Field
              icon={<MaterialIcons name="lock-outline" size={18} color={BRAND} />}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              rightIcon={
                <Pressable onPress={() => setShowPwd(!showPwd)} style={{ padding: 6 }}>
                  <MaterialIcons name={showPwd ? "visibility" : "visibility-off"} size={20} color={TEXT_MUTED} />
                </Pressable>
              }
            />

            {!isLogin && (
              <Field
                icon={<MaterialIcons name="lock-outline" size={18} color={BRAND} />}
                placeholder="Re-enter your password"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showConfirm}
                rightIcon={
                  <Pressable onPress={() => setShowConfirm(!showConfirm)} style={{ padding: 6 }}>
                    <MaterialIcons name={showConfirm ? "visibility" : "visibility-off"} size={20} color={TEXT_MUTED} />
                  </Pressable>
                }
              />
            )}

            {isLogin && (
              <Text
                style={{
                  textAlign: "right",
                  color: TEXT_MUTED,
                  fontFamily: "Nunito",
                  marginTop: 4,
                  marginBottom: 8,
                }}
              >
                Forgot password?
              </Text>
            )}

            {/* CTA */}
            <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
              <Pressable
                onPress={handleAuth}
                style={{
                  backgroundColor: BRAND,
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: BRAND,
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 3,
                }}
              >
                <Text style={{ color: "#fff", fontFamily: "Nunito", fontSize: 16, fontWeight: "700" }}>
                  {loading ? (isLogin ? "Logging in..." : "Creating...") : isLogin ? "Continue" : "Create account"}
                </Text>
              </Pressable>
            </Animated.View>
          </View>

          <View style={{ height: 30 }} />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // only used for absolute fill on gradient
});