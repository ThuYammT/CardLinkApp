// pull shark
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { router, useNavigation, usePathname, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import LottieView from "lottie-react-native";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AnimatedSwipeableRow from "../app/AnimatedSwipeableRow"; // ✅ use your fixed version

type Contact = {
  cardImage?: string;
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  company?: string;
  website?: string;
  notes?: string;
  isFavorite?: boolean;
  nickname?: string;
  position?: string;
  additionalPhones?: string[];
  createdAt?: string;
};

const BRAND_BLUE = "#213BBB";
const LIGHT_PANEL = "#CFE4FF";
const ICON_BLUE = "#1996fc";
const CARD_BORDER = "#bfdbfe";
const STAR_YELLOW = "#F4C430";
const safe = (v?: string) => (v && v.trim().length ? v : "—");

export default function HomeScreen() {
  const navigation = useNavigation();
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const lottieRef = useRef<LottieView>(null);

  useLayoutEffect(() => {
    // @ts-ignore
    navigation.setOptions?.({ headerShown: false });
  }, []);

  useEffect(() => {
    fetchRecentContacts();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRecentContacts();
      return undefined;
    }, [])
  );

  const fetchRecentContacts = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const res = await fetch("https://cardlink.onrender.com/api/contacts", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const sorted = [...data].sort((a, b) => {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        setRecentContacts(sorted.slice(0, 4));
      }
    } catch (e) {
      console.error("Failed to fetch recent contacts:", e);
    }
  };

  const openCamera = () => {
    setSheetOpen(false);
    router.push("/scan");
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      // @ts-ignore
      const dest = `${FileSystem.documentDirectory}selected.jpg`; // ✅ safer string

      try {
        await FileSystem.copyAsync({ from: uri, to: dest });
        console.log("✅ Saved gallery image to:", dest);

        setSheetOpen(false);
        router.push({ pathname: "/crop", params: { imageUri: dest } });
      } catch (err) {
        console.error("❌ Failed to copy image:", err);
        // fallback: send original URI
        router.push({ pathname: "/crop", params: { imageUri: uri } });
      }
    }

  };


  /* ---------- Favorites / Call / Delete ---------- */
  const toggleFavorite = async (contact: Contact) => {
    setRecentContacts((prev) =>
      prev.map((c) => (c._id === contact._id ? { ...c, isFavorite: !c.isFavorite } : c))
    );
    try {
      const token = await SecureStore.getItemAsync("userToken");
      await fetch(`https://cardlink.onrender.com/api/contacts/${contact._id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !contact.isFavorite }),
      });
    } catch {
      // revert if fails
      setRecentContacts((prev) =>
        prev.map((c) => (c._id === contact._id ? { ...c, isFavorite: contact.isFavorite } : c))
      );
      Alert.alert("Error", "Could not update favorite.");
    }
  };

  const normalizePhone = (n: string) => n.replace(/[()\-\s]/g, "");
  const getAllNumbers = (c: Contact) =>
    Array.from(new Set([c.phone, ...(c.additionalPhones || [])].map(n => (n || "").trim()).filter(Boolean)));

  const openDialer = (raw?: string) => {
    if (!raw) {
      Alert.alert("No phone", "This contact has no phone number.");
      return;
    }
    const url = `tel:${normalizePhone(raw)}`;
    Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open dialer."));
  };

  const chooseAndCall = (c: Contact) => {
    const nums = getAllNumbers(c);
    if (nums.length === 0) return Alert.alert("No phone", "This contact has no phone number.");
    if (nums.length === 1) return openDialer(nums[0]);
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: `Call ${`${c.firstName} ${c.lastName}`.trim()}`, options: [...nums, "Cancel"], cancelButtonIndex: nums.length },
        (i) => { if (i !== undefined && i >= 0 && i < nums.length) openDialer(nums[i]); }
      );
    } else {
      Alert.alert("Call number", "Choose a number", [
        ...nums.map(n => ({ text: n, onPress: () => openDialer(n) })),
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const confirmDelete = (contactId: string) =>
    Alert.alert("Delete Contact", "Are you sure you want to delete this contact?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => handleDelete(contactId) },
    ]);

  const handleDelete = async (contactId: string) => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const res = await fetch(`https://cardlink.onrender.com/api/contacts/${contactId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) setRecentContacts(prev => prev.filter(c => c._id !== contactId));
      else Alert.alert("Error", "Failed to delete contact.");
    } catch {
      Alert.alert("Error", "Something went wrong.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Bar */}
      <View style={{ backgroundColor: BRAND_BLUE }} className="px-4 py-6 flex-row items-center">
        <Text className="text-white text-2xl font-nunito">CardLink</Text>
      </View>

      {/* Header panel with animation */}
      <View style={{ backgroundColor: LIGHT_PANEL }} className="items-center py-8">
        <LottieView
          ref={lottieRef}
          source={require("../assets/animations/NFC_Card_Read.json")}
          autoPlay
          loop
          style={{ width: 240, height: 160 }}
        />

        {/* Primary action */}
        <TouchableOpacity
          onPress={() => setSheetOpen(true)}
          activeOpacity={0.9}
          style={{
            backgroundColor: BRAND_BLUE,
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 18,
            marginTop: 12,
            elevation: 2,
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
          }}
          className="flex-row items-center"
        >
          <FontAwesome name="id-card" size={18} color="#fff" />
          <Text className="text-white text-[16px] font-semibold ml-2">Add Business Card</Text>
        </TouchableOpacity>
      </View>

      {/* Recent header */}
      <View className="px-4 py-3 flex-row justify-between items-center">
        <Text className="text-lg font-semibold text-gray-700">Recent</Text>
        <TouchableOpacity onPress={() => router.push("/contact")}>
          <Text style={{ color: BRAND_BLUE }} className="font-medium">
            View All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent list */}
      <ScrollView className="px-4 mb-24">
        {recentContacts.map((c) => (
          <AnimatedSwipeableRow
            key={c._id}
            onCall={() => chooseAndCall(c)}
            onDelete={() => confirmDelete(c._id)}
            hasPhone={getAllNumbers(c).length > 0}
          >
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/contact-detail",
                  params: {
                    _id: c._id,
                    firstName: c.firstName,
                    lastName: c.lastName,
                    phone: c.phone || "",
                    email: c.email || "",
                    company: c.company || "",
                    website: c.website || "",
                    notes: c.notes || "",
                    nickname: c.nickname || "",
                    position: c.position || "",
                    additionalPhones: JSON.stringify(c.additionalPhones || []),
                    createdAt: c.createdAt || "",
                    cardImage: c.cardImage || "",
                    isFavorite: String(c.isFavorite ?? false),
                  },
                })
              }
            >
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 16,
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: CARD_BORDER,
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 3,
                  minHeight: 108,
                }}
              >
                {/* Top row with initials, name/nickname, favorite star */}
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-blue-200 rounded-full justify-center items-center">
                    <Text className="text-white font-bold text-sm">
                      {(c.firstName?.[0] || "").toUpperCase()}
                      {(c.lastName?.[0] || "").toUpperCase()}
                    </Text>
                  </View>

                  <View className="ml-3 flex-1">
                    {c.nickname ? (
                      <>
                        {/* Nickname as main */}
                        <Text className="text-xl font-bold text-blue-900 font-nunito">
                          {c.nickname}
                        </Text>
                        {/* Full name as subtitle */}
                        <Text className="text-xs text-gray-500">
                          {c.firstName} {c.lastName}
                        </Text>
                      </>
                    ) : (
                      // No nickname → show full name as main
                      <Text className="text-xl font-bold text-blue-900 font-nunito">
                        {c.firstName} {c.lastName}
                      </Text>
                    )}
                  </View>

                  {/* Favorite star */}
                  <TouchableOpacity
                    onPress={() => toggleFavorite(c)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{
                      backgroundColor: "#f4f6ff",
                      borderWidth: 1,
                      borderColor: "#e3e8ff",
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FontAwesome
                      name={c.isFavorite ? "star" : "star-o"}
                      size={16}
                      color={c.isFavorite ? STAR_YELLOW : "#c9d2f6"}
                    />
                  </TouchableOpacity>
                </View>

                {/* Contact details */}
                <View className="mt-3">
                  <View className="flex-row items-center mb-1">
                    <FontAwesome name="phone" size={14} color={ICON_BLUE} />
                    <Text className="ml-2 text-sm text-gray-800">{safe(c.phone)}</Text>
                  </View>
                  <View className="flex-row items-center mb-1">
                    <MaterialIcons name="email" size={14} color={ICON_BLUE} />
                    <Text className="ml-2 text-sm text-gray-800">{safe(c.email)}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <FontAwesome name="briefcase" size={14} color={ICON_BLUE} />
                    <Text className="ml-2 text-sm text-gray-800">{safe(c.company)}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          </AnimatedSwipeableRow>
        ))}
      </ScrollView>

      {/* Bottom Sheet */}
      <Modal transparent visible={sheetOpen} animationType="fade" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)" }} onPress={() => setSheetOpen(false)}>
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <View
              style={{
                backgroundColor: "#fff",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                paddingHorizontal: 16,
                paddingTop: 8,
                paddingBottom: 24,
              }}
            >
              <View style={{ alignItems: "center", paddingVertical: 8 }}>
                <View style={{ width: 40, height: 4, backgroundColor: "#e5e7eb", borderRadius: 999 }} />
              </View>

              <Pressable
                onPress={openCamera}
                style={{
                  borderWidth: 1,
                  borderColor: "#E7ECFF",
                  backgroundColor: "#F6F7FB",
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  marginBottom: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FontAwesome name="camera" size={16} color={BRAND_BLUE} />
                <Text style={{ marginLeft: 8, fontSize: 15, color: BRAND_BLUE }}>Scan with Camera</Text>
              </Pressable>

              <Pressable
                onPress={openGallery}
                style={{
                  borderWidth: 1,
                  borderColor: "#E7ECFF",
                  backgroundColor: "#F6F7FB",
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FontAwesome name="image" size={16} color={BRAND_BLUE} />
                <Text style={{ marginLeft: 8, fontSize: 15, color: BRAND_BLUE }}>Import from Gallery</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <BottomNav />
    </SafeAreaView>
  );
}

/* ---------- BottomNav ---------- */
function BottomNav({ hidden }: { hidden?: boolean }) {
  if (hidden) return null;
  const pathname = usePathname();
  const router = useRouter();

  const active: "home" | "contacts" | "profile" =
    pathname.startsWith("/profile")
      ? "profile"
        : pathname.startsWith("/contact")
          ? "contacts"
          : "home";

  const Item = ({
    isActive, onPress, icon,
  }: {
    isActive?: boolean;
    onPress: () => void;
    icon: React.ComponentProps<typeof FontAwesome>["name"];
  }) =>
    isActive ? (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={{
          width: 54, height: 54, borderRadius: 27, backgroundColor: "#FFFFFF",
          alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.85)",
        }}
      >
        <FontAwesome name={icon} size={20} color={BRAND_BLUE} />
      </TouchableOpacity>
    ) : (
      <TouchableOpacity
        onPress={onPress}
        style={{ width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" }}
      >
        <FontAwesome name={icon} size={20} color="#FFFFFF" />
      </TouchableOpacity>
    );

  return (
    <View style={{ position: "absolute", left: 20, right: 20, bottom: 24, alignItems: "center" }} pointerEvents="box-none">
      <View
        style={{
          backgroundColor: BRAND_BLUE,
          borderRadius: 999,
          paddingVertical: 12,
          paddingHorizontal: 18,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        }}
      >
        <Item icon="home" isActive={active === "home"} onPress={() => router.replace("/home")} />
        <Item icon="address-book-o" isActive={active === "contacts"} onPress={() => router.replace("/contact")} />
        <Item icon="user-o" isActive={active === "profile"} onPress={() => router.replace("/profile")} />
      </View>
    </View>
  );
}