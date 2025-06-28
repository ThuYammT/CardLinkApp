import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import {
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import {
  FontAwesome,
  MaterialIcons,
} from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import { useLayoutEffect } from "react";

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
      contactType: Contacts.ContactTypes.Person,
      firstName: String(firstName || ""),
      lastName: String(lastName || ""),
      company: String(company || ""),
      emails: email ? [{ label: "work", email: String(email) }] : [],
      phoneNumbers: phone ? [{ label: "mobile", number: String(phone) }] : [],
      note: String(notes || ""),
    };

    try {
      await Contacts.addContactAsync(contact as Contacts.Contact);
      Alert.alert("Saved", "Contact saved to your phone.");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not save contact.");
    }
  };

  const DetailItem = ({
    icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value?: string;
  }) => (
    <View className="mb-3">
      <Text className="font-nunito text-gray-600 mb-1">{label}</Text>
      <View className="bg-white p-3 rounded-lg flex-row items-center">
        <FontAwesome name={icon} size={16} color="#11224E" />
        <Text className="ml-2 text-sm font-nunito text-gray-800">
          {value || "—"}
        </Text>
      </View>
    </View>
  );

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
        <View className="bg-white w-20 h-20 rounded-full items-center justify-center shadow">
          <Text className="text-xl font-bold text-blue-900">{initials}</Text>
        </View>
        <Text className="mt-4 text-xl font-bold text-blue-900 font-nunito">
          {firstName} {lastName}
        </Text>
        <Text className="text-gray-700 font-nunito text-sm">{phone}</Text>
      </View>

      {/* Buttons */}
      <View className="flex-row justify-around mt-6 px-6">
        <TouchableOpacity className="items-center" onPress={handleSaveToDevice}>
          <FontAwesome name="phone" size={20} color="#1996fc" />
          <Text className="text-[#1996fc] mt-1 font-nunito">Save to Phone</Text>
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
          Card saved at :{" "}
          {createdAt
            ? new Date(createdAt as string).toLocaleString()
            : "N/A"}
        </Text>

        <DetailItem icon="envelope" label="Email" value={email as string} />
        <DetailItem icon="building" label="Company" value={company as string} />
        <DetailItem icon="globe" label="Website" value={website as string} />
        <DetailItem icon="sticky-note" label="Notes" value={notes as string} />
      </View>
    </ScrollView>
  );
}
