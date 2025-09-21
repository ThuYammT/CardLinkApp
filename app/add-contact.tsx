// app/add-contact.tsx
import { FontAwesome } from "@expo/vector-icons";
import {
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
 
/* ---------- Param Helpers ---------- */
function useParamString(name: string): string {
  const params = useLocalSearchParams<{ imageUri?: string | string[]; contact?: string }>();
  const value = params[name as keyof typeof params];
  return Array.isArray(value) ? value[0] : value ?? "";
}
 
/* ---------- Component ---------- */
export default function AddContactScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
 
  const imageUri = useParamString("imageUri");
  const contactParam = useParamString("contact");
 
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
 
  const [contact, setContact] = useState({
    firstName: "",
    lastName: "",
    nickname: "",
    position: "",
    phone: "",
    email: "",
    company: "",
    website: "",
    notes: "",
    additionalPhones: [] as string[],
    cardImage: imageUri || "",
  });
 
  // parse prefilled contact if passed
  useEffect(() => {
    if (contactParam) {
      try {
        const parsed = JSON.parse(contactParam);
        setContact(parsed);
      } catch (e) {
        console.warn("❌ Failed to parse contactParam:", e);
      }
    }
  }, [contactParam]);
 
  useLayoutEffect(() => {
    // @ts-ignore
    navigation.setOptions?.({ headerShown: false });
  }, [navigation]);
 
  /* ---------- OCR ---------- */
  useEffect(() => {
    if (imageUri) handleOCR(imageUri);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUri]);
 
  const handleOCR = async (cloudinaryUrl: string) => {
    try {
      setOcrLoading(true);
      const token = await SecureStore.getItemAsync("userToken");
      const response = await fetch("https://cardlink.onrender.com/api/ocr", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl: cloudinaryUrl }),
      });
 
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "OCR failed");
 
      console.log("✅ OCR result:", data);
 
      const parsed = data.parsed || {};
      setOcrResult(data);
 
      setContact((prev) => ({
        ...prev,
        firstName: parsed.firstName?.value || "",
        lastName: parsed.lastName?.value || "",
        nickname: parsed.nickname?.value || "",
        position: parsed.position?.value || "",
        phone: parsed.phone?.value || "",
        email: parsed.email?.value || "",
        company: parsed.company?.value || "",
        website: parsed.website?.value || "",
        notes: parsed.notes?.value || "",
        additionalPhones: Array.isArray(parsed.additionalPhones)
          ? parsed.additionalPhones.map((p: any) => p.value || "")
          : [],
        cardImage: cloudinaryUrl,
      }));
    } catch (err: any) {
      console.error("❌ OCR error:", err);
      Alert.alert("Error", err.message || "OCR processing failed");
    } finally {
      setOcrLoading(false);
    }
  };
 
  /* ---------- Save ---------- */
  const handleSave = async () => {
    if (ocrLoading) return;
 
    const token = await SecureStore.getItemAsync("userToken");
    if (!token) {
      Alert.alert("Error", "No token found. Please log in again.");
      return;
    }
 
    const contactToSave = { ...contact };
 
    try {
      const resAll = await fetch("https://cardlink.onrender.com/api/contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const existing = await resAll.json();
 
      if (!resAll.ok || !Array.isArray(existing)) {
        throw new Error("Could not load contacts for duplicate check");
      }
 
      // helper to normalize values
      const normalize = (s: string) => (s || "").trim().toLowerCase();

      const duplicate = existing.find((c: any) => {
        const sameEmail =
          c.email && contactToSave.email && normalize(c.email) === normalize(contactToSave.email);
        const samePhone =
          c.phone && contactToSave.phone && normalize(c.phone) === normalize(contactToSave.phone);
        const sameName =
          normalize(c.firstName) === normalize(contactToSave.firstName) &&
          normalize(c.lastName) === normalize(contactToSave.lastName);

        return sameEmail || samePhone || sameName;
      });

 
      if (duplicate) {
        Alert.alert(
          "Duplicate Contact Found",
          `${contactToSave.firstName} ${contactToSave.lastName} already exists. Replace it with the latest info?`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Keep Both", onPress: async () => await actuallySave(token, contactToSave) },
            { text: "Replace", onPress: async () => await replaceContact(token, duplicate._id, contactToSave) },
          ]
        );
      } else {
        await actuallySave(token, contactToSave);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not save contact");
    }
  };
 
  const actuallySave = async (token: string, contactToSave: any) => {
    try {
      const res = await fetch("https://cardlink.onrender.com/api/contacts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactToSave),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Saved", "Contact added successfully!");
        router.replace("/contact");
      } else {
        Alert.alert("Error", data.message || "Failed to save");
      }
    } catch {
      Alert.alert("Network Error", "Could not connect to server");
    }
  };
 
  const replaceContact = async (token: string, id: string, newData: any) => {
    try {
      const res = await fetch(`https://cardlink.onrender.com/api/contacts/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newData),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Updated", "Contact replaced with latest info!");
        router.replace("/contact");
      } else {
        Alert.alert("Error", data.message || "Failed to replace contact");
      }
    } catch {
      Alert.alert("Network Error", "Could not connect to server");
    }
  };
 
  const updateAdditionalPhone = (index: number, value: string) => {
    const updated = [...contact.additionalPhones];
    updated[index] = value;
    setContact({ ...contact, additionalPhones: updated });
  };
 
  /* ---------- UI ---------- */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f6f7fb" }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: BRAND_BLUE,
          paddingHorizontal: 20,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>Add Contact</Text>
      </View>
 
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
          {/* Scanned Card Preview */}
          {imageUri ? (
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 12,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: "#E7ECFF",
                position: "relative",
              }}
            >
              <Text style={{ fontWeight: "600", color: "#334155", marginBottom: 8 }}>Scanned Card</Text>
              <Image
                source={{ uri: String(imageUri) }}
                style={{ width: "100%", height: 190, borderRadius: 12, backgroundColor: "#f1f5f9" }}
                resizeMode="contain"
              />
              {ocrLoading && (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: 34,
                    left: 12,
                    right: 12,
                    bottom: 12,
                    borderRadius: 12,
                    backgroundColor: "rgba(255,255,255,0.85)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ActivityIndicator size="large" color={BRAND_BLUE} />
                  <Text style={{ color: "#334155", fontWeight: "600" }}>Processing OCR…</Text>
                </View>
              )}
            </View>
          ) : null}
 
          {/* Form */}
          <FormSection title="Identity">
            <Row two>
              <Input label="First Name" value={contact.firstName} onChangeText={(v) => setContact({ ...contact, firstName: v })} icon="user" />
              <Input label="Last Name" value={contact.lastName} onChangeText={(v) => setContact({ ...contact, lastName: v })} icon="user" />
            </Row>
            <Input label="Nickname" value={contact.nickname} onChangeText={(v) => setContact({ ...contact, nickname: v })} icon="id-badge" />
            <Input label="Position" value={contact.position} onChangeText={(v) => setContact({ ...contact, position: v })} icon="briefcase" />
          </FormSection>
 
          <Divider />
 
          <FormSection title="Contact">
            <Input label="Phone Number" keyboardType="phone-pad" value={contact.phone} onChangeText={(v) => setContact({ ...contact, phone: v })} icon="phone" />
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
            <TouchableOpacity onPress={() => setContact({ ...contact, additionalPhones: [...contact.additionalPhones, ""] })}>
              <Text style={{ color: BRAND_BLUE, fontWeight: "600" }}>+ Add another phone</Text>
            </TouchableOpacity>
            <Input label="Email" keyboardType="email-address" autoCapitalize="none" value={contact.email} onChangeText={(v) => setContact({ ...contact, email: v })} icon="envelope-o" />
          </FormSection>
 
          <Divider />
 
          <FormSection title="Company">
            <Input label="Company" value={contact.company} onChangeText={(v) => setContact({ ...contact, company: v })} icon="building-o" />
            <Input label="Website" autoCapitalize="none" keyboardType="url" value={contact.website} onChangeText={(v) => setContact({ ...contact, website: v })} icon="globe" />
          </FormSection>
 
          <Divider />
 
          <FormSection title="Notes">
            <TextInput
              placeholder="Additional Notes"
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
          </FormSection>
        </ScrollView>
      </KeyboardAvoidingView>
 
      {/* Sticky Save Bar */}
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
          onPress={() => {
            if (ocrResult) {
              router.push({
                pathname:"/manual-fill",
                params: {
                  contact: JSON.stringify(contact),
                  ocrData: JSON.stringify(ocrResult),
                },
              });
            } else {
              Alert.alert(
                "No Information",
                "Please scan a card or import from gallery before using Manual Fill."
              );
            }
          }}
          activeOpacity={0.9}
          style={{
            borderRadius: 999,
            paddingVertical: 12,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: BRAND_BLUE,
            marginBottom: 10,
            flexDirection: "row",
            gap: 8,
          }}
        >
          <FontAwesome name="pencil" size={16} color={BRAND_BLUE} />
          <Text style={{ color: BRAND_BLUE, fontWeight: "700", fontSize: 15 }}>
            Manual Fill
          </Text>
        </TouchableOpacity>
 
        <TouchableOpacity
          onPress={handleSave}
          disabled={ocrLoading}
          style={{
            backgroundColor: BRAND_BLUE,
            borderRadius: 999,
            paddingVertical: 14,
            alignItems: "center",
            justifyContent: "center",
            opacity: ocrLoading ? 0.6 : 1,
            flexDirection: "row",
          }}
        >
          {ocrLoading ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Please wait…</Text>
            </>
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Save Contact</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
 
/* ---------- Small UI Bits ---------- */
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={{ color: "#475569", fontWeight: "700", marginBottom: 8, marginTop: 4 }}>{title}</Text>
      {children}
    </View>
  );
}
function Divider() {
  return <View style={{ height: 1, backgroundColor: "#eef2ff", marginVertical: 12 }} />;
}
function Row({ two, children }: { two?: boolean; children: React.ReactNode }) {
  if (!two) return <View style={{ gap: 10 }}>{children}</View>;
  const arr = Array.isArray(children) ? (children as React.ReactNode[]) : [children];
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <View style={{ flex: 1 }}>{arr[0]}</View>
      <View style={{ flex: 1 }}>{arr[1]}</View>
    </View>
  );
}
function Input({ label, icon, ...rest }: { label: string; icon?: React.ComponentProps<typeof FontAwesome>["name"] } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: "#64748b", marginBottom: 6, fontSize: 13 }}>{label}</Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#f8fafc",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          paddingHorizontal: 12,
          paddingVertical: 12,
        }}
      >
        {icon && <FontAwesome name={icon} size={16} color="#64748b" />}
        <TextInput
          placeholder={label}
          placeholderTextColor="#94a3b8"
          style={{ flex: 1, marginLeft: icon ? 8 : 0, color: "#0f172a" }}
          {...rest}
        />
      </View>
    </View>
  );
}