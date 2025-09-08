import { FontAwesome } from "@expo/vector-icons";
import { useNavigation, usePathname, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useLayoutEffect, useState } from "react";
import { Alert, Image, SafeAreaView, Text, TouchableOpacity, View } from "react-native";
 
const BRAND_BLUE = "#213BBB";
 
export default function Profile() {
  const navigation = useNavigation();
  const router = useRouter();
  const [user, setUser] = useState({ email: "", name: "", avatar: "" });
 
  // Disable default header for this screen
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);
 
  // Fetch user profile from server
  useEffect(() => {
    const fetchUser = async () => {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) return;
 
      try {
        const res = await fetch("https://cardlink.onrender.com/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
 
        const data = await res.json();
        if (res.ok) {
          setUser(data);
        } else {
          console.error("Fetch failed:", data.message);
        }
      } catch (err) {
        console.error("Network error:", err);
      }
    };
 
    fetchUser();
  }, []); // Ensures this effect only runs once after the component mounts
 
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* 🔹 Top Bar */}
      <View
        style={{
          backgroundColor: BRAND_BLUE,
          paddingTop: 20, // Adjusted padding for better spacing (matches Contacts page)
          paddingBottom: 20, // Bottom padding to give space below title
          marginTop: 30, // Adds space above the top bar to create the "white space"
        }}
        className="px-4 flex-row items-center justify-start" // Align left
      >
        {/* Title on the left */}
        <Text className="text-white font-nunito text-2xl"> {/* Set the exact font size (text-2xl) */}
          Profile
        </Text>
      </View>
 
      {/* Profile Card */}
      <View className="bg-blue-100 mx-4 mt-4 rounded-2xl p-6 items-center">
        <Image
          source={
            user.avatar
              ? { uri: `${user.avatar}?t=${Date.now()}` } // Force refresh the image
              : require("../assets/images/profile1.png")
          }
          className="w-24 h-24 rounded-full"
        />
        <Text className="text-lg mt-3 font-nunito">{user.name || "USER1"}</Text>
        <Text className="text-sm text-gray-600 font-nunito">{user.email}</Text>
      </View>
 
      {/* Info Rows */}
      <View className="mt-10 px-4">
        <TouchableOpacity
          className="flex-row items-center bg-blue-100 rounded-2xl px-6 py-5 mb-3"
          onPress={() => router.push("/edit-profile")}
        >
          <FontAwesome name="pencil" size={22} />
          <Text className="ml-5 font-nunito text-base">Edit Profile</Text>
        </TouchableOpacity>
 
        <View className="flex-row items-center bg-blue-100 rounded-2xl px-6 py-5 mb-3">
          <FontAwesome name="briefcase" size={22} />
          <Text className="ml-5 font-nunito text-base">Business Detail</Text>
        </View>
 
        <View className="flex-row items-center bg-blue-100 rounded-2xl px-6 py-5 mb-3">
          <FontAwesome name="user" size={22} />
          <Text className="ml-5 font-nunito text-base">Account</Text>
        </View>
 
        <TouchableOpacity
          className="flex-row items-center bg-blue-100 rounded-2xl px-6 py-5"
          onPress={() => {
            Alert.alert(
              "Log Out",
              "Are you sure you want to log out?",
              [
                {
                  text: "Cancel",
                  style: "cancel", // This will just close the alert
                },
                {
                  text: "Log Out",
                  style: "destructive", // Destructive style for warning
                  onPress: async () => {
                    await SecureStore.deleteItemAsync("userToken"); // Clear token
                    router.replace("/login"); // Redirect to login page
                  },
                },
              ]
            );
          }}
        >
          <FontAwesome name="sign-out" size={22} />
          <Text className="ml-5 font-nunito text-base">Log Out</Text>
        </TouchableOpacity>
      </View>
 
      {/* Bottom Nav */}
      <BottomNav />
    </SafeAreaView>
  );
}
 
// Bottom Navigation Component (same file as Profile)
function BottomNav({ hidden }: { hidden?: boolean }) {
  if (hidden) return null;
 
  const pathname = usePathname();
  const router = useRouter();
 
  const active: "home" | "contacts" | "calendar" | "profile" =
    pathname.startsWith("/profile")
      ? "profile"
      : pathname.startsWith("/calendar")
      ? "calendar"
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
    <View
      style={{
        position: "absolute",
        left: 20,
        right: 20,
        bottom: 24,
        alignItems: "center",
      }}
      pointerEvents="box-none"
    >
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
        <Item
          icon="address-book-o"
          isActive={active === "contacts"}
          onPress={() => router.replace("/contact")}
        />
        <Item
          icon="calendar-o"
          isActive={active === "calendar"}
          onPress={() => router.replace("/calendar")}
        />
        <Item
          icon="user-o"
          isActive={active === "profile"}
          onPress={() => router.replace("/profile")}
        />
      </View>
    </View>
  );
}