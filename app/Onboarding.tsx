import { router } from 'expo-router';
import { Image, ImageBackground, Text, TouchableOpacity, View } from 'react-native';

export default function SplashScreen() {
  return (
    <ImageBackground
      source={require('../assets/images/j.jpg')} // replace with your actual background path
      className="flex-1 justify-end items-center"
      resizeMode="cover"
    >
      <View className="bg-white p-6 rounded-2xl items-center shadow-md mb-12 w-[90%]">
        <Image
          source={require('../assets/images/icon.png')} // replace with your actual logo path
          className="w-[100px] h-[100px]"
          resizeMode="contain"
        />

        <Text className="text-2xl font-bold text-[#182C6B] text-center mt-4">
          Welcome to CardLink
        </Text>

        <Text className="text-base text-gray-600 text-center mt-2">
          All your business cards in one place
        </Text>

        <TouchableOpacity
          onPress={() => router.replace('/auth')}
          className="mt-8 bg-[#182C6B] px-8 py-3 rounded-full"
        >
          <Text className="text-white text-lg font-semibold">Get Started</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}
