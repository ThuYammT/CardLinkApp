// app/edit-contact.tsx
//pull shark
import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useLayoutEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const BRAND_BLUE = "#213BBB";

/* -------------------- helpers -------------------- */
const S = (v: unknown) => (v == null ? "" : String(v));

const parseAdditionalPhones = (input: unknown): string[] => {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(S).filter(Boolean);
  const raw = S(input).trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(S).filter(Boolean);
    if (typeof parsed === "string") return [parsed].filter(Boolean);
  } catch {}
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
};

/* ---------- Small UI bits (copied to match add-contact) ---------- */
function SectionLabel({ title }: { title: string }) {
  return (
    <Text style={{ color: "#475569", fontWeight: "700", marginBottom: 8, marginTop: 4 }}>
      {title}
    </Text>
  );
}
function Divider() {
  return <View style={{ height: 1, backgroundColor: "#eef2ff", marginVertical: 12 }} />;
}
function Row({ two, children }: { two?: boolean; children: React.ReactNode }) {
  if (!two) return <View style={{ gap: 10 }}>{children}</View>;
  const arr = Array.isArray(children) ? (children as React.ReactNode[]) : [children as React.ReactNode];
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <View style={{ flex: 1 }}>{arr[0]}</View>
      <View style={{ flex: 1 }}>{arr[1]}</View>
    </View>
  );
}
function Input({
  label,
  icon,
  textarea,
  style,
  ...rest
}: {
  label: string;
  icon?: React.ComponentProps<typeof FontAwesome>["name"];
  textarea?: boolean;
  style?: any;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: "#64748b", marginBottom: 6, fontSize: 13 }}>{label}</Text>
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#f8fafc",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            paddingHorizontal: 12,
            paddingVertical: textarea ? 10 : 12,
          },
          style,
        ]}
      >
        {icon && <FontAwesome name={icon} size={16} color="#64748b" />}
        <TextInput
          placeholder={label}
          placeholderTextColor="#94a3b8"
          style={{
            flex: 1,
            marginLeft: icon ? 8 : 0,
            padding: 0,
            color: "#0f172a",
            minHeight: textarea ? 88 : undefined,
          }}
          {...rest}
        />
      </View>
    </View>
  );
}

/* -------------------- screen -------------------- */
export default function EditContactScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  useLayoutEffect(() => {
    // @ts-ignore
    navigation.setOptions?.({ headerShown: false });
  }, [navigation]);

  const contactId = S(params._id);

  const [contact, setContact] = useState({
    firstName: S(params.firstName),
    lastName: S(params.lastName),
    nickname: S(params.nickname),
    position: S(params.position),
    phone: S(params.phone),
    email: S(params.email),
    company: S(params.company),
    website: S(params.website),
    notes: S(params.notes),
    additionalPhones: parseAdditionalPhones(params.additionalPhones),
  });

  const canSubmit = useMemo(
    () => !!contact.firstName.trim() || !!contact.lastName.trim(),
    [contact]
  );

  const updateAdditionalPhone = (index: number, value: string) => {
    const next = [...contact.additionalPhones];
    next[index] = value;
    setContact((c) => ({ ...c, additionalPhones: next }));
  };

  const handleUpdate = async () => {
    if (!canSubmit) {
      Alert.alert("Missing Info", "Please enter at least a first or last name.");
      return;
    }

    const token = await SecureStore.getItemAsync("userToken");
    if (!token) {
      Alert.alert("Error", "No token found. Please log in again.");
      return;
    }

    try {
      const res = await fetch(`https://cardlink.onrender.com/api/contacts/${contactId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...contact,
          additionalPhones: contact.additionalPhones.map(S).filter(Boolean),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Contact updated successfully!", [
          { text: "OK", onPress: () => router.replace("/contact") },
        ]);
      } else {
        Alert.alert("Error", data?.message || "Failed to update contact.");
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f6f7fb" }}>
      {/* Header (matches Add) */}
      <View
        style={{
          backgroundColor: BRAND_BLUE,
          paddingHorizontal: 20,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginLeft: 12 }}>
          Edit
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
          {/* Form Card (same as add-contact) */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: "#E7ECFF",
            }}
          >
            <SectionLabel title="Identity" />
            <Row two>
              <Input
                label="First Name"
                value={contact.firstName}
                onChangeText={(v) => setContact({ ...contact, firstName: v })}
                icon="user"
              />
              <Input
                label="Last Name"
                value={contact.lastName}
                onChangeText={(v) => setContact({ ...contact, lastName: v })}
                icon="user"
              />
            </Row>
            <Input
              label="Nickname"
              value={contact.nickname}
              onChangeText={(v) => setContact({ ...contact, nickname: v })}
              icon="id-badge"
            />
            <Input
              label="Position"
              value={contact.position}
              onChangeText={(v) => setContact({ ...contact, position: v })}
              icon="briefcase"
            />

            <Divider />

            <SectionLabel title="Contact" />
            <Input
              label="Phone Number"
              keyboardType="phone-pad"
              value={contact.phone}
              onChangeText={(v) => setContact({ ...contact, phone: v })}
              icon="phone"
            />

            {/* Additional Phones (same pattern as Add) */}
            {contact.additionalPhones.map((num, idx) => (
              <Input
                key={idx}
                label={`Additional Phone ${idx + 1}`}
                keyboardType="phone-pad"
                value={num}
                onChangeText={(v) => updateAdditionalPhone(idx, v)}
                icon="phone"
              />
            ))}
            <TouchableOpacity
              onPress={() =>
                setContact((c) => ({
                  ...c,
                  additionalPhones: [...c.additionalPhones, ""],
                }))
              }
              style={{ marginBottom: 8 }}
            >
              <Text style={{ color: BRAND_BLUE, fontWeight: "600" }}>
                + Add another phone
              </Text>
            </TouchableOpacity>

            <Input
              label="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={contact.email}
              onChangeText={(v) => setContact({ ...contact, email: v })}
              icon="envelope-o"
            />

            <Divider />

            <SectionLabel title="Company" />
            <Input
              label="Company"
              value={contact.company}
              onChangeText={(v) => setContact({ ...contact, company: v })}
              icon="building-o"
            />
            <Input
              label="Website"
              autoCapitalize="none"
              keyboardType="url"
              value={contact.website}
              onChangeText={(v) => setContact({ ...contact, website: v })}
              icon="globe"
            />

            <Divider />

            <SectionLabel title="Notes" />
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <FontAwesome name="sticky-note-o" size={16} color="#64748b" />
              <Text style={{ color: "#64748b", marginLeft: 8, fontSize: 13 }}>
                Additional Notes
              </Text>
            </View>
            <TextInput
              placeholder="Additional Notes"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={contact.notes}
              onChangeText={(v) => setContact({ ...contact, notes: v })}
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                paddingHorizontal: 12,
                paddingVertical: 12,
                minHeight: 110,
                color: "#0f172a",
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Update Bar (same design as Add) */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: insets.bottom + 12,
          paddingTop: 12,
          paddingHorizontal: 16,
          backgroundColor: "rgba(255,255,255,0.9)",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
        }}
      >
        <TouchableOpacity
          onPress={handleUpdate}
          activeOpacity={0.9}
          style={{
            backgroundColor: BRAND_BLUE,
            borderRadius: 999,
            paddingVertical: 14,
            alignItems: "center",
            justifyContent: "center",
            opacity: canSubmit ? 1 : 0.7,
          }}
          disabled={!canSubmit}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
            Update Contact
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}