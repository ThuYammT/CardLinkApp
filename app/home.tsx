import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useNavigation,usePathname } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const pathname = usePathname();

  const isActive = (route: string) => pathname === route;
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  const steam1 = useRef(new Animated.Value(0)).current;
  const steam2 = useRef(new Animated.Value(0)).current;
  const steam3 = useRef(new Animated.Value(0)).current;
  const steam4 = useRef(new Animated.Value(0)).current;

  type Contact = {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    company: string;
  };

  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);

  useEffect(() => {
    animateSteam(steam1, 0);
    animateSteam(steam2, 500);
    animateSteam(steam3, 1000);
    animateSteam(steam4, 1500);
    fetchRecentContacts();
  }, []);

  const animateSteam = (steam: Animated.Value | Animated.ValueXY, delay: number) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(steam, {
          toValue: 1,
          duration: 4000,
          delay,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(steam, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const steamAnimationStyle = (animatedValue: Animated.Value, xDirection: number) => ({
    opacity: animatedValue,
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -100],
        }),
      },
      {
        translateX: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, xDirection],
        }),
      },
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.25, 1],
        }),
      },
    ],
  });

  const fetchRecentContacts = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const res = await fetch('https://cardlink.onrender.com/api/contacts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setRecentContacts(data.slice(0, 4));
      } else {
        console.error('Invalid data format:', data);
      }
    } catch (error) {
      console.error('Failed to fetch recent contacts:', error);
    }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera access is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      console.log('Camera image URI:', result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      console.log('Gallery image URI:', result.assets[0].uri);
    }
  };



  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Bar (same as contact style) */}
      <View className="bg-blue-900 px-4 py-6 flex-row justify-between items-center">
        <Text className="text-white text-2xl font-nunito">CardLink</Text>
        <FontAwesome name="filter" size={24} color="white" />
      </View>

      {/* Animated Cup Section */}
      <View className="bg-[#CFE4FF] items-center py-6">
        <View className="relative w-[250px] h-[150px] items-center justify-end">
          {[steam1, steam2, steam3, steam4].map((steam, index) => (
            <Animated.View
              key={index}
              className="absolute w-[100px] h-[100px] rounded-full bg-white"
              style={[
                { marginTop: -50, marginLeft: 50 },
                steamAnimationStyle(steam, index % 2 === 0 ? -15 : 15),
              ]}
            />
          ))}
          <View className="w-[250px] h-[120px] bg-white rounded-b-[150px] overflow-hidden z-10" />
          <View className="absolute h-[200px] w-[130px] bg-[#F3F3F3] top-0 left-[50px] rotate-[50deg] z-10" />
          <View className="absolute h-[60px] w-[60px] border-[10px] border-[#F3F3F3] rounded-r-[150px] left-[200px] bottom-[70px] z-0" />
          <View className="absolute h-[20px] w-[250px] bg-[#F9F9F9] bottom-0 rounded-b-[100px] z-20" />
          <View className="absolute h-[8px] w-[250px] bg-[#7bb8d4] bottom-[-4px] rounded-full z-0" />
        </View>

        {/* Buttons */}
        <View className="flex-row justify-center mt-6 space-x-4">
          <TouchableOpacity
            onPress={openCamera}
            className="w-[150px] h-[50px] bg-[#182C6B] rounded-full flex-row items-center justify-center space-x-2"
          >
            <FontAwesome name="qrcode" size={18} color="white" />
            <Text className="text-white text-[16px]">Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openGallery}
            className="w-[150px] h-[50px] bg-[#182C6B] rounded-full flex-row items-center justify-center space-x-2"
          >
            <FontAwesome name="image" size={18} color="white" />
            <Text className="text-white text-[16px]">Browse gallery</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Section */}
      <View className="px-4 py-3 flex-row justify-between items-center">
        <Text className="text-lg font-semibold text-gray-700">Recent</Text>
        <TouchableOpacity onPress={() => router.push('/contact')}>
          <Text className="text-blue-900 font-medium">View All</Text>
        </TouchableOpacity>
      </View>
      {/* ouk ka phyu phyu gye */}
      <ScrollView className="px-4 mb-0"> 
  {recentContacts.map((c) => (
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
            website: "", // if needed
            notes: "",    // if needed
            createdAt: "", // optional if not available
            isFavorite: "false", // default if not used here
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
  ))}
</ScrollView>

 
      {/* Bottom Navigation */}
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
