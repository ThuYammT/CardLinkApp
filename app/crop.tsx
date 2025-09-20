// app/crop.tsx
import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import * as ImageManipulator from "expo-image-manipulator";

// ===== Theme =====
const BRAND_BLUE = "#213BBB";
const BG_LIGHT = "#EAF3FF";
const BORDER = "rgba(33,59,187,0.12)";

const CLOUD_NAME = "dwmav1imw"; // ✅ your Cloudinary name
const UPLOAD_PRESET = "ml_default"; // ✅ your preset

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const PREVIEW_H = SCREEN_H * 0.68;
const FRAME_W = SCREEN_W * 0.9;
const FRAME_H = FRAME_W * 0.6;

export default function CropScreen() {
  const { imageUri } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const [processing, setProcessing] = useState(false);

  useLayoutEffect(() => {
    // @ts-ignore
    navigation.setOptions({ headerShown: false });
  }, []);

  // ===== Gestures =====
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pinch = Gesture.Pinch().onUpdate((e) => {
    scale.value = e.scale;
  });

  const pan = Gesture.Pan().onUpdate((e) => {
    translateX.value = e.translationX;
    translateY.value = e.translationY;
  });

  const combinedGesture = Gesture.Simultaneous(pinch, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  // ===== Upload helper (safe for Expo SDK 54+) =====
  const uploadToCloudinary = async (uri: string) => {
    const data = new FormData();
    data.append("file", {
      uri,
      type: "image/jpeg",
      name: "upload.jpg",
    } as any);
    data.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: data }
    );

    const json = await res.json();
    if (json.secure_url) return json.secure_url;
    throw new Error("Cloudinary upload failed: " + JSON.stringify(json));
  };

  // ===== Confirm crop =====
  const handleConfirm = async () => {
    if (!imageUri) return;
    try {
      setProcessing(true);

      // 1. Get original image info
      const info = await ImageManipulator.manipulateAsync(imageUri as string, []);
      const imgW = info.width;
      const imgH = info.height;

      // 2. Frame on screen
      const frameX = (SCREEN_W - FRAME_W) / 2;
      const frameY = (PREVIEW_H - FRAME_H) / 2;

      // 3. Convert frame → image pixels
      const scaleX = imgW / SCREEN_W;
      const scaleY = imgH / PREVIEW_H;

      const cropRegion = {
        originX: Math.max(0, frameX * scaleX - translateX.value * scaleX),
        originY: Math.max(0, frameY * scaleY - translateY.value * scaleY),
        width: Math.min(imgW, (FRAME_W * scaleX) / scale.value),
        height: Math.min(imgH, (FRAME_H * scaleY) / scale.value),
      };

      console.log("📐 Crop region:", cropRegion);

      // 4. Crop
      const cropped = await ImageManipulator.manipulateAsync(
        imageUri as string,
        [{ crop: cropRegion }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      // 5. Upload
      const cloudUrl = await uploadToCloudinary(cropped.uri);

      // 6. Go to add-contact
      router.replace({ pathname: "/add-contact", params: { imageUri: cloudUrl } });
    } catch (err) {
      console.error("❌ Crop/upload failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <FontAwesome name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crop Business Card</Text>
          <View style={{ width: 36, height: 36, opacity: 0 }} />
        </View>
        <View style={styles.headerUnderlay} />

        {/* Workspace */}
        <View style={styles.canvasWrap}>
          {imageUri ? (
            <View style={styles.previewWrapper}>
              <GestureDetector gesture={combinedGesture}>
                <Animated.View style={[StyleSheet.absoluteFillObject, animatedStyle]}>
                  <Image source={{ uri: imageUri as string }} style={styles.previewImage} />
                </Animated.View>
              </GestureDetector>
              <View pointerEvents="none" style={styles.frameCenter}>
                <View style={styles.cardFrame} />
              </View>
            </View>
          ) : (
            <Text>No image loaded</Text>
          )}
        </View>

        {/* Bottom actions */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.secondaryBtn, processing && { opacity: 0.6 }]}
            onPress={() => router.back()}
            disabled={processing}
          >
            <FontAwesome name="close" size={16} color={BRAND_BLUE} />
            <Text style={styles.secondaryText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, processing && { opacity: 0.7 }]}
            onPress={handleConfirm}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <FontAwesome name="check" size={18} color="#fff" />
                <Text style={styles.primaryText}>Use Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BRAND_BLUE,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito",
  },
  headerUnderlay: {
    height: 18,
    backgroundColor: BG_LIGHT,
    marginTop: -8,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  canvasWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  previewWrapper: {
    width: SCREEN_W,
    height: PREVIEW_H,
    alignSelf: "center",
    position: "relative",
    overflow: "hidden",
  },
  previewImage: { width: "100%", height: "100%", resizeMode: "contain" },
  frameCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  cardFrame: {
    width: FRAME_W,
    height: FRAME_H,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BRAND_BLUE,
    backgroundColor: "transparent",
  },
  bottomBar: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: "#FFF",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
  },
  secondaryText: { color: BRAND_BLUE, fontFamily: "Nunito", fontSize: 14 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: BRAND_BLUE,
  },
  primaryText: { color: "#FFFFFF", fontFamily: "Nunito", fontSize: 14 },
});