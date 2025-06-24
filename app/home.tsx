import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';
 
export default function HomeScreen() {
  // Open camera
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
 
  // Open gallery
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
    <View className="flex-1 bg-white">
      {/* Top Bar */}
      <View className="bg-[#11224E] w-full h-[82px] flex-row items-center px-4 space-x-3">
        <Image
          source={require('../assets/images/logo.png')}
          className="w-[41px] h-[40px] rounded"
        />
        <Text className="text-white font-normal text-[30px] leading-[50px]">CardLink</Text>
      </View>
 
      {/* Astronaut Section */}
      <View className="bg-[#CFE4FF] items-center p-4 flex-1">
        <View className="w-[200px] h-[200px] relative z-0">
          {/* Planet */}
          <View className="absolute top-[25px] left-[55px] w-[90px] h-[90px] bg-[#ff9933] rounded-full">
            <View className="absolute top-[25px] left-[20px] w-[50px] h-[10px] bg-[#ffbf80] rounded-full" />
            <View className="absolute top-[40px] left-[30px] w-[45px] h-[8px] bg-[#ffbf80] rounded-full" />
            <View className="absolute top-[38px] left-[10px] w-[55px] h-[15px] bg-[#ffbf80] rounded-full" />
            <View className="absolute top-[34px] left-[2px] w-[45px] h-[11px] bg-[#ffbf80] rounded-full" />
            <View className="absolute bottom-[15px] left-[25px] w-[20px] h-[8px] bg-[#cc66004d] rounded-full" />
            <View className="absolute bottom-[8px] left-[5px] w-[30px] h-[10px] bg-[#cc66004d] rounded-full" />
            <View className="absolute top-[18px] left-[60px] w-[25px] h-[10px] bg-[#cc66004d] rounded-full" />
            <View className="absolute top-[3px] left-[10px] w-[15px] h-[6px] bg-white/40 rounded-full" />
          </View>
 
          {/* Stars */}
          <View className="absolute bg-white w-1.5 h-1.5 rounded-full left-[90px] bottom-[100px]" />
          <View className="absolute bg-white w-1.5 h-1.5 rounded-full left-[125px] top-[35px]" />
          <View className="absolute bg-white w-1.5 h-1.5 rounded-full left-[20px] bottom-[60px]" />
 
          {/* Static Astronaut */}
          <View className="absolute bottom-[20px] left-[40px] z-0">
            <View className="w-[60px] h-[60px] bg-white rounded-full ml-[10px]" />
          </View>
        </View>
 
        {/* Buttons */}
        <View className="flex-row justify-center mt-6 px-4 space-x-4" style={{ zIndex: 1 }}>
          {/* Scan Button */}
          <TouchableOpacity
            onPress={openCamera}
            className="w-[161px] h-[51px] bg-[#182C6B] rounded-lg flex-row items-center justify-center space-x-2"
          >
            <Image source={require('../assets/images/Scan.png')} className="w-[30px] h-[30px]" />
            <Text
              className="text-white font-light text-[16px]"
              style={{ fontFamily: 'Nunito_300Light' }}
            >
              Scan
            </Text>
          </TouchableOpacity>
 
          {/* Gallery Button */}
          <TouchableOpacity
            onPress={openGallery}
            className="w-[161px] h-[51px] bg-[#182C6B] rounded-lg flex-row items-center justify-center space-x-2"
          >
            <Image
              source={require('../assets/images/gallery.png')}
              className="w-[30px] h-[30px]"
            />
            <Text
              className="text-white font-light text-[16px]"
              style={{ fontFamily: 'Nunito_300Light' }}
            >
              Browse gallery
            </Text>
          </TouchableOpacity>
        </View>
      </View>
 
      {/* Bottom Navigation */}
            <View className="absolute bottom-0 left-0 right-0 bg-white py-3 flex-row justify-around border-t border-gray-200">
        <TouchableOpacity onPress={() => router.replace('/home')}>
          <FontAwesome name="home" size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/menu')}>
          <FontAwesome name="bars" size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/scan')}>
          <FontAwesome name="id-card" size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/calendar')}>
          <FontAwesome name="calendar" size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/profile')}>
          <FontAwesome name="user" size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
 
 