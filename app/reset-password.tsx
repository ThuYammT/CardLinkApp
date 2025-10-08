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
import { useLocalSearchParams, router } from "expo-router";

const BRAND = "#213BBB";
const BORDER = "rgba(33,59,187,0.18)";

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams(); // get ?token=... or /:token param
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newPassword || !confirm) {
      return Alert.alert("Error", "Please fill in all fields.");
    }
    if (newPassword !== confirm) {
      return Alert.alert("Error", "Passwords do not match.");
    }

    try {
      setLoading(true);
      const res = await fetch("https://cardlink.onrender.com/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        Alert.alert("Success", "Your password has been reset.");
        router.replace("/"); // back to login
      } else {
        Alert.alert("Error", data.message || "Invalid or expired link.");
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
        <Text style={styles.headerText}>Reset Password</Text>
      </LinearGradient>

      <View style={styles.container}>
        <Text style={styles.label}>Enter your new password</Text>

        <TextInput
          style={styles.input}
          placeholder="New password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm new password"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />

        <Pressable style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>
            {loading ? "Updating..." : "Reset Password"}
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
