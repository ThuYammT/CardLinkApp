import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { router, usePathname } from "expo-router";
import { useLayoutEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
 
 
export default function Appointment() {
  const pathname = usePathname();
  
    const isActive = (route: string) => pathname === route;
  const navigation = useNavigation();
 
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);
 
  const appointments = [
    {
      name: "Hong Eunchae",
      topic: "Vocal Course",
      date: "13 January, 2025",
      time: "From 2:31 To 3:59",
      notes: "Please put more focus",
      type: "Online Meeting",
      isFavorite: true,
    },
    {
      name: "Jang Wonyoung",
      topic: "Eating Strawberry",
      date: "13 January, 2025",
      time: "From 2:31 To 3:59",
      notes: "Please put more focus",
      type: "Offline Meeting",
      isFavorite: false,
    },
  ];
 
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Bar */}
      <View className="bg-blue-900 px-4 py-8 flex-row items-center">
        <Text className="text-white text-2xl font-nunito">Appointment</Text>
        <FontAwesome name="filter" size={22} color="white" />
      </View>
 
      {/* Appointment Cards */}
      <ScrollView className="px-4 mt-4 mb-24">
        {appointments.map((item, index) => (
          <View key={index} className="bg-blue-100 rounded-2xl p-4 mb-4 shadow-md">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center">
                <FontAwesome name="user" size={20} />
                <Text className="ml-2 font-nunito text-base">{item.name}</Text>
              </View>
              <FontAwesome
                name={item.isFavorite ? "star" : "star-o"}
                size={20}
                color={item.isFavorite ? "gold" : "black"}
              />
            </View>
 
            <View className="flex-row items-center mb-1">
              <MaterialIcons name="title" size={16} />
              <Text className="ml-2 font-nunito text-sm">{item.topic}</Text>
            </View>
 
            <View className="flex-row items-center mb-1">
              <FontAwesome name="calendar" size={16} />
              <Text className="ml-2 font-nunito text-sm">{item.date}</Text>
            </View>
 
            <View className="flex-row items-center mb-1">
              <FontAwesome name="clock-o" size={16} />
              <Text className="ml-2 font-nunito text-sm">{item.time}</Text>
            </View>
 
            <View className="flex-row items-center mb-1">
              <MaterialIcons name="notes" size={16} />
              <Text className="ml-2 font-nunito text-sm">{item.notes}</Text>
            </View>
 
            <View className="flex-row items-center">
              <MaterialIcons name="meeting-room" size={16} />
              <Text className="ml-2 font-nunito text-sm">{item.type}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
 
      {/* Add Appointment Button */}
      <View className="absolute bottom-20 left-0 right-0 items-center">
        <TouchableOpacity className="bg-[#11224E] rounded-full px-10 py-4 flex-row items-center">
          <FontAwesome name="plus" size={18} color="white" />
          <Text className="text-white text-base ml-2 font-nunito">Appoint</Text>
        </TouchableOpacity>
      </View>
 
      {/* Bottom Nav */}
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