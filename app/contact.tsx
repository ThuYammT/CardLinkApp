import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { useLayoutEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
 
export default function Contacts() {
  const navigation = useNavigation();
 
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);
 
  const contacts = [
    {
      name: "Hong Eunchae",
      phone: "000 000 000",
      email: "vocalqueen@gmail.com",
      company: "KQ Entertainment",
      isFavorite: true,
    },
    {
      name: "Jang Wonyoung",
      phone: "000 000 000",
      email: "foreveryoung@gmail.com",
      company: "Starship Company",
      isFavorite: true,
    },
    {
      name: "Miyawaki Sakura",
      phone: "000 000 000",
      email: "yumenokissme@gmail.com",
      company: "Sony Records Label",
      isFavorite: false,
    },
  ];
 
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-blue-900 px-4 py-6 flex-row justify-between items-center">
        <Text className="text-white text-2xl font-nunito">Contacts</Text>
        <FontAwesome name="filter" size={24} color="white" />
      </View>
 
      {/* Contact List */}
      <ScrollView className="px-4 mt-4 mb-24">
        {contacts.map((c, i) => (
          <View
            key={i}
            className="bg-blue-100 rounded-2xl p-4 mb-4 shadow-md"
          >
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center">
                <FontAwesome name="user" size={20} />
                <Text className="ml-2 font-nunito text-base">{c.name}</Text>
              </View>
              <FontAwesome
                name={c.isFavorite ? "star" : "star-o"}
                size={20}
                color={c.isFavorite ? "gold" : "black"}
              />
            </View>
 
            <View className="flex-row items-center mb-1">
              <FontAwesome name="phone" size={16} />
              <Text className="ml-2 font-nunito text-sm">{c.phone}</Text>
            </View>
 
            <View className="flex-row items-center mb-1">
              <MaterialIcons name="email" size={16} />
              <Text className="ml-2 font-nunito text-sm">{c.email}</Text>
            </View>
 
            <View className="flex-row items-center">
              <FontAwesome name="briefcase" size={16} />
              <Text className="ml-2 font-nunito text-sm">{c.company}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
 
      {/* Add Button */}
      <View className="absolute bottom-20 left-0 right-0 items-center">
        <TouchableOpacity className="bg-blue-900 rounded-full px-10 py-4 flex-row items-center">
          <FontAwesome name="plus" size={18} color="white" />
          <Text className="text-white text-base ml-2 font-nunito">Add</Text>
        </TouchableOpacity>
      </View>
 
      {/* Bottom Nav Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white py-3 flex-row justify-around border-t border-gray-200">
              <TouchableOpacity onPress={() => router.replace('/home')}>
                <FontAwesome name="home" size={24} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.replace('/contact')}>
                <FontAwesome name="id-card" size={24} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.replace('/calendar')}>
                <FontAwesome name="calendar" size={24} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.replace('/profile')}>
                <FontAwesome name="user" size={24} />
              </TouchableOpacity>
            </View>
    </SafeAreaView>
  );
}
 
 