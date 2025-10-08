// app/_layout.tsx
import "react-native-gesture-handler";
import "react-native-reanimated";

import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";
import * as Linking from "expo-linking";
import {
  ActivityIndicator,
  Image,
  StatusBar,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./globals.css";

const BRAND_BLUE = "#213BBB";

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Nunito: require("../assets/fonts/Nunito-Regular.ttf"),
  });

  // ✅ Handle incoming deep links
  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      console.log("🔗 Deep link received:", url);
      const parsed = Linking.parse(url);
      const path = parsed.path;
      const token = parsed.queryParams?.token;

      if (path === "reset-password" && token) {
        router.push(`/reset-password?token=${token}`);
      }
    };

    // Subscribe to link events while app is open
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // ✅ Fix: Prevent app from reopening directly to reset-password on cold start
    Linking.getInitialURL().then((url) => {
      if (url) {
        if (url.includes("reset-password")) {
          console.log("🧹 Clearing cached deep link...");
          router.replace("/auth"); // or "/home" if already logged in
        } else {
          handleDeepLink({ url });
        }
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <Stack
          screenOptions={{
            animation: "none",
            headerShown: false,
            headerTitleStyle: { fontFamily: "Nunito" },
          }}
        />

        {/* Loader while fonts load */}
        {!fontsLoaded && (
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              backgroundColor: "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 24,
            }}
          >
            <Image
              source={require("../assets/images/icon.png")}
              style={{
                width: 72,
                height: 72,
                marginBottom: 16,
                borderRadius: 12,
              }}
              resizeMode="contain"
            />
            <ActivityIndicator size="large" color={BRAND_BLUE} />
            <Text style={{ marginTop: 12, fontSize: 16 }}>Loading…</Text>
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
