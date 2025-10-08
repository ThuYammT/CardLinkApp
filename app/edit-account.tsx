import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const BRAND = "#213BBB";
const BORDER = "rgba(33,59,187,0.18)";
const TEXT_MUTED = "rgba(0,0,0,0.55)";

export default function AccountDetails() {
  const [user, setUser] = useState({
    email: "",
    phone: "",
    createdAt: "",
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [fieldToEdit, setFieldToEdit] = useState<
    "email" | "phone" | "password" | null
  >(null);
  const [newValue, setNewValue] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /* -------- Fetch current user -------- */
  useEffect(() => {
    const fetchUser = async () => {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) return;

      try {
        const res = await fetch("https://cardlink.onrender.com/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          const date = data.createdAt
            ? new Date(data.createdAt).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "";
          setUser({
            email: data.email || "",
            phone: data.phone || "",
            createdAt: date,
          });
        }
      } catch (err) {
        console.error("Fetch user error:", err);
      }
    };
    fetchUser();
  }, []);

  const openModal = (field: "email" | "phone" | "password") => {
    setFieldToEdit(field);
    setNewValue("");
    setCurrentPassword("");
    setConfirmPassword("");
    setModalVisible(true);
  };

  /* -------- Save updated info -------- */
  const handleSave = async () => {
    if (!fieldToEdit) return;
    if (fieldToEdit === "password" && newValue !== confirmPassword) {
      return Alert.alert("Error", "New passwords do not match");
    }

    setLoading(true);
    const token = await SecureStore.getItemAsync("userToken");

    try {
      const body: any = { currentPassword };
      if (fieldToEdit === "email") body.email = newValue;
      if (fieldToEdit === "phone") body.phone = newValue;
      if (fieldToEdit === "password") body.newPassword = newValue;

      const res = await fetch(
        "https://cardlink.onrender.com/api/auth/update-account",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        // ✅ force logout if needed
        if (data.forceLogout) {
          Alert.alert("Success", data.message, [
            {
              text: "OK",
              onPress: async () => {
                await SecureStore.deleteItemAsync("userToken");
                router.replace("/auth");
              },
            },
          ]);
        } else {
          Alert.alert("Success", data.message || "Update successful");
        }

        setModalVisible(false);
        setNewValue("");
        setCurrentPassword("");
        setConfirmPassword("");

        // Refresh data
        const me = await fetch("https://cardlink.onrender.com/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const updated = await me.json();
        const date = updated.createdAt
          ? new Date(updated.createdAt).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            })
          : "";
        setUser({
          email: updated.email || "",
          phone: updated.phone || "",
          createdAt: date,
        });
      } else {
        Alert.alert("Error", data.message || "Update failed");
      }
    } catch (err) {
      setLoading(false);
      Alert.alert("Network Error", "Failed to connect to server");
    }
  };

  /* -------- UI -------- */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Top bar - consistent with Edit Profile */}
      <View
        style={{
          backgroundColor: BRAND,
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 18,
          paddingHorizontal: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <FontAwesome name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text
          style={{
            color: "#fff",
            fontSize: 22,
            fontWeight: "700",
            marginLeft: 14,
          }}
        >
          Account Details
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Email */}
          <InfoRow
            label="Email"
            value={user.email}
            icon="envelope"
            onEdit={() => openModal("email")}
          />

          {/* Phone */}
          <InfoRow
            label="Phone Number"
            value={user.phone || "—"}
            icon="phone"
            onEdit={() => openModal("phone")}
          />

          {/* Password */}
          <View
            style={{
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <FontAwesome name="lock" size={18} color={BRAND} />
                <Text style={{ fontWeight: "600", marginLeft: 10 }}>
                  Password
                </Text>
              </View>

              <TouchableOpacity onPress={() => openModal("password")}>
                <FontAwesome name="pencil" size={18} color={BRAND} />
              </TouchableOpacity>
            </View>

            <Text
              style={{
                marginTop: 10,
                color: TEXT_MUTED,
                letterSpacing: 3,
                fontSize: 18,
              }}
            >
              ●●●●●●●●●●
            </Text>
          </View>

          {/* Created Date */}
          {user.createdAt ? (
            <Text
              style={{
                color: TEXT_MUTED,
                textAlign: "right",
                fontSize: 13,
                marginTop: 6,
              }}
            >
              Created on {user.createdAt}
            </Text>
          ) : null}
        </ScrollView>

        {/* ---------- Modal ---------- */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 20,
                width: "100%",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: BRAND,
                  marginBottom: 12,
                }}
              >
                {fieldToEdit === "password"
                  ? "Change Password"
                  : `Update ${fieldToEdit}`}
              </Text>

              {fieldToEdit === "password" ? (
                <>
                  <TextInput
                    placeholder="Enter current password"
                    placeholderTextColor={TEXT_MUTED}
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    style={inputStyle}
                  />
                  <TextInput
                    placeholder="Enter new password"
                    placeholderTextColor={TEXT_MUTED}
                    secureTextEntry
                    value={newValue}
                    onChangeText={setNewValue}
                    style={inputStyle}
                  />
                  <TextInput
                    placeholder="Confirm new password"
                    placeholderTextColor={TEXT_MUTED}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    style={inputStyle}
                  />

                  <Pressable
                    onPress={() => {
                      setModalVisible(false);
                      router.push("/forgot-password");
                    }}
                  >
                    <Text
                      style={{
                        color: BRAND,
                        textAlign: "right",
                        fontWeight: "600",
                        marginBottom: 10,
                      }}
                    >
                      Forgot password?
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <TextInput
                    placeholder={`Enter new ${fieldToEdit}`}
                    placeholderTextColor={TEXT_MUTED}
                    value={newValue}
                    onChangeText={setNewValue}
                    style={inputStyle}
                    keyboardType={
                      fieldToEdit === "phone" ? "phone-pad" : "default"
                    }
                  />
                  <TextInput
                    placeholder="Enter current password"
                    placeholderTextColor={TEXT_MUTED}
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    style={inputStyle}
                  />
                </>
              )}

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  gap: 12,
                }}
              >
                <Pressable onPress={() => setModalVisible(false)}>
                  <Text style={{ color: TEXT_MUTED, fontWeight: "600" }}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  style={{
                    backgroundColor: BRAND,
                    borderRadius: 10,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    {loading ? "Saving..." : "Save"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- Info Row Component ---------- */
function InfoRow({
  label,
  value,
  icon,
  onEdit,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  onEdit: () => void;
}) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <FontAwesome name={icon} size={18} color={BRAND} />
          <Text style={{ fontWeight: "600", marginLeft: 10 }}>{label}</Text>
        </View>
        <TouchableOpacity onPress={onEdit}>
          <FontAwesome name="pencil" size={18} color={BRAND} />
        </TouchableOpacity>
      </View>
      <Text style={{ marginTop: 10, color: TEXT_MUTED, fontSize: 16 }}>
        {value}
      </Text>
    </View>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: BORDER,
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 10,
  marginBottom: 14,
  fontSize: 16,
};
