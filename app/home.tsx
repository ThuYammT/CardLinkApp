// app/home.tsx
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useNavigation, usePathname, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import LottieView from 'lottie-react-native';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Contact = {
  cardImage: string;
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
  website?: string;
  notes?: string;
  isFavorite: boolean;
  nickname?: string;
  position?: string;
  additionalPhones?: string[];
  createdAt?: string;
};

const BRAND_BLUE = '#213BBB';
const LIGHT_PANEL = '#CFE4FF';

// Bottom bar colors (dark rail + purple pill like screenshot)
const NAV_BG = '#161824';
const NAV_PILL = '#9E7BFF';
const ICON_INACTIVE = '#C9CCDA';
const ICON_ACTIVE = '#FFFFFF';
const LABEL_ACTIVE = '#FFFFFF';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const lottieRef = useRef<LottieView>(null);
  const cardStyle = {
  backgroundColor: "white",
  borderRadius: 16,
  paddingVertical: 16,
  paddingHorizontal: 12,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: "#bfdbfe", // border-blue-100
  // iOS shadow
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 4 },
  // Android shadow
  elevation: 3,
};


  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  useEffect(() => {
    fetchRecentContacts();
  }, []);

  const fetchRecentContacts = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res = await fetch('https://cardlink.onrender.com/api/contacts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setRecentContacts(data.slice(0, 4));
    } catch (e) {
      console.error('Failed to fetch recent contacts:', e);
    }
  };

  const openCamera = () => {
  setSheetOpen(false);
  router.push("/scan");
};


  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) {
      console.log('Gallery image URI:', result.assets[0].uri);
      setSheetOpen(false);
      // TODO: route to /add-contact with URI if desired
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Bar */}
      <View
        style={{ backgroundColor: BRAND_BLUE }}
        className="px-4 py-6 flex-row justify-between items-center"
      >
        <Text className="text-white text-2xl font-nunito">CardLink</Text>
        <FontAwesome name="filter" size={24} color="white" />
      </View>

      {/* Light blue header panel with animation */}
      <View
        style={{ backgroundColor: LIGHT_PANEL }}
        className="items-center py-8"
      >
        <LottieView
          ref={lottieRef}
          source={require('../assets/animations/NFC_Card_Read.json')}
          autoPlay
          loop
          style={{ width: 240, height: 160 }}
        />

        {/* Single primary action button */}
        <TouchableOpacity
          onPress={() => setSheetOpen(true)}
          activeOpacity={0.9}
          style={{
            backgroundColor: BRAND_BLUE,
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 18,
            marginTop: 12,
            elevation: 2,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
          }}
          className="flex-row items-center"
        >
          <FontAwesome name="id-card" size={18} color="#fff" />
          <Text className="text-white text-[16px] font-semibold ml-2">
            Add Business Card
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent header */}
      <View className="px-4 py-3 flex-row justify-between items-center">
        <Text className="text-lg font-semibold text-gray-700">Recent</Text>
        <TouchableOpacity onPress={() => router.push('/contact')}>
          <Text style={{ color: BRAND_BLUE }} className="font-medium">
            View All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent list */}
      <ScrollView className="px-4 mb-24">
        {recentContacts.map((c) => (
          <TouchableOpacity
            key={c._id}
            onPress={() =>
              router.push({
                pathname: '/contact-detail',
                params: {
                      _id: c._id,
                      firstName: c.firstName,
                      lastName: c.lastName,
                      phone: c.phone,
                      email: c.email,
                      company: c.company,
                      website: c.website || "",
                      notes: c.notes || "",
                      nickname: c.nickname || "",
                      position: c.position || "",
                      additionalPhones: JSON.stringify(c.additionalPhones || []),
                      createdAt: c.createdAt || "",
                      cardImage: c.cardImage || "",
                      isFavorite: String(c.isFavorite),
                    },
              })
            }
          >
            <View style={cardStyle}>
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-blue-200 rounded-full justify-center items-center">
                <Text className="text-white font-bold text-sm">
                  {c.firstName?.[0]}
                  {c.lastName?.[0]}
                </Text>
              </View>
              <View className="ml-3">
                <Text className="text-xl font-bold text-blue-900 font-nunito">
                  {c.firstName} {c.lastName}
                </Text>
                <Text className="text-xs text-gray-500">{c.company}</Text>
              </View>
            </View>

            <View className="mt-3 space-y-1">
              <View className="flex-row items-center">
                <FontAwesome name="phone" size={14} color="#1996fc" />
                <Text className="ml-2 text-sm text-gray-800">{c.phone}</Text>
              </View>
              <View className="flex-row items-center">
                <MaterialIcons name="email" size={14} color="#1996fc" />
                <Text className="ml-2 text-sm text-gray-800">{c.email}</Text>
              </View>
              <View className="flex-row items-center">
                <FontAwesome name="briefcase" size={14} color="#1996fc" />
                <Text className="ml-2 text-sm text-gray-800">{c.company}</Text>
              </View>
            </View>
          </View>

          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Sheet (simple modal) */}
      <Modal
        transparent
        visible={sheetOpen}
        animationType="fade"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }}
          onPress={() => setSheetOpen(false)}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <View
              style={{
                backgroundColor: '#fff',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                paddingHorizontal: 16,
                paddingTop: 8,
                paddingBottom: 24,
              }}
            >
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <View
                  style={{
                    width: 40,
                    height: 4,
                    backgroundColor: '#e5e7eb',
                    borderRadius: 999,
                  }}
                />
              </View>

              <Pressable
                onPress={openCamera}
                style={{
                  borderWidth: 1,
                  borderColor: '#eee',
                  borderRadius: 10,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FontAwesome name="camera" size={16} color="#111" />
                <Text style={{ marginLeft: 8, fontSize: 15 }}>
                  Scan with Camera
                </Text>
              </Pressable>

              <Pressable
                onPress={openGallery}
                style={{
                  borderWidth: 1,
                  borderColor: '#eee',
                  borderRadius: 10,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FontAwesome name="image" size={16} color="#111" />
                <Text style={{ marginLeft: 8, fontSize: 15 }}>
                  Import from Gallery
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Bottom pill navigation */}
      <BottomNav />
    </SafeAreaView>
  );
}

/* ---------- BottomNav ---------- */
function BottomNav({ hidden }: { hidden?: boolean }) {
  if (hidden) return null;

  const pathname = usePathname();
  const router = useRouter();

  const active: "home" | "contacts" | "calendar" | "profile" =
    pathname.startsWith("/profile")
      ? "profile"
      : pathname.startsWith("/calendar")
      ? "calendar"
      : pathname.startsWith("/contact")
      ? "contacts"
      : "home";

  const Item = ({
    isActive,
    onPress,
    icon,
  }: {
    isActive?: boolean;
    onPress: () => void;
    icon: React.ComponentProps<typeof FontAwesome>["name"];
  }) =>
    isActive ? (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: "rgba(255,255,255,0.85)",
        }}
      >
        <FontAwesome name={icon} size={20} color={BRAND_BLUE} />
      </TouchableOpacity>
    ) : (
      <TouchableOpacity
        onPress={onPress}
        style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FontAwesome name={icon} size={20} color="#FFFFFF" />
      </TouchableOpacity>
    );

  return (
    <View
      style={{
        position: "absolute",
        left: 20,
        right: 20,
        bottom: 24,
        alignItems: "center",
      }}
      pointerEvents="box-none"
    >
      <View
        style={{
          backgroundColor: BRAND_BLUE,
          borderRadius: 999,
          paddingVertical: 12,
          paddingHorizontal: 18,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        }}
      >
        <Item icon="home" isActive={active === "home"} onPress={() => router.replace("/home")} />
        <Item
          icon="address-book-o"
          isActive={active === "contacts"}
          onPress={() => router.replace("/contact")}
        />
        <Item
          icon="calendar-o"
          isActive={active === "calendar"}
          onPress={() => router.replace("/calendar")}
        />
        <Item
          icon="user-o"
          isActive={active === "profile"}
          onPress={() => router.replace("/profile")}
        />
      </View>
    </View>
  );
}
