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
import { SafeAreaView } from "react-native-safe-area-context";
import { useLayoutEffect } from "react";

export default function ContactDetail() {
  const navigation = useNavigation();
  const router = useRouter();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  const {
    firstName,
    lastName,
    phone,
    email,
    company,
    website,
    notes,
    createdAt,
    nickname,
    position,
    additionalPhones,
    _id,
  } = useLocalSearchParams();

  // Parse additional phones if passed as stringified JSON
  const parsedAdditionalPhones: string[] =
    typeof additionalPhones === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(additionalPhones);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : Array.isArray(additionalPhones)
      ? additionalPhones
      : [];

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
      phoneNumbers: [
        ...(phone ? [{ label: "mobile", number: String(phone) }] : []),
        ...parsedAdditionalPhones.map((p) => ({
          label: "other",
          number: p,
        })),
      ],
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
    <View className="mb-4">
      <Text className="font-nunito text-gray-600 mb-1">{label}</Text>
      <View className="flex-row items-center">
        <FontAwesome name={icon} size={18} color="#11224E" />
        <Text className="ml-3 text-base font-nunito text-gray-800 flex-1">
          {value || "—"}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Fixed Header */}
      <View className="bg-blue-900 px-6 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-nunito ml-4">Card Detail</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Card */}
        <View className="bg-blue-100 rounded-xl p-6 items-center mt-6 mx-4 shadow">
          <View className="bg-white w-20 h-20 rounded-full items-center justify-center shadow">
            <Text className="text-xl font-bold text-blue-900">{initials}</Text>
          </View>
          <Text className="mt-4 text-xl font-bold text-blue-900 font-nunito">
            {firstName} {lastName}
          </Text>
          {nickname && (
            <Text className="text-sm text-blue-800 font-nunito italic">
              ({nickname})
            </Text>
          )}
          {position && (
            <Text className="text-sm text-gray-700 font-nunito">
              {position}
            </Text>
          )}
          {phone && (
            <Text className="text-gray-700 font-nunito text-base">
              {phone}
            </Text>
          )}
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
                  nickname,
                  position,
                  additionalPhones: JSON.stringify(parsedAdditionalPhones),
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
        <View className="bg-blue-100 mt-6 mx-4 p-6 rounded-xl">
          <Text className="text-center text-sm text-gray-600 mb-4">
            Card saved at:{" "}
            {createdAt
              ? new Date(createdAt as string).toLocaleString()
              : "N/A"}
          </Text>

          <DetailItem icon="envelope" label="Email" value={email as string} />
          <DetailItem icon="building" label="Company" value={company as string} />
          <DetailItem icon="globe" label="Website" value={website as string} />
          <DetailItem icon="sticky-note" label="Notes" value={notes as string} />

          {parsedAdditionalPhones.length > 0 &&
            parsedAdditionalPhones.map((p, i) => (
              <DetailItem
                key={i}
                icon="phone"
                label={`Additional Phone ${i + 1}`}
                value={p}
              />
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
