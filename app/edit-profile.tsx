import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { FontAwesome } from "@expo/vector-icons";

export default function EditProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [token, setToken] = useState("");

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
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: "base64",
    });

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

      if (!avatar.startsWith("http")) {
        uploadedAvatar = await uploadToCloudinary(avatar);
      }

      const res = await fetch("https://cardlink.onrender.com/api/auth/me", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          avatar: uploadedAvatar,
        }),
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
    <View className="flex-1 bg-white px-6 py-10 items-center">
      <TouchableOpacity onPress={pickImage}>
        <Image
          source={
            avatar
              ? { uri: avatar }
              : require("../assets/images/profile1.png")
          }
          className="w-28 h-28 rounded-full mb-4"
        />
        <Text className="text-sm text-blue-600 underline font-nunito text-center">
          Change Avatar
        </Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
        className="w-full bg-gray-100 rounded px-4 py-3 my-6 font-nunito"
        placeholderTextColor="#888"
      />

      <TouchableOpacity
        onPress={handleSave}
        className="bg-button px-6 py-3 rounded"
      >
        <Text className="text-black font-nunito font-bold text-lg">Save</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="absolute top-10 left-5"
        onPress={() => router.back()}
      >
        <FontAwesome name="arrow-left" size={24} />
      </TouchableOpacity>
    </View>
  );
}
