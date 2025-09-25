import { FontAwesome } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
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
const CLOUD_NAME = "dwmav1imw";
const UPLOAD_PRESET = "ml_default";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const frameWidth = SCREEN_WIDTH * 0.88;
const frameHeight = frameWidth * 0.58;

const BRAND_BLUE = "#213BBB";

export default function ScanScreen() {
  const [facing] = useState<CameraType>("back"); // fixed to back
  const [torchOn, setTorchOn] = useState(false); // 🔦 flash state
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const router = useRouter();
  const navigation = useNavigation();
  const [capturing, setCapturing] = useState(false);

  // hide default header
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: "white" }]}>
        {/* Branded top bar */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CardLink</Text>
        </View>

        {/* Permission card */}
        <View style={styles.permissionWrap}>
          <Text style={styles.permissionText}>
            We need your permission to show the camera
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <FontAwesome name="camera" size={18} color="white" />
            <Text style={styles.primaryBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
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

  // 📸 Capture → crop → upload → go to add-contact
  const takePicture = async () => {
    if (cameraRef.current && !capturing) {
      try {
        setCapturing(true);

        const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
        const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
        const fW = screenWidth * 0.9;
        const fH = fW * 0.6;

        const scaleX = photo.width / screenWidth;
        const scaleY = photo.height / screenHeight;

        const cropRegion = {
          originX: screenWidth * 0.05 * scaleX,
          originY: (screenHeight / 2 - fH / 2) * scaleY,
          width: fW * scaleX,
          height: fH * scaleY,
        };

        const cropped = await manipulateAsync(
          photo.uri,
          [{ crop: cropRegion }],
          { compress: 1, format: SaveFormat.JPEG }
        );

        const cloudinaryUrl = await uploadToCloudinary(cropped.uri);
        router.push({ pathname: "/add-contact", params: { imageUri: cloudinaryUrl } });
      } catch (err) {
        Alert.alert("Error", "Failed to capture or crop image.");
        console.error(err);
        setCapturing(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Branded top bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backChip}>
          <FontAwesome name="arrow-left" size={16} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>CardLink</Text>

        {/* 🔦 Flash toggle button */}
        <TouchableOpacity
          onPress={() => setTorchOn((prev) => !prev)}
          style={styles.flashBtn}
        >
          <FontAwesome
            name="bolt"
            size={18}
            color={torchOn ? "#FFD700" : "white"} // yellow when on
          />
        </TouchableOpacity>
      </View>

      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        ratio="16:9"
        enableTorch={torchOn} // 🔦 enable flash
      >
        <View style={styles.overlayContainer}>
          {/* Dimmed overlay with lighter background */}
          <View style={styles.dimOverlay}>
            <View
              style={{
                width: frameWidth,
                height: frameHeight,
                borderRadius: 16,
                backgroundColor: "transparent",
              }}
            />
          </View>

          {/* Frame */}
          <View style={styles.frame} />

          {/* Hint */}
          <Text style={styles.hint}>Place the card inside the frame</Text>

          {/* Scan button */}
          <TouchableOpacity
            style={[styles.primaryBtn, capturing && { opacity: 0.6 }, styles.scanBtn]}
            onPress={takePicture}
            disabled={capturing}
          >
            <FontAwesome name="camera" size={20} color="white" />
            <Text style={styles.primaryBtnText}>Scan</Text>
          </TouchableOpacity>
        </View>
      </CameraView>

      {capturing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Image captured… Loading</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  camera: { flex: 1 },

  // ===== Top bar =====
  header: {
    height: 52,
    backgroundColor: BRAND_BLUE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 5,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  backChip: {
    width: 28,
    height: 28,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  flashBtn: {
    width: 28,
    height: 28,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  overlayContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Dim with cutout — FIXED brightness
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Frame
  frame: {
    position: "absolute",
    width: frameWidth,
    height: frameHeight,
    borderWidth: 3,
    borderColor: "white",
    borderRadius: 16,
  },

  hint: {
    position: "absolute",
    top: (SCREEN_HEIGHT + frameHeight) / 2 + 16,
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  // Scan button (centered)
  scanBtn: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    flexDirection: "row",
    gap: 10,
  },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: BRAND_BLUE,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
  },
  primaryBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  // ===== Permission state =====
  permissionWrap: {
    marginTop: 40,
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  permissionText: {
    color: "#334155",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },

  // Loader
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(33,59,187,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
  },
});