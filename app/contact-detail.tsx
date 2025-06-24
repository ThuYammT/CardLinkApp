import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";

export default function ContactDetail() {
  const router = useRouter();
  const {
    firstName,
    lastName,
    phone,
    email,
    company,
    website,
    notes,
    createdAt,
    _id,
  } = useLocalSearchParams();

  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

  const handleSaveToDevice = async () => {
  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permission Denied", "Cannot access device contacts.");
    return;
  }

  const contact = {
    contactType: Contacts.ContactTypes.Person, // ✅ REQUIRED
    firstName: String(firstName || ""),
    lastName: String(lastName || ""),
    company: String(company || ""),
    emails: email ? [{ label: "work", email: String(email) }] : [],
    phoneNumbers: phone ? [{ label: "mobile", number: String(phone) }] : [],
    note: String(notes || ""),
  };

  try {
    await Contacts.addContactAsync(contact as Contacts.Contact); // ✅ Type cast
    Alert.alert("Saved", "Contact saved to your phone.");
  } catch (err) {
    console.error(err);
    Alert.alert("Error", "Could not save contact.");
  }
};


  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-blue-900 px-4 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl ml-4 font-nunito">Card Detail</Text>
      </View>

      {/* Profile Card */}
      <View className="bg-blue-100 rounded-xl p-6 items-center mt-6 mx-4 shadow">
        <View className="bg-white w-16 h-16 rounded-full items-center justify-center shadow">
          <Text className="text-lg font-bold">{initials}</Text>
        </View>
        <Text className="mt-4 text-lg font-semibold font-nunito">
          {firstName} {lastName}
        </Text>
        <Text className="text-gray-700 font-nunito">{phone}</Text>
      </View>

      {/* Buttons */}
      <View className="flex-row justify-around mt-4">
        <TouchableOpacity className="items-center" onPress={handleSaveToDevice}>
          <FontAwesome name="phone" size={20} color="#1996fc" />
          <Text className="text-[#1996fc] mt-1 font-nunito">Save to contact</Text>
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
                _id: String(_id),
              },
            })
          }
        >
          <MaterialIcons name="edit" size={20} color="#1996fc" />
          <Text className="text-[#1996fc] mt-1 font-nunito">Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Contact Info */}
      <View className="bg-blue-100 mt-6 mx-4 p-4 rounded-xl">
        <Text className="text-center text-sm text-gray-600 mb-3">
          Card saved at : {createdAt ? new Date(createdAt as string).toLocaleString() : "N/A"}
        </Text>

        <Text className="font-nunito text-sm text-gray-600">Email</Text>
        <Text className="bg-white p-2 rounded mb-2 text-sm font-nunito">{email || "—"}</Text>

        <Text className="font-nunito text-sm text-gray-600">Company</Text>
        <Text className="bg-white p-2 rounded mb-2 text-sm font-nunito">{company || "—"}</Text>

        <Text className="font-nunito text-sm text-gray-600">Website</Text>
        <Text className="bg-white p-2 rounded mb-2 text-sm font-nunito">
          {website || "—"}
        </Text>

        <Text className="font-nunito text-sm text-gray-600">Additional Note</Text>
        <Text className="bg-white p-2 rounded mb-2 text-sm font-nunito h-20">
          {notes || "—"}
        </Text>
      </View>
    </ScrollView>
  );
}
