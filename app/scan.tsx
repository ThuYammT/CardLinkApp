import {
  CameraView,
  CameraType,
  useCameraPermissions,
} from "expo-camera";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import { useState, useRef, useLayoutEffect } from "react";
import { useRouter, useNavigation } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const router = useRouter();
  const navigation = useNavigation();

  // 🧼 Remove the default top bar
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity
          style={styles.grantBtn}
          onPress={requestPermission}
        >
          <Text style={styles.text}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 📸 Capture image
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
        console.log("Captured URI:", photo.uri);
        Alert.alert("Captured", "Image taken successfully!");

        // TODO: Send `photo.uri` to OCR pipeline or next screen
        router.push({
        pathname: "/add-contact",
        params: { imageUri: photo.uri },
      });

      } catch (err) {
        Alert.alert("Error", "Failed to capture image.");
        console.error(err);
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing((cur) => (cur === "back" ? "front" : "back"));
  };

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        ratio="16:9"
      >
        <View style={styles.overlayContainer}>
          {/* Card-style Frame */}
          <View style={styles.cardFrame} />

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.circleBtn} onPress={toggleCameraFacing}>
              <FontAwesome name="refresh" size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
              <FontAwesome name="camera" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");
const frameWidth = width * 0.9;
const frameHeight = frameWidth * 0.6;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  camera: {
    flex: 1,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
  grantBtn: {
    backgroundColor: "#182C6B",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignSelf: "center",
  },
  message: {
    color: "#333",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  text: {
    color: "white",
    fontSize: 16,
  },
});
