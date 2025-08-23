import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import {
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { JSX } from "react/jsx-runtime";

// wrap Image for animation
const AnimatedImage = Animated.createAnimatedComponent(Image);

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
    cardImage, // ✅ Cloudinary image url
  } = useLocalSearchParams();

  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

  // normalize additionalPhones into array
  const parsedAdditionalPhones: string[] = useMemo(() => {
    if (Array.isArray(additionalPhones)) return additionalPhones as string[];
    if (typeof additionalPhones === "string" && additionalPhones.trim().length) {
      return additionalPhones
        .split(",")
        .map((s) => s.trim().replace(/^['"]+|['"]+$/g, ""))
        .filter(Boolean);
    }
    return [];
  }, [additionalPhones]);

  // flip animation state
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);

  const flipCard = () => {
    Animated.timing(flipAnim, {
      toValue: flipped ? 0 : 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => setFlipped(!flipped));
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  // measure front height
  const [frontHeight, setFrontHeight] = useState(200);

  // InfoRow component
  const InfoRow = ({
    label,
    value,
    icon,
  }: {
    label: string;
    value?: string;
    icon: JSX.Element;
  }) => (
    <View
      className="flex-row justify-between items-center py-4"
      style={{ borderBottomWidth: 1, borderBottomColor: "#203d8b2f" }}
    >
      <View className="flex-1 pr-4">
        <Text className="text-xs text-gray-500 mb-1">{label}</Text>
        <Text className="text-base text-gray-800 font-nunito">
          {value || "None"}
        </Text>
      </View>
      {icon}
    </View>
  );

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
        ...parsedAdditionalPhones.map((p) => ({ label: "other", number: p })),
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top bar */}
      <View className="bg-blue-900 px-6 py-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-nunito ml-4">
          Contact Detail
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Flip card */}
        <Pressable onPress={flipCard} className="mt-6 mx-4">
          <View style={{ alignItems: "center", height: frontHeight }}>
            {/* front */}
            <Animated.View
              style={[
                styles.card,
                {
                  transform: [{ rotateY: frontInterpolate }],
                  backfaceVisibility: "hidden",
                  position: "absolute",
                  width: "100%",
                },
              ]}
              onLayout={(e) => setFrontHeight(e.nativeEvent.layout.height)}
            >
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
                <Text className="text-gray-700 font-nunito text-base">{phone}</Text>
              )}
            </Animated.View>

            {/* back */}
            <Animated.View
              style={[
                styles.card,
                {
                  transform: [{ rotateY: backInterpolate }],
                  backfaceVisibility: "hidden",
                  position: "absolute",
                  width: "100%",
                  height: frontHeight, // match front
                },
              ]}
            >
              <View className="flex-1 items-center justify-center">
                {cardImage ? (
                  <View>
                    <Text className="text-blue-900 font-nunito mb-2">
                      Scanned Card
                    </Text>
                    <AnimatedImage
                      source={{ uri: cardImage as string }}
                      style={{
                        width: 260,
                        height: 160,
                        borderRadius: 12,
                        resizeMode: "contain",
                      }}
                    />
                  </View>
                ) : (
                  <Text className="text-blue-900 font-nunito">Back Side</Text>
                )}
              </View>
            </Animated.View>
          </View>
        </Pressable>

        {/* Buttons */}
        <View className="flex-row justify-around mt-6 px-6">
          <TouchableOpacity
            className="items-center"
            onPress={handleSaveToDevice}
          >
            <FontAwesome name="phone" size={20} color="#203c8b" />
            <Text className="text-[#203c8b] mt-1 font-nunito">
              Save to Phone
            </Text>
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
                  additionalPhones: parsedAdditionalPhones.join(","),
                  _id: String(_id),
                  cardImage: String(cardImage || ""),
                },
              })
            }
          >
            <MaterialIcons name="edit" size={20} color="#203c8b" />
            <Text className="text-[#203c8b] mt-1 font-nunito">Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View className="bg-blue-100 mt-6 mx-4 p-4 rounded-xl shadow">
          <Text className="text-xs text-center text-blue-900 mb-4">
            Card saved at:{" "}
            {createdAt
              ? new Date(createdAt as string).toLocaleString()
              : "N/A"}
          </Text>

          <InfoRow
            label="Email"
            value={email as string}
            icon={<MaterialIcons name="email" size={20} color="#203c8b" />}
          />
          <InfoRow
            label="Company"
            value={company as string}
            icon={<FontAwesome name="building" size={20} color="#203c8b" />}
          />
          <InfoRow
            label="Website"
            value={website as string}
            icon={<FontAwesome name="globe" size={20} color="#203c8b" />}
          />
          <InfoRow
            label="Notes"
            value={notes as string}
            icon={<MaterialIcons name="sticky-note-2" size={20} color="#203c8b" />}
          />

          {/* ✅ Additional Phones Section */}
{parsedAdditionalPhones.length > 0 ? (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    }}
  >
    {/* Left side → label + list of numbers */}
    <View>
      <Text style={{ fontSize: 14, color: "#666" }}>Additional Phones</Text>
      {parsedAdditionalPhones.map((rawPhone, index) => {
        let phone = rawPhone;

        try {
          while (
            typeof phone === "string" &&
            (phone.trim().startsWith("[") || phone.trim().startsWith('"'))
          ) {
            const parsed = JSON.parse(phone);
            if (Array.isArray(parsed)) {
              phone = parsed[0];
            } else {
              phone = parsed;
            }
          }
        } catch {
          // fallback: leave as-is
        }

        return (
          <Text
            key={index}
            style={{ fontSize: 16, color: "#333", marginTop: 2 }}
          >
            {String(phone).replace(/["\[\]\\]/g, "")}
          </Text>
        );
      })}
    </View>

    {/* Right side → one phone icon */}
    <FontAwesome name="phone" size={20} color="#1E3A8A" />
  </View>
) : (
  <Text style={{ fontSize: 16, color: "#999" }}>No additional phones</Text>
)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#BFDBFE", // blue-100
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    shadowColor: "#ffffffff",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    minHeight: 180,
  },
});
