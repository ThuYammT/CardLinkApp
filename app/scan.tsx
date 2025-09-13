import { FontAwesome } from "@expo/vector-icons";
import {
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import * as FileSystem from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
 
// 🔑 Cloudinary config
const CLOUD_NAME = "dwmav1imw"; // your Cloudinary cloud name
const UPLOAD_PRESET = "ml_default"; // your unsigned preset
 
export default function ScanScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const router = useRouter();
  const navigation = useNavigation();
  const [capturing, setCapturing] = useState(false); // ✅ state for popup loading
 
  // 🧼 Hide top bar
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);
 
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
          <Text style={styles.text}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
 
  // 📤 Upload helper
  const uploadToCloudinary = async (uri: string) => {
    const base64 = await FileSystem.readAsStringAsync(uri, {
  encoding: "base64",
});

 
    const data = new FormData();
    data.append("file", `data:image/jpeg;base64,${base64}`);
    data.append("upload_preset", UPLOAD_PRESET);
 
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: data,
    });
 
    const json = await res.json();
    if (json.secure_url) {
      return json.secure_url;
    } else {
      throw new Error("Cloudinary upload failed: " + JSON.stringify(json));
    }
  };
 
  // 📸 Capture image → crop → upload → go to add-contact
  const takePicture = async () => {
    if (cameraRef.current && !capturing) {
      try {
        setCapturing(true); // lock capture
 
        const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
        console.log("Captured URI:", photo.uri);
 
        const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
        const frameWidth = screenWidth * 0.9;
        const frameHeight = frameWidth * 0.6;
 
        const scaleX = photo.width / screenWidth;
        const scaleY = photo.height / screenHeight;
 
        const cropRegion = {
          originX: (screenWidth * 0.05) * scaleX,
          originY: (screenHeight / 2 - frameHeight / 2) * scaleY,
          width: frameWidth * scaleX,
          height: frameHeight * scaleY,
        };
 
        console.log("Crop region:", cropRegion);
 
        const cropped = await manipulateAsync(
          photo.uri,
          [{ crop: cropRegion }],
          { compress: 1, format: SaveFormat.JPEG }
        );
 
        console.log("✅ Cropped URI:", cropped.uri);
 
        const cloudinaryUrl = await uploadToCloudinary(cropped.uri);
        console.log("✅ Cloudinary URL:", cloudinaryUrl);
 
        // 👉 navigate to add-contact
        router.push({
          pathname: "/add-contact",
          params: { imageUri: cloudinaryUrl },
        });
      } catch (err) {
        Alert.alert("Error", "Failed to capture or crop image.");
        console.error(err);
        setCapturing(false); // unlock if failed
      }
    }
  };
 
  const toggleCameraFacing = () => {
    setFacing((cur) => (cur === "back" ? "front" : "back"));
  };
 
  return (
    <SafeAreaView style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} ratio="16:9">
        {/* 🔙 Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <FontAwesome name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
 
        <View style={styles.overlayContainer}>
          {/* Frame */}
          <View style={styles.cardFrame} />
 
          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.circleBtn, capturing && { opacity: 0.5 }]}
              onPress={toggleCameraFacing}
              disabled={capturing}
            >
              <FontAwesome name="refresh" size={22} color="white" />
            </TouchableOpacity>
 
            <TouchableOpacity
              style={[styles.captureBtn, capturing && { opacity: 0.5 }]}
              onPress={takePicture}
              disabled={capturing} // ✅ disable while busy
            >
              <FontAwesome name="camera" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
 
      {/* 🔥 Popup Loader Overlay */}
      {capturing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Image captured… Loading</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
 
const { width } = Dimensions.get("window");
const frameWidth = width * 0.9;
const frameHeight = frameWidth * 0.6;
 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  camera: { flex: 1 },
  overlayContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  cardFrame: {
    width: frameWidth,
    height: frameHeight,
    borderColor: "white",
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  buttonRow: {
    flexDirection: "row",
    position: "absolute",
    bottom: 40,
    justifyContent: "space-between",
    width: "60%",
  },
  circleBtn: { backgroundColor: "#182C6B", padding: 14, borderRadius: 40 },
  captureBtn: { backgroundColor: "#182C6B", padding: 20, borderRadius: 50 },
  grantBtn: {
    backgroundColor: "#182C6B",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignSelf: "center",
  },
  message: { color: "#333", fontSize: 16, textAlign: "center", marginBottom: 20 },
  text: { color: "white", fontSize: 16 },
 
  // 🔙 Back button
  backBtn: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
 
  // 🔥 Popup loader styles
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingText: {
    color: "white",
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
  },
});