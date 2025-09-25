// app/_layout.tsx
import "react-native-gesture-handler"; // 👈 MUST be first
import "react-native-reanimated"; // 👈 then Reanimated

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Image,
  StatusBar,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./globals.css"; // Tailwind / NativeWind CSS

const BRAND_BLUE = "#213BBB";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito: require("../assets/fonts/Nunito-Regular.ttf"),
    // NunitoBold: require("../assets/fonts/Nunito-Bold.ttf"),
  });

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

        {/* Loader (blocking until fonts load) */}
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