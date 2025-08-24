import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./globals.css"; // Tailwind styles
 
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito: require("../assets/fonts/Nunito-Regular.ttf"),
    // You can add other font weights too if needed
  });
 
  if (!fontsLoaded) {
    return null; // Optional: Add a loader here
  }
 
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            animation: "none", // 👈 Disable sliding transition globally
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}