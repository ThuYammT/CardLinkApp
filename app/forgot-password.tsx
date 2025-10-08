import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

const BRAND = "#213BBB";
const BORDER = "rgba(33,59,187,0.18)";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) return Alert.alert("Error", "Please enter your email");

    try {
      setLoading(true);
      const res = await fetch("https://cardlink.onrender.com/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        Alert.alert("Success", "Password reset link sent to your email.");
        router.back(); // Go back to login screen
      } else {
        Alert.alert("Error", data.message || "Something went wrong");
      }
    } catch (err) {
      setLoading(false);
      Alert.alert("Network Error", "Unable to reach the server");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <LinearGradient colors={[BRAND, "#1B2FA4"]} style={styles.header}>
        <Text style={styles.headerText}>Forgot Password</Text>
      </LinearGradient>

      <View style={styles.container}>
        <Text style={styles.label}>Enter your registered email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Pressable style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Nunito",
    fontWeight: "700",
  },
  container: {
    padding: 20,
    marginTop: 30,
  },
  label: {
    color: "#444",
    fontFamily: "Nunito",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    fontFamily: "Nunito",
  },
  button: {
    backgroundColor: BRAND,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontFamily: "Nunito",
    fontWeight: "700",
  },
});
