import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useRef, useState } from "react";
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
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  PinchGestureHandler,
  PinchGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
 
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue
} from "react-native-reanimated";
 
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
 
const CLOUD_NAME = "dwmav1imw"; // ✅ your Cloudinary cloud name
const UPLOAD_PRESET = "ml_default"; // ✅ your unsigned preset
 
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const frameWidth = screenWidth * 0.9;
const frameHeight = frameWidth * 0.6;
 
export default function CropScreen() {
  const { imageUri } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const [processing, setProcessing] = useState(false);
 
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);
 
  // Gesture values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
 
  const pinchRef = useRef(null);
  const panRef = useRef(null);
 
  // Pinch handler
  const pinchHandler = useAnimatedGestureHandler<
    PinchGestureHandlerGestureEvent,
    { startScale: number }
  >({
    onStart: (_, ctx) => {
      ctx.startScale = scale.value;
    },
    onActive: (event, ctx) => {
      if (event.numberOfPointers >= 2) { // 👈 only apply when 2 fingers
        scale.value = ctx.startScale * event.scale;
      }
    },
  });
 
  // Pan handler
  const panHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number; startY: number }
  >({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
  });
 
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));
 
  // 📤 Upload helper
  const uploadToCloudinary = async (uri: string) => {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
 
    const data = new FormData();
    data.append("file", `data:image/jpeg;base64,${base64}`);
    data.append("upload_preset", UPLOAD_PRESET);
 
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: data,
      }
    );
 
    const json = await res.json();
    if (json.secure_url) {
      return json.secure_url;
    } else {
      throw new Error("Cloudinary upload failed: " + JSON.stringify(json));
    }
  };
 
  // ✅ Handle confirm → crop with transforms
  const handleConfirm = async () => {
    if (!imageUri) return;
    try {
      setProcessing(true);
 
      // 1. Load original image info
      const imgInfo = await ImageManipulator.manipulateAsync(imageUri as string, []);
      const imgWidth = imgInfo.width;
      const imgHeight = imgInfo.height;
 
      // 2. Calculate crop region in image coordinates
      const frameX = (screenWidth - frameWidth) / 2;
      const frameY = screenHeight / 2 - frameHeight / 2;
 
      // scale factors from screen to image
      const scaleX = imgWidth / screenWidth;
      const scaleY = imgHeight / screenHeight;
 
      // apply user transforms
      const currentScale = scale.value;
      const offsetX = translateX.value * scaleX;
      const offsetY = translateY.value * scaleY;
 
      const cropRegion = {
        originX: Math.max(0, frameX * scaleX - offsetX),
        originY: Math.max(0, frameY * scaleY - offsetY),
        width: Math.min(imgWidth, frameWidth * scaleX / currentScale),
        height: Math.min(imgHeight, frameHeight * scaleY / currentScale),
      };
 
      console.log("📐 Final crop region:", cropRegion);
 
      // 3. Crop with expo-image-manipulator
      const cropped = await ImageManipulator.manipulateAsync(
        imageUri as string,
        [{ crop: cropRegion }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
 
      console.log("✅ Cropped URI:", cropped.uri);
 
      // 4. Upload to Cloudinary
      const cloudUrl = await uploadToCloudinary(cropped.uri);
      console.log("✅ Cloudinary URL:", cloudUrl);
 
      // 5. Navigate to add-contact
      router.replace({
        pathname: "/add-contact",
        params: { imageUri: cloudUrl },
      });
    } catch (err) {
      console.error("❌ Crop/upload failed:", err);
    } finally {
      setProcessing(false);
    }
  };
 
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* 🔙 Back button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
 
        {/* Image preview with gestures */}
        <View style={styles.imageContainer}>
          {imageUri ? (
            <PinchGestureHandler
              ref={pinchRef}
              onGestureEvent={pinchHandler}
              simultaneousHandlers={panRef}
            >
              <Animated.View style={{ flex: 1 }}>
                <PanGestureHandler
                  ref={panRef}
                  onGestureEvent={panHandler}
                  simultaneousHandlers={pinchRef}
                >
                  <Animated.View style={[animatedStyle]}>
                    <Image
                      source={{ uri: imageUri as string }}
                      style={styles.preview}
                    />
                  </Animated.View>
                </PanGestureHandler>
              </Animated.View>
            </PinchGestureHandler>
          ) : (
            <Text style={{ color: "white" }}>⚠️ No image loaded</Text>
          )}
 
          {/* White crop frame */}
          <View style={styles.cardFrame} pointerEvents="none" />
        </View>
 
        {/* Bottom buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.circleBtn, processing && { opacity: 0.5 }]}
            onPress={() => router.back()}
            disabled={processing}
          >
            <FontAwesome name="close" size={22} color="white" />
          </TouchableOpacity>
 
          <TouchableOpacity
            style={[styles.captureBtn, processing && { opacity: 0.5 }]}
            onPress={handleConfirm}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="white" />
            ) : (
              <FontAwesome name="check" size={28} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  imageContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  preview: {
    width: screenWidth,
    height: screenHeight * 0.7,
    resizeMode: "contain",
  },
  cardFrame: {
    position: "absolute",
    width: frameWidth,
    height: frameHeight,
    borderColor: "white",
    borderWidth: 2,
    borderRadius: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 24,
  },
  circleBtn: {
    backgroundColor: "#182C6B",
    padding: 14,
    borderRadius: 40,
  },
  captureBtn: {
    backgroundColor: "#182C6B",
    padding: 20,
    borderRadius: 50,
  },
  backBtn: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
});