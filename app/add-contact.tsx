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
  const { imageUri, contact: contactParam } = useLocalSearchParams();
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

  useEffect(() => {
  if (contactParam) {
    try {
      const parsedContact = JSON.parse(contactParam as string);
      setContact(parsedContact);
    } catch (e) {
      console.warn("Failed to parse contactParam:", e);
    }
  }
}, [contactParam]);
  const [ocrResult, setOcrResult] = useState<any>(null);
  // 🔍 Run OCR on Cloudinary image
  useEffect(() => {
    if (imageUri) {
      handleOCR(imageUri as string);
    }
  }, [imageUri]);

  const handleOCR = async (cloudinaryUrl: string) => {
  try {
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

    // 🔑 parsed fields
    const parsed = data.parsed || {};

    // 👀 keep raw for debugging / review page
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
  }
};



  // 💾 Save contact with duplicate check
  const handleSave = async () => {
  const token = await SecureStore.getItemAsync("userToken");
  if (!token) {
    Alert.alert("Error", "No token found. Please log in again.");
    return;
  }

  const contactToSave = {
    ...contact,
    additionalPhones: contact.additionalPhones,
  };

  try {
    // 1️⃣ fetch existing contacts
    const resAll = await fetch("https://cardlink.onrender.com/api/contacts", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const existing = await resAll.json();

    if (!resAll.ok || !Array.isArray(existing)) {
      throw new Error("Could not load contacts for duplicate check");
    }

    // 2️⃣ check for duplicate
    const duplicate = existing.find(
      (c: any) =>
        (c.email && contactToSave.email && c.email === contactToSave.email) ||
        (c.phone && contactToSave.phone && c.phone === contactToSave.phone)
    );

    if (duplicate) {
      Alert.alert(
        "Duplicate Contact Found",
        `${contactToSave.firstName} ${contactToSave.lastName} already exists. Do you want to replace it with the latest info?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Keep Both",
            onPress: async () => {
              await actuallySave(token, contactToSave);
            },
          },
          {
            text: "Replace",
            onPress: async () => {
              await replaceContact(token, duplicate._id, contactToSave);
            },
          },
        ]
      );
    } else {
      await actuallySave(token, contactToSave);
    }
  } catch (err: any) {
    Alert.alert("Error", err.message || "Could not save contact");
  }
};


  // helper: save normally
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

  // helper: replace existing
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
    const updatedPhones = [...contact.additionalPhones];
    updatedPhones[index] = value;
    setContact({ ...contact, additionalPhones: updatedPhones });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-blue-900 px-6 py-4 flex-row items-center justify-between">
  <TouchableOpacity onPress={() => router.back()}>
    <FontAwesome name="arrow-left" size={20} color="white" />
  </TouchableOpacity>
  <Text className="text-white text-xl font-nunito">Add</Text>
  {ocrResult && (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/ocr-debug",
          params: {
            contact: JSON.stringify(contact),
            ocrData: JSON.stringify(ocrResult),
          },
        })
      }
    >
      <Text style={{ color: "white", fontWeight: "bold" }}>Review OCR</Text>
    </TouchableOpacity>
  )}
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
