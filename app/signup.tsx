import { Link, router } from 'expo-router';
import { Image, Pressable, Text, TextInput, View, Alert } from 'react-native';
import { useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !confirm) {
      return Alert.alert('Error', 'Please fill in all fields');
    }

    if (password !== confirm) {
      return Alert.alert('Error', 'Passwords do not match');
    }

    try {
      setLoading(true);
      const res = await fetch('https://cardlink.onrender.com/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.token) {
        // ✅ Save the token after successful signup
        await SecureStore.setItemAsync("userToken", data.token);
        Alert.alert("Success", "Account created!");
        router.replace('/home');
      } else {
        Alert.alert("Signup Failed", data.message || 'An error occurred');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Network Error", "Could not connect to server");
    }
  };

  return (
    <View className="flex-1 items-center justify-center">
      <Image source={require('../assets/background.png')} className="absolute w-full h-full" />
      <Image source={require('../assets/logo.png')} className="w-36 h-36 mb-6" />

      <View className="w-4/5">
        <TextInput
          placeholder="Enter your email"
          placeholderTextColor="#888"
          className="bg-white rounded px-4 py-3 mb-3 font-nunito"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Enter your password"
          placeholderTextColor="#888"
          secureTextEntry
          className="bg-white rounded px-4 py-3 mb-3 font-nunito"
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          placeholder="Re-enter your password"
          placeholderTextColor="#888"
          secureTextEntry
          className="bg-white rounded px-4 py-3 mb-4 font-nunito"
          value={confirm}
          onChangeText={setConfirm}
        />
        <Pressable onPress={handleSignup} className="bg-button rounded py-3">
          <Text className="text-center text-black font-bold font-nunito">
            {loading ? 'Creating...' : 'Create account'}
          </Text>
        </Pressable>
      </View>

      <Text className="text-white mt-6 font-nunito">WELCOME</Text>
      <Link href="/login" className="text-white underline text-sm font-nunito">Login</Link>
    </View>
  );
}
