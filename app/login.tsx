import { Link, router } from 'expo-router';
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Animations
  const logoScale = useRef(new Animated.Value(0)).current;
  const formScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.elastic(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(formScale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.elastic(1.2)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch('https://cardlink.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log('Token:', data.token);

        // ✅ Save token securely
        await SecureStore.setItemAsync('userToken', data.token);

        Alert.alert('Login Success', "You're now logged in!");
        router.replace('/home');
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server');
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Image source={require('../assets/background.png')} className="absolute w-full h-full" />

      <Animated.View style={{ transform: [{ scale: logoScale }] }} className="items-center mb-10">
        <Image source={require('../assets/logo.png')} className="w-36 h-36 mb-4" />
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: formScale }] }} className="w-4/5">
        <TextInput
          placeholder="Email"
          placeholderTextColor="#888"
          className="bg-white rounded px-4 py-3 mb-4 font-nunito"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          className="bg-white rounded px-4 py-3 mb-2 font-nunito"
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity className="bg-button rounded py-3 mb-2" onPress={handleLogin}>
          <Text className="text-center text-black font-bold font-nunito">LOGIN</Text>
        </TouchableOpacity>
        <Text className="text-right text-xs mb-6 text-white">Forgot your Password?</Text>
      </Animated.View>

      <Text className="text-white mb-2 font-nunito">WELCOME</Text>
      <Link href="/signup" className="text-white underline text-sm font-nunito">
        Sign up
      </Link>
    </View>
  );
}
