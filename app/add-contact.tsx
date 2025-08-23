import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useLayoutEffect, useState, useEffect } from "react";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";


export default function AddContactScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { imageUri } = useLocalSearchParams(); // 📸 Cloudinary URL

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
    cardImage: imageUri as string, // 🔑 store the scanned card image
  });

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  // 🔍 Run OCR on Cloudinary image
  useEffect(() => {
    if (imageUri) {
      handleOCR(imageUri as string);
    }
  }, [imageUri]);
  
  const handleOCR = async (cloudinaryUrl: string) => {
  try {
    const token = await SecureStore.getItemAsync("userToken");

    // 1️⃣ Skip re-upload — just send Cloudinary URL to backend
    const response = await fetch("https://cardlink.onrender.com/api/ocr", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl: cloudinaryUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("❌ OCR failed:", data);
      throw new Error(data.message || "OCR processing failed");
    }

    console.log("✅ OCR result:", data);

    // 2️⃣ Save parsed OCR data + card image
    setContact((prev) => ({
      ...prev,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      nickname: data.nickname || "",
      position: data.position || "",
      phone: data.phone || "",
      email: data.email || "",
      company: data.company || "",
      website: data.website || "",
      notes: data.notes || "",
      additionalPhones: data.additionalPhones || [],
      cardImage: cloudinaryUrl, // ✅ store scanned card image
    }));
  } catch (error: any) {
    console.error("❌ OCR error:", error);
    Alert.alert("Error", error.message || "OCR processing failed");
  }
};



  // 💾 Save contact with cardImage
  const handleSave = async () => {
    const token = await SecureStore.getItemAsync("userToken");

    const contactToSave = {
      ...contact,
      additionalPhones: contact.additionalPhones, // keep array, not joined
    };

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
    } catch (err) {
      Alert.alert("Network Error", "Could not connect to server");
    }
  };

  const updateAdditionalPhone = (index: number, value: string) => {
    const updatedPhones = [...contact.additionalPhones];
    updatedPhones[index] = value;
    setContact({ ...contact, additionalPhones: updatedPhones });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-blue-900 px-6 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-nunito ml-4">Add</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
        <View className="bg-blue-100 rounded-2xl p-4">
          {/* Name */}
          <View className="flex-row justify-between">
            <View className="flex-1 mr-1">
              <Text className="font-nunito mb-1">First Name</Text>
              <TextInput
                placeholder="First Name"
                value={contact.firstName}
                onChangeText={(val) =>
                  setContact({ ...contact, firstName: val })
                }
                className="bg-white rounded px-3 py-2"
              />
            </View>
            <View className="flex-1 ml-1">
              <Text className="font-nunito mb-1">Last Name</Text>
              <TextInput
                placeholder="Last Name"
                value={contact.lastName}
                onChangeText={(val) =>
                  setContact({ ...contact, lastName: val })
                }
                className="bg-white rounded px-3 py-2"
              />
            </View>
          </View>

          {/* Nickname & Position */}
          <Text className="font-nunito mt-4 mb-1">Nickname</Text>
          <TextInput
            placeholder="Nickname"
            value={contact.nickname}
            onChangeText={(val) => setContact({ ...contact, nickname: val })}
            className="bg-white rounded px-3 py-2"
          />

          <Text className="font-nunito mt-4 mb-1">Position</Text>
          <TextInput
            placeholder="Position"
            value={contact.position}
            onChangeText={(val) => setContact({ ...contact, position: val })}
            className="bg-white rounded px-3 py-2"
          />

          {/* Main Phone */}
          <Text className="font-nunito mt-4 mb-1">Phone Number</Text>
          <TextInput
            placeholder="Phone Number"
            value={contact.phone}
            onChangeText={(val) => setContact({ ...contact, phone: val })}
            className="bg-white rounded px-3 py-2"
          />

          {/* Additional Phones */}
          <Text className="font-nunito mt-4 mb-1">Additional Phone(s)</Text>
          {contact.additionalPhones.map((num, idx) => (
            <TextInput
              key={idx}
              value={num}
              onChangeText={(val) => updateAdditionalPhone(idx, val)}
              placeholder={`Additional Phone ${idx + 1}`}
              className="bg-white rounded px-3 py-2 mb-2"
            />
          ))}
          <TouchableOpacity
            className="mb-4"
            onPress={() =>
              setContact({
                ...contact,
                additionalPhones: [...contact.additionalPhones, ""],
              })
            }
          >
            <Text className="text-blue-700 font-nunito">
              + Add another phone
            </Text>
          </TouchableOpacity>

          {/* Other Fields */}
          <Text className="font-nunito mb-1">Email</Text>
          <TextInput
            placeholder="Email"
            value={contact.email}
            onChangeText={(val) => setContact({ ...contact, email: val })}
            className="bg-white rounded px-3 py-2"
          />

          <Text className="font-nunito mt-4 mb-1">Company</Text>
          <TextInput
            placeholder="Company"
            value={contact.company}
            onChangeText={(val) => setContact({ ...contact, company: val })}
            className="bg-white rounded px-3 py-2"
          />

          <Text className="font-nunito mt-4 mb-1">Website</Text>
          <TextInput
            placeholder="Website"
            value={contact.website}
            onChangeText={(val) => setContact({ ...contact, website: val })}
            className="bg-white rounded px-3 py-2"
          />

          <Text className="font-nunito mt-4 mb-1">Additional Notes</Text>
          <TextInput
            placeholder="Notes"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={contact.notes}
            onChangeText={(val) => setContact({ ...contact, notes: val })}
            className="bg-white rounded px-3 py-2 h-24"
          />
        </View>

        <TouchableOpacity
          className="mt-8 bg-blue-900 rounded-full py-3 items-center"
          onPress={handleSave}
        >
          <Text className="text-white font-nunito text-lg">Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
