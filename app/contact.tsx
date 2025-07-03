import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { router, usePathname } from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

// ✅ Contact type
type Contact = {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
  website?: string;
  notes?: string;
  isFavorite: boolean;
  createdAt?: string;
};

export default function Contacts() {
  const pathname = usePathname();
  
    const isActive = (route: string) => pathname === route;
  const navigation = useNavigation();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleMenuId, setVisibleMenuId] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  useEffect(() => {
    const fetchContacts = async () => {
      const token = await SecureStore.getItemAsync("userToken");
      try {
        const res = await fetch("https://cardlink.onrender.com/api/contacts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setContacts(data);
        else console.error("Fetch error:", data.message);
      } catch (err) {
        console.error("Error loading contacts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const confirmDelete = (contactId: string) => {
    Alert.alert("Delete Contact", "Are you sure you want to delete this contact?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => handleDelete(contactId),
      },
    ]);
  };

  const handleDelete = async (contactId: string) => {
    const token = await SecureStore.getItemAsync("userToken");
    try {
      const res = await fetch(`https://cardlink.onrender.com/api/contacts/${contactId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c._id !== contactId));
        Alert.alert("Deleted", "Contact successfully deleted.");
      } else {
        console.error("Delete failed");
        Alert.alert("Error", "Failed to delete contact.");
      }
    } catch (err) {
      console.error("Error deleting contact:", err);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-blue-900 px-4 py-6 flex-row justify-between items-center">
        <Text className="text-white text-2xl font-nunito">Contacts</Text>
        <FontAwesome name="filter" size={24} color="white" />
      </View>

      <ScrollView className="px-4 mt-4 mb-24">
        {loading ? (
          <ActivityIndicator size="large" color="blue" />
        ) : contacts.length === 0 ? (
          <Text className="text-center text-gray-600 font-nunito">
            No contacts found.
          </Text>
        ) : (
          contacts.map((c) => (
  <TouchableOpacity
    key={c._id}
    onPress={() =>
      router.push({
        pathname: "/contact-detail",
        params: {
          _id: c._id,
          firstName: c.firstName,
          lastName: c.lastName,
          phone: c.phone,
          email: c.email,
          company: c.company,
          website: c.website || "",
          notes: c.notes || "",
          createdAt: c.createdAt || "",
          isFavorite: String(c.isFavorite),
        },
      })
    }
  >
    <View className="bg-white rounded-2xl px-4 py-4 mb-4 shadow-lg border border-blue-100">
      <View className="flex-row justify-between items-start">
        {/* Avatar & Name */}
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-blue-200 rounded-full justify-center items-center">
            <Text className="text-white font-bold text-sm">
              {c.firstName[0]}
              {c.lastName[0]}
            </Text>
          </View>
          <View className="ml-3">
            <Text className="text-xl font-bold text-blue-900 font-nunito">
              {c.firstName} {c.lastName}
            </Text>
            <Text className="text-xs text-gray-500">{c.company}</Text>
          </View>
        </View>

        {/* 3-dot Menu */}
        <View className="relative">
          <TouchableOpacity
            onPress={() =>
              setVisibleMenuId(visibleMenuId === c._id ? null : c._id)
            }
          >
            <MaterialIcons name="more-vert" size={20} color="#444" />
          </TouchableOpacity>

          {visibleMenuId === c._id && (
            <View className="absolute right-0 mt-2 bg-white rounded shadow p-2 z-10 w-36">
              <TouchableOpacity
                onPress={() => {
                  setVisibleMenuId(null);
                  confirmDelete(c._id);
                }}
              >
                <Text className="text-red-600 font-nunito text-sm">
                  Delete Contact
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Contact Info */}
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
))

        )}
      </ScrollView>

      <View className="absolute bottom-20 left-0 right-0 items-center">
        <TouchableOpacity
          onPress={() => router.push("/add-contact")}
          className="bg-blue-900 rounded-full px-10 py-4 flex-row items-center"
        >
          <FontAwesome name="plus" size={18} color="white" />
          <Text className="text-white text-base ml-2 font-nunito">Add</Text>
        </TouchableOpacity>
      </View>

      <View className="absolute bottom-5 left-0 right-0 bg-white py-3 flex-row justify-around border-t border-gray-200 ">
       <TouchableOpacity onPress={() => router.replace('/home')}>
        <FontAwesome name="home" size={24} color={isActive('/home') ? '#1996fc' : '#11224E'} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/contact')}>
        <FontAwesome name="id-card" size={24} color={isActive('/contact') ? '#1996fc' : '#11224E'} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/calendar')}>
        <FontAwesome name="calendar" size={24} color={isActive('/calendar') ? '#1996fc' : '#11224E'} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/profile')}>
        <FontAwesome name="user" size={24} color={isActive('/profile') ? '#1996fc' : '#11224E'} />
      </TouchableOpacity>
    </View>
    </SafeAreaView>
  );
}
