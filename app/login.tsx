import { Link, router, useNavigation } from "expo-router";
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import * as SecureStore from "expo-secure-store";

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ Hide default header
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  // Animations
  // Animations
const logoScale = useRef(new Animated.Value(0.8)).current;
const formScale = useRef(new Animated.Value(0.8)).current;

useEffect(() => {
  Animated.sequence([
    Animated.timing(logoScale, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.elastic(1.2)),
      useNativeDriver: true,
    }),
    Animated.timing(formScale, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.elastic(1.2)),
      useNativeDriver: true,
    }),
  ]).start();
}, []);


  const handleLogin = async () => {
    try {
      const res = await fetch("https://cardlink.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log("Token:", data.token);

        // ✅ Save token securely
        await SecureStore.setItemAsync("userToken", data.token);

        Alert.alert("Login Success", "You're now logged in!");
        router.replace("/home");
      } else {
        Alert.alert("Login Failed", data.message || "Invalid credentials");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to connect to server");
    }
  };

  return (
    <View style={styles.container}>
      {/* Background image */}
      <Image
        source={require("../assets/background.png")}
        style={styles.backgroundImage}
      />

      {/* Logo */}
      <Animated.View
        style={[
          { transform: [{ scale: logoScale }] },
          { alignItems: "center", marginBottom: 40 },
        ]}
      >
        <Image
          source={require("../assets/logo.png")}
          style={{ width: 144, height: 144, marginBottom: 16 }}
        />
      </Animated.View>

      {/* Form Card */}
      <Animated.View
        style={[
          {
            transform: [{ scale: formScale }],
          },
          styles.formCard,
        ]}
      >
        <TextInput
          placeholder="Email"
          placeholderTextColor="#666"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#666"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginText}>LOGIN</Text>
        </TouchableOpacity>

        <Text style={styles.forgotText}>Forgot your Password?</Text>
      </Animated.View>

      {/* Footer */}
      <Text style={styles.welcomeText}>WELCOME</Text>
      <Link href="/signup" style={styles.signupText}>
        Sign up
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  formCard: {
    width: "85%",
    backgroundColor: "#fff", // ✅ solid white so always visible
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontFamily: "Nunito",
    fontSize: 16,
    color: "#000",
  },
  loginButton: {
    backgroundColor: "#213BBB", // brand blue
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 12,
  },
  loginText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "Nunito",
    fontSize: 16,
  },
  forgotText: {
    textAlign: "right",
    fontSize: 12,
    marginBottom: 8,
    color: "#374151",
  },
  welcomeText: {
    color: "#213BBB",
    marginTop: 8,
    marginBottom: 4,
    fontFamily: "Nunito",
    fontSize: 16,
    fontWeight: "bold",
  },
  signupText: {
    color: "#213BBB",
    textDecorationLine: "underline",
    fontSize: 14,
    fontFamily: "Nunito",
  },
});
