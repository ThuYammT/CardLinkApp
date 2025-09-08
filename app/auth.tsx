import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import {
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !confirm)) {
      return Alert.alert('Error', 'Please fill in all fields');
    }

    if (!isLogin && password !== confirm) {
      return Alert.alert('Error', 'Passwords do not match');
    }

    try {
      setLoading(true);
      const url = isLogin
        ? 'https://cardlink.onrender.com/api/auth/login'
        : 'https://cardlink.onrender.com/api/auth/signup';

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.token) {
        await SecureStore.setItemAsync('userToken', data.token);
        Alert.alert('Success', isLogin ? 'Logged in!' : 'Account created!');
        router.replace('/home');
      } else {
        Alert.alert('Error', data.message || 'Something went wrong');
      }
    } catch (err) {
      setLoading(false);
      Alert.alert('Network Error', 'Failed to connect to server');
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 px-6 pt-24">
          <Image
            source={require('../assets/logo.png')}
            className="w-20 h-20 self-center mb-8"
            resizeMode="contain"
          />

          <View className="flex-row justify-center mb-6">
            <Pressable
              onPress={() => setIsLogin(true)}
              className={`px-4 py-2 rounded-full mr-2 ${
                isLogin ? 'bg-[#213BBB]' : 'bg-white border border-[#213BBB]'
              }`}
            >
              <Text
                className={`font-bold text-base ${
                  isLogin ? 'text-white' : 'text-[#213BBB]'
                }`}
              >
                Sign in
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setIsLogin(false)}
              className={`px-4 py-2 rounded-full ml-2 ${
                !isLogin ? 'bg-[#213BBB]' : 'bg-white border border-[#213BBB]'
              }`}
            >
              <Text
                className={`font-bold text-base ${
                  !isLogin ? 'text-white' : 'text-[#213BBB]'
                }`}
              >
                Sign up
              </Text>
            </Pressable>
          </View>

          <TextInput
            placeholder="Enter your email"
            placeholderTextColor="#888"
            className="bg-[#FAFAFA] px-4 py-3 rounded-lg mb-4 shadow-sm"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            placeholder="Enter your password"
            placeholderTextColor="#888"
            secureTextEntry
            className="bg-[#FAFAFA] px-4 py-3 rounded-lg mb-4 shadow-sm"
            value={password}
            onChangeText={setPassword}
          />

          {!isLogin && (
            <TextInput
              placeholder="Re-enter your password"
              placeholderTextColor="#888"
              secureTextEntry
              className="bg-[#FAFAFA] px-4 py-3 rounded-lg mb-4 shadow-sm"
              value={confirm}
              onChangeText={setConfirm}
            />
          )}

          {isLogin && (
            <Text className="text-right text-sm mb-4 text-gray-500">
              Forgot password?
            </Text>
          )}

          <Pressable
            className="bg-[#213BBB] rounded-lg py-3 shadow"
            onPress={handleAuth}
          >
            <Text className="text-white text-center text-base font-bold">
              {loading
                ? isLogin
                  ? 'Logging in...'
                  : 'Creating...'
                : isLogin
                ? 'Continue'
                : 'Create account'}
            </Text>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
