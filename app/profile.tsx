import { FontAwesome } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { Image, SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useEffect, useLayoutEffect, useState } from "react";

export const options = {
  headerShown: false,
};

export default function Profile() {
  const navigation = useNavigation();
    useLayoutEffect(() => {
      navigation.setOptions({ headerShown: false });
    }, []);
  const router = useRouter();
  const [user, setUser] = useState({ email: '', name: '', avatar: '' });

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
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Bar */}
      <View className="bg-blue-900 px-4 py-8 flex-row items-center">
        <Text className="text-white text-xl font-nunito ml-3">Profile</Text>
      </View>

      {/* Profile Card */}
      <View className="bg-blue-100 mx-4 mt-4 rounded-2xl p-6 items-center">
        <Image
          source={
            user.avatar
              ? { uri: `${user.avatar}?t=${Date.now()}` } // Force refresh
              : require("../assets/images/profile1.png")
          }
          className="w-24 h-24 rounded-full"
        />
        <Text className="text-lg mt-3 font-nunito">
          {user.name || "USER1"}
        </Text>
        <Text className="text-sm text-gray-600 font-nunito">{user.email}</Text>
      </View>

      {/* Info Rows */}
      <View className="mt-10 px-4">
        <TouchableOpacity
          className="flex-row items-center bg-blue-100 rounded-2xl px-6 py-5 mb-3"
          onPress={() => router.push('/edit-profile')}
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
          onPress={async () => {
            await SecureStore.deleteItemAsync("userToken");
            router.replace('/login');
          }}
        >
          <FontAwesome name="sign-out" size={22} />
          <Text className="ml-5 font-nunito text-base">Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Nav */}
      <View className="absolute bottom-0 left-0 right-0 bg-white py-3 flex-row justify-around border-t border-gray-200">
                <TouchableOpacity onPress={() => router.replace("/home")}>
                  <FontAwesome name="home" size={24} color="#11224E" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.replace("/contact")}>
                  <FontAwesome name="id-card" size={24} color="#11224E" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.replace("/calendar")}>
                  <FontAwesome name="calendar" size={24} color="#11224E" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.replace("/profile")}>
                  <FontAwesome name="user" size={24} color="#11224E" />
                </TouchableOpacity>
              </View>
    </SafeAreaView>
  );
}
