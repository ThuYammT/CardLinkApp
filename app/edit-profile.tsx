//pull shark
import { FontAwesome } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";

import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BRAND_BLUE = "#213BBB";

export default function EditProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    // @ts-ignore
    navigation.setOptions?.({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const loadProfile = async () => {
      const savedToken = await SecureStore.getItemAsync("userToken");
      setToken(savedToken || "");

      try {
        const res = await fetch("https://cardlink.onrender.com/api/auth/me", {
          headers: { Authorization: `Bearer ${savedToken}` },
        });

        const data = await res.json();
        if (res.ok) {
          setName(data.name || "");
          setAvatar(data.avatar || "");
        } else {
          console.error("Load error:", data.message);
        }
      } catch (err) {
        console.error("Network error:", err);
      }
    };

    loadProfile();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatar(uri); // local preview
    }
  };

  const uploadToCloudinary = async (uri: string) => {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
    const data = new FormData();
    data.append("file", `data:image/jpeg;base64,${base64}`);
    data.append("upload_preset", "ml_default");
    data.append("cloud_name", "dwmav1imw");

    const res = await fetch("https://api.cloudinary.com/v1_1/dwmav1imw/image/upload", {
      method: "POST",
      body: data,
    });

    const result = await res.json();
    return result.secure_url;
  };

  const handleSave = async () => {
    try {
      let uploadedAvatar = avatar;

      if (uploadedAvatar && !uploadedAvatar.startsWith("http")) {
        uploadedAvatar = await uploadToCloudinary(uploadedAvatar);
      }

      const res = await fetch("https://cardlink.onrender.com/api/auth/me", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, avatar: uploadedAvatar }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Profile updated!");
        router.replace("/profile");
      } else {
        Alert.alert("Error", data.message || "Something went wrong");
      }
    } catch (err) {
      Alert.alert("Network Error", "Failed to upload image or save profile.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Consistent top bar with reliable back button */}
      <View style={{ backgroundColor: BRAND_BLUE }} className="px-4 py-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <FontAwesome name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-nunito ml-4">Edit Profile</Text>
      </View>

      <View className="px-6 py-8 items-center">
        <TouchableOpacity onPress={pickImage} activeOpacity={0.85}>
          <Image
            source={avatar ? { uri: avatar } : require("../assets/images/profile1.png")}
            style={{ width: 112, height: 112, borderRadius: 56, marginBottom: 8, backgroundColor: "#f1f5f9" }}
          />
          <Text className="text-sm text-blue-600 underline font-nunito text-center">Change Avatar</Text>
        </TouchableOpacity>

        <TextInput
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          className="w-full bg-gray-100 rounded px-4 py-3 my-6 font-nunito"
          placeholderTextColor="#888"
        />

        <TouchableOpacity onPress={handleSave} style={{ backgroundColor: "#F3F6FF", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 999, borderWidth: 1, borderColor: "#E7ECFF" }}>
          <Text style={{ color: BRAND_BLUE, fontWeight: "700", fontSize: 16 }}>Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}