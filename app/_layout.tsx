import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import './globals.css'; // Tailwind styles

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito: require('../assets/fonts/Nunito-Regular.ttf'),
    // You can add other font weights too
  });

  if (!fontsLoaded) {
    return null; // Optional: Add a loader here
  }

  return (
    <Stack
      screenOptions={{
        animation: 'none', // 👈 Disable sliding transition globally
      }}
    />
  );
}
