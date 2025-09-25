// app/contact-detail.tsx
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { JSX } from "react/jsx-runtime";

const BRAND_BLUE = "#213BBB";
const GRAY_TEXT = "#374151";
const GRAY_LABEL = "#6B7280";
const LIGHT_BG = "#F9FAFB";

// wrap Image for animation
const AnimatedImage = Animated.createAnimatedComponent(Image);

// --- Robust param normalizer ---
const norm = (v: unknown): string => {
  if (Array.isArray(v)) return String(v[0] ?? "");
  return v == null ? "" : String(v);
};

export default function ContactDetail() {
  const navigation = useNavigation();
  const router = useRouter();

  useLayoutEffect(() => {
    // @ts-ignore
    navigation.setOptions?.({ headerShown: false });
  }, [navigation]);

  const params = useLocalSearchParams();
  const firstName = norm(params.firstName);
  const lastName = norm(params.lastName);
  const phone = norm(params.phone);
  const email = norm(params.email);
  const company = norm(params.company);
  const website = norm(params.website);
  const notes = norm(params.notes);
  const createdAt = norm(params.createdAt);
  const nickname = norm(params.nickname);
  const position = norm(params.position);
  const _id = norm(params._id);
  const cardImage = norm(params.cardImage);
  const additionalPhonesRaw = params.additionalPhones;

  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

  // ✅ normalize additionalPhones into a clean string[]
  const parsedAdditionalPhones: string[] = useMemo(() => {
    if (Array.isArray(additionalPhonesRaw)) {
      return additionalPhonesRaw.map((s) => String(s)).filter(Boolean);
    }
    const raw = norm(additionalPhonesRaw).trim();
    if (!raw) return [];

    try {
      const js = JSON.parse(raw);
      if (Array.isArray(js)) return js.map((x) => String(x)).filter(Boolean);
      if (typeof js === "string") return [js];
    } catch {
      // ignore
    }

    return raw
      .split(",")
      .map((s) => s.trim().replace(/^['"]+|['"]+$/g, ""))
      .filter(Boolean);
  }, [additionalPhonesRaw]);

  // Flip card animation
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);

  const flipCard = () => {
    Animated.timing(flipAnim, {
      toValue: flipped ? 0 : 1,
      duration: 600,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => setFlipped(!flipped));
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  const [frontHeight, setFrontHeight] = useState(200);

  // Info row
  const InfoRow = ({
    label,
    value,
    icon,
  }: {
    label: string;
    value?: string;
    icon: JSX.Element;
  }) => (
    <View
      className="flex-row justify-between items-center py-3"
      style={{ borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}
    >
      <View className="flex-1 pr-4">
        <Text style={{ fontSize: 12, color: GRAY_LABEL, marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 15, color: GRAY_TEXT }}>{value || "None"}</Text>
      </View>
      {icon}
    </View>
  );

  // Dialer
  const openDialer = (raw?: string) => {
    if (!raw) return Alert.alert("No phone", "This contact has no phone number.");
    const url = `tel:${raw}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open dialer.")
    );
  };

  const handleSaveToDevice = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Cannot access device contacts.");
      return;
    }

    const deviceContact = {
      contactType: Contacts.ContactTypes.Person,
      firstName,
      lastName,
      company,
      emails: email ? [{ label: "work", email }] : [],
      phoneNumbers: [
        ...(phone ? [{ label: "mobile", number: phone }] : []),
        ...parsedAdditionalPhones.map((p) => ({ label: "other", number: p })),
      ],
      note: notes,
    };

    try {
      await Contacts.addContactAsync(deviceContact as Contacts.Contact);
      Alert.alert("Saved", "Contact saved to your phone.");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not save contact.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top bar */}
      <View className="px-6 py-5 flex-row items-center" style={{ backgroundColor: BRAND_BLUE }}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl ml-4">Contact Detail</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Flip area */}
        <Pressable onPress={flipCard} className="mt-6 mx-4">
          <View style={{ alignItems: "center", height: frontHeight }}>
            {/* Front */}
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: LIGHT_BG,
                  transform: [{ perspective: 1000 }, { rotateY: frontInterpolate }],
                  backfaceVisibility: "hidden",
                  position: "absolute",
                  width: "100%",
                },
              ]}
              onLayout={(e) => setFrontHeight(e.nativeEvent.layout.height)}
            >
              <View className="w-20 h-20 rounded-full items-center justify-center shadow"
                style={{ backgroundColor: "#E5E7EB" }}>
                <Text className="text-xl font-bold" style={{ color: BRAND_BLUE }}>
                  {initials}
                </Text>
              </View>
              <Text className="mt-4 text-xl font-bold" style={{ color: BRAND_BLUE }}>
                {firstName} {lastName}
              </Text>
              {!!nickname && (
                <Text className="text-sm italic" style={{ color: GRAY_LABEL }}>
                  ({nickname})
                </Text>
              )}
              {!!position && (
                <Text style={{ color: GRAY_TEXT, marginTop: 4 }}>{position}</Text>
              )}
              {!!phone && (
                <Text style={{ color: GRAY_TEXT, marginTop: 4 }}>{phone}</Text>
              )}
            </Animated.View>

            {/* Back */}
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: "#E5E7EB",
                  transform: [{ perspective: 1000 }, { rotateY: backInterpolate }],
                  backfaceVisibility: "hidden",
                  position: "absolute",
                  width: "100%",
                  height: frontHeight,
                },
              ]}
            >
              <View className="flex-1 items-center justify-center">
                {cardImage ? (
                  <View>
                    <Text style={{ color: BRAND_BLUE, marginBottom: 8 }}>Scanned Card</Text>
                    <AnimatedImage
                      source={{ uri: cardImage }}
                      style={{ width: 260, height: 160, borderRadius: 12, resizeMode: "contain" }}
                    />
                  </View>
                ) : (
                  <Text style={{ color: BRAND_BLUE }}>Back Side</Text>
                )}
              </View>
            </Animated.View>
          </View>
        </Pressable>

        {/* Actions */}
        <View className="flex-row justify-around mt-6 px-6">
          <TouchableOpacity className="items-center" onPress={handleSaveToDevice}>
            <FontAwesome name="save" size={20} color={BRAND_BLUE} />
            <Text style={{ color: BRAND_BLUE, marginTop: 4 }}>Save to Phone</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center"
            onPress={() =>
              router.push({
                pathname: "/edit-contact",
                params: {
                  firstName,
                  lastName,
                  phone,
                  email,
                  company,
                  website,
                  notes,
                  nickname,
                  position,
                  additionalPhones: parsedAdditionalPhones.join(","),
                  _id,
                  cardImage: cardImage || "",
                },
              })
            }
          >
            <MaterialIcons name="edit" size={20} color={BRAND_BLUE} />
            <Text style={{ color: BRAND_BLUE, marginTop: 4 }}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View className="mt-6 mx-4 p-4 rounded-xl shadow bg-white border border-gray-200">
          <Text style={{ fontSize: 12, textAlign: "center", color: GRAY_LABEL, marginBottom: 12 }}>
            Card saved at: {createdAt ? new Date(createdAt).toLocaleString() : "N/A"}
          </Text>

          {/* ✅ Mobile field */}
          {phone ? (
            <InfoRow
              label="Mobile"
              value={phone}
              icon={
                <TouchableOpacity
                  onPress={() => openDialer(phone)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#e5e7eb",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FontAwesome name="phone" size={16} color={BRAND_BLUE} />
                </TouchableOpacity>
              }
            />
          ) : null}

          <InfoRow
            label="Email"
            value={email}
            icon={<MaterialIcons name="email" size={20} color={BRAND_BLUE} />}
          />
          <InfoRow
            label="Company"
            value={company}
            icon={<FontAwesome name="building" size={20} color={BRAND_BLUE} />}
          />
          <InfoRow
            label="Website"
            value={website}
            icon={<FontAwesome name="globe" size={20} color={BRAND_BLUE} />}
          />
          <InfoRow
            label="Notes"
            value={notes}
            icon={<MaterialIcons name="sticky-note-2" size={20} color={BRAND_BLUE} />}
          />

          {/* ✅ Additional phones */}
          {parsedAdditionalPhones.length > 0 ? (
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 12, color: GRAY_LABEL, marginBottom: 6 }}>
                Additional Phones
              </Text>
              {parsedAdditionalPhones.map((p, idx) => (
                <View
                  key={`${p}-${idx}`}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 4,
                    borderBottomWidth: idx < parsedAdditionalPhones.length - 1 ? 1 : 0,
                    borderBottomColor: "#E5E7EB",
                  }}
                >
                  <Text style={{ fontSize: 15, color: GRAY_TEXT }}>{p}</Text>
                  <TouchableOpacity
                    onPress={() => openDialer(p)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: "#e5e7eb",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FontAwesome name="phone" size={16} color={BRAND_BLUE} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 14, color: GRAY_LABEL }}>No additional phones</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    minHeight: 180,
  },
});