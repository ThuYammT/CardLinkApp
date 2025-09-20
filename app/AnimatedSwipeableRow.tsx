import { FontAwesome } from "@expo/vector-icons";
import React, { ReactNode } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

// ✅ use scheduleOnRN (replaces runOnJS)
import { scheduleOnRN } from "react-native-worklets";

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = width * 0.25;

type AnimatedSwipeableRowProps = {
  children: ReactNode;
  onDelete: () => void;
  onCall: () => void;
  hasPhone: boolean;
};

export default function AnimatedSwipeableRow({
  children,
  onDelete,
  onCall,
  hasPhone,
}: AnimatedSwipeableRowProps) {
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        scheduleOnRN(onCall);
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        scheduleOnRN(onDelete);
      }
      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const LeftActions = () => (
    <TouchableOpacity
      onPress={onCall}
      disabled={!hasPhone}
      style={[styles.leftAction, !hasPhone && { backgroundColor: "#9ca3af" }]}
    >
      <FontAwesome name="phone" size={20} color="white" />
      <Text style={{ color: "white", marginTop: 4 }}>
        {hasPhone ? "Call" : "No phone"}
      </Text>
    </TouchableOpacity>
  );

  const RightActions = () => (
    <TouchableOpacity onPress={onDelete} style={styles.rightAction}>
      <FontAwesome name="trash" size={20} color="white" />
      <Text style={{ color: "white", marginTop: 4 }}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Background actions */}
      <View style={styles.actionContainer}>
        <LeftActions />
        <RightActions />
      </View>

      {/* Foreground content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  actionContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  leftAction: {
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    width: 88,
    borderRadius: 12,
    paddingVertical: 14,
  },
  rightAction: {
    backgroundColor: "#ff5047",
    justifyContent: "center",
    alignItems: "center",
    width: 88,
    borderRadius: 12,
    paddingVertical: 14,
  },
});
