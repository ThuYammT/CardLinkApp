// app/profile.tsx
//pull shark
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation, usePathname, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BRAND_BLUE = "#213BBB";
const CARD_BG = "#FFFFFF";
const ROW_BG = "#F3F6FF";
const TEXT_PRIMARY = "#1F2937";
const TEXT_SECONDARY = "#6B7280";
const DANGER = "#DC2626";

export default function Profile() {
  const navigation = useNavigation();
  const router = useRouter();
  const [user, setUser] = useState({ email: "", name: "", avatar: "" });

  useLayoutEffect(() => {
    // @ts-ignore
    navigation.setOptions?.({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) return;

      try {
        const res = await fetch("https://cardlink.onrender.com/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setUser(data);
        else console.error("Fetch failed:", data.message);
      } catch (err) {
        console.error("Network error:", err);
      }
    };
    fetchUser();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Bar */}
      <View style={{ backgroundColor: BRAND_BLUE }} className="px-4 py-6 flex-row items-center">
        <Text className="text-white text-2xl font-nunito font-bold">Profile</Text>
      </View>

      {/* Profile Card */}
      <View
        style={{
          backgroundColor: CARD_BG,
          marginHorizontal: 16,
          marginTop: 16,
          borderRadius: 16,
          padding: 20,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
          alignItems: "center",
        }}
      >
        <Image
          source={
            user.avatar
              ? { uri: `${user.avatar}?t=${Date.now()}` } // force refresh
              : require("../assets/images/profile1.png")
          }
          style={{ width: 96, height: 96, borderRadius: 48 }}
        />
        <Text style={{ color: TEXT_PRIMARY }} className="text-lg mt-3 font-nunito font-semibold">
          {user.name || "—"}
        </Text>
        <Text style={{ color: TEXT_SECONDARY }} className="text-sm font-nunito">
          {user.email || "—"}
        </Text>
      </View>

      {/* Info Rows */}
      <View className="mt-8 px-4">
        <RowButton icon="pencil" label="Edit Profile" onPress={() => router.push("/edit-profile")} />
        <RowStatic icon="briefcase" label="Business Detail" />
        <RowStatic icon="user" label="Account" />
        <RowButton
          icon="sign-out"
          label="Log Out"
          danger
          onPress={() =>
            Alert.alert("Log Out", "Are you sure you want to log out?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Log Out",
                style: "destructive",
                onPress: async () => {
                  await SecureStore.deleteItemAsync("userToken");
                  router.replace("/auth");
                },
              },
            ])
          }
        />
      </View>

      {/* Bottom nav */}
      <BottomNav />
    </SafeAreaView>
  );
}

/** ---------------- Row Components ---------------- */
function RowButton({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: ROW_BG,
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 20,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <FontAwesome name={icon} size={20} color={danger ? DANGER : BRAND_BLUE} />
      <Text style={{ marginLeft: 14, color: danger ? DANGER : "#111827" }} className="font-nunito text-base flex-1">
        {label}
      </Text>
      <FontAwesome name="chevron-right" size={16} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

function RowStatic({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  label: string;
}) {
  return (
    <View
      style={{
        backgroundColor: ROW_BG,
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 20,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <FontAwesome name={icon} size={20} color={BRAND_BLUE} />
      <Text className="ml-3 font-nunito text-base text-gray-900 flex-1">{label}</Text>
      <FontAwesome name="chevron-right" size={16} color="#9CA3AF" />
    </View>
  );
}

/** ---------------- BottomNav ---------------- */
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
    isActive,
    onPress,
    icon,
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
          width: 54,
          height: 54,
          borderRadius: 27,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: "rgba(255,255,255,0.85)",
        }}
      >
        <FontAwesome name={icon} size={20} color={BRAND_BLUE} />
      </TouchableOpacity>
    ) : (
      <TouchableOpacity
        onPress={onPress}
        style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          alignItems: "center",
          justifyContent: "center",
        }}
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