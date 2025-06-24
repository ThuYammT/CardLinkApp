import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useLayoutEffect, useState } from "react";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

export default function EditContactScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [contact, setContact] = useState({
    firstName: String(params.firstName || ""),
    lastName: String(params.lastName || ""),
    phone: String(params.phone || ""),
    email: String(params.email || ""),
    company: String(params.company || ""),
    website: String(params.website || ""),
    notes: String(params.notes || ""),
  });

  const contactId = String(params._id || "");

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  const handleUpdate = async () => {
    const token = await SecureStore.getItemAsync("userToken");

    try {
      const res = await fetch(`https://cardlink.onrender.com/api/contacts/${contactId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contact),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Contact updated successfully!", [
          {
            text: "OK",
            onPress: () => router.replace("/contact"),
          },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to update contact.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-blue-900 px-6 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-nunito ml-4">Edit</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
        <View className="bg-blue-100 rounded-2xl p-4">
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

          <Text className="font-nunito mt-4 mb-1">Phone Number</Text>
          <TextInput
            placeholder="Phone Number"
            value={contact.phone}
            onChangeText={(val) => setContact({ ...contact, phone: val })}
            className="bg-white rounded px-3 py-2"
          />

          <Text className="font-nunito mt-4 mb-1">Email</Text>
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
          onPress={handleUpdate}
        >
          <Text className="text-white font-nunito text-lg">Update Contact</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
