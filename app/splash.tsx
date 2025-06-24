import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View, Image } from 'react-native';
import { router } from 'expo-router';

export default function SplashScreen() {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate both logo and text with a pop-up scale effect
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.elastic(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(textScale, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.elastic(1.2)),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => router.replace('/login'), 1200);
    });
  }, []);

  return (
    <View className="flex-1 justify-center items-center bg-white px-8">
      <Animated.Image
        source={require('../assets/logo.png')}
        style={{
          width: 150,
          height: 150,
          transform: [{ scale: scaleAnim }],
        }}
        resizeMode="contain"
      />

      <Animated.Text
        className="text-center text-lg font-nunito mt-8 text-brand"
        style={{
          transform: [{ scale: textScale }],
        }}
      >
        Could describe every business card in one single app.
      </Animated.Text>
    </View>
  );
}
