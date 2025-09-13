// app/layout.tsx
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text, View, ActivityIndicator } from "react-native";
import "./globals.css"; // Tailwind styles

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito: require("../assets/fonts/Nunito-Regular.ttf"),
    // Add more weights if you need them
    // NunitoBold: require("../assets/fonts/Nunito-Bold.ttf"),
  });

  if (!fontsLoaded) {
    // ✅ Show a loader instead of a blank screen
    return (
      <GestureHandlerRootView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View style={{ alignItems: "center" }}>
          <ActivityIndicator size="large" color="#213BBB" />
          <Text style={{ marginTop: 12, fontSize: 16 }}>Loading...</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            animation: "none", // disable sliding transition globally
            headerTitleStyle: {
              fontFamily: "Nunito", // apply your custom font
            },
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
