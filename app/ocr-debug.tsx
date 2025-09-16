import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutRectangle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useLocalSearchParams, useRouter } from "expo-router";

type Contact = {
  firstName: string;
  lastName: string;
  nickname: string;
  position: string;
  phone: string;
  additionalPhones: string[];
  email: string;
  company: string;
  website: string;
  notes: string;
};

function DraggableToken({
  text,
  onDrop,
}: {
  text: string;
  onDrop: (x: number, y: number, txt: string) => void;
}) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      x.value = e.translationX;
      y.value = e.translationY;
    })
    .onEnd((e) => {
  scheduleOnRN(onDrop, e.absoluteX, e.absoluteY, text); // ✅ pass function + args
  x.value = withSpring(0);
  y.value = withSpring(0);
});

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.token, style]}>
        <Text>{text}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

export default function OCRDebug() {
  const router = useRouter();
  const { contact: contactParam, ocrData } = useLocalSearchParams();

  const [contact, setContact] = useState<Contact>(
    contactParam
      ? JSON.parse(contactParam as string)
      : {
          firstName: "",
          lastName: "",
          nickname: "",
          position: "",
          phone: "",
          additionalPhones: [],
          email: "",
          company: "",
          website: "",
          notes: "",
        }
  );

  const dropZones = useRef<{ [key: string]: LayoutRectangle }>({}).current;

  const handleDrop = (x: number, y: number, txt: string) => {
    for (const [field, rect] of Object.entries(dropZones)) {
      if (
        x >= rect.x &&
        x <= rect.x + rect.width &&
        y >= rect.y &&
        y <= rect.y + rect.height
      ) {
        if (field.startsWith("additionalPhones")) {
          const idx = parseInt(field.split("_")[1], 10);
          const updatedPhones = [...contact.additionalPhones];
          updatedPhones[idx] = txt;
          setContact((prev) => ({ ...prev, additionalPhones: updatedPhones }));
        } else {
          setContact((prev) => ({ ...prev, [field]: txt }));
        }
      }
    }
  };

  const tokens: string[] = (
    ocrData ? JSON.parse(ocrData as string).rawText.split(/\s+/) : []
  ).slice(0, 50);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontWeight: "bold", marginBottom: 10 }}>
          Drag OCR Tokens
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {tokens.map((t: string, i: number) => (
            <DraggableToken key={i} text={t} onDrop={handleDrop} />
          ))}
        </View>

        {/* All input fields */}
        <TextInput
          style={styles.input}
          value={contact.firstName}
          onChangeText={(val) => setContact({ ...contact, firstName: val })}
          placeholder="First Name"
          onLayout={(e) => (dropZones.firstName = e.nativeEvent.layout)}
        />
        <TextInput
          style={styles.input}
          value={contact.lastName}
          onChangeText={(val) => setContact({ ...contact, lastName: val })}
          placeholder="Last Name"
          onLayout={(e) => (dropZones.lastName = e.nativeEvent.layout)}
        />
        <TextInput
          style={styles.input}
          value={contact.nickname}
          onChangeText={(val) => setContact({ ...contact, nickname: val })}
          placeholder="Nickname"
          onLayout={(e) => (dropZones.nickname = e.nativeEvent.layout)}
        />
        <TextInput
          style={styles.input}
          value={contact.position}
          onChangeText={(val) => setContact({ ...contact, position: val })}
          placeholder="Position"
          onLayout={(e) => (dropZones.position = e.nativeEvent.layout)}
        />
        <TextInput
          style={styles.input}
          value={contact.phone}
          onChangeText={(val) => setContact({ ...contact, phone: val })}
          placeholder="Phone"
          onLayout={(e) => (dropZones.phone = e.nativeEvent.layout)}
        />

        {/* Additional Phones */}
        {contact.additionalPhones.map((num, idx) => (
          <TextInput
            key={idx}
            style={styles.input}
            value={num}
            onChangeText={(val) => {
              const updated = [...contact.additionalPhones];
              updated[idx] = val;
              setContact({ ...contact, additionalPhones: updated });
            }}
            placeholder={`Additional Phone ${idx + 1}`}
            onLayout={(e) =>
              (dropZones[`additionalPhones_${idx}`] = e.nativeEvent.layout)
            }
          />
        ))}
        <TouchableOpacity
          onPress={() =>
            setContact({
              ...contact,
              additionalPhones: [...contact.additionalPhones, ""],
            })
          }
        >
          <Text style={{ color: "#213BBB", marginBottom: 10 }}>
            + Add another phone
          </Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={contact.email}
          onChangeText={(val) => setContact({ ...contact, email: val })}
          placeholder="Email"
          onLayout={(e) => (dropZones.email = e.nativeEvent.layout)}
        />
        <TextInput
          style={styles.input}
          value={contact.company}
          onChangeText={(val) => setContact({ ...contact, company: val })}
          placeholder="Company"
          onLayout={(e) => (dropZones.company = e.nativeEvent.layout)}
        />
        <TextInput
          style={styles.input}
          value={contact.website}
          onChangeText={(val) => setContact({ ...contact, website: val })}
          placeholder="Website"
          onLayout={(e) => (dropZones.website = e.nativeEvent.layout)}
        />
        <TextInput
          style={[styles.input, { height: 100 }]}
          value={contact.notes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          onChangeText={(val) => setContact({ ...contact, notes: val })}
          placeholder="Notes"
          onLayout={(e) => (dropZones.notes = e.nativeEvent.layout)}
        />

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() =>
            router.replace({
              pathname: "/add-contact",
              params: { contact: JSON.stringify(contact) },
            })
          }
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  token: {
    backgroundColor: "#cce5ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    margin: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginVertical: 8,
    borderRadius: 6,
  },
  saveBtn: {
    marginTop: 20,
    backgroundColor: "#213BBB",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});
