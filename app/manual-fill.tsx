import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  LayoutRectangle,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { runOnJS, scheduleOnRN } from "react-native-worklets";
import { FontAwesome } from "@expo/vector-icons";

/* ---------- Global typing fix ---------- */
declare global {
  var __dropZones: { [key: string]: LayoutRectangle } | undefined;
}

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
  onHover,
}: {
  text: string;
  onDrop: (x: number, y: number, txt: string) => void;
  onHover: (field: string | null) => void;
}) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const gesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((e) => {
  x.value = e.translationX;
  y.value = e.translationY;

  // live highlight detection
  for (const [field, rect] of Object.entries(globalThis.__dropZones ?? {})) {
    if (
      e.absoluteX >= rect.x &&
      e.absoluteX <= rect.x + rect.width &&
      e.absoluteY >= rect.y &&
      e.absoluteY <= rect.y + rect.height
    ) {
      scheduleOnRN(onHover, field); // ✅ no runOnJS
      return;
    }
  }
  scheduleOnRN(onHover, null); // ✅
})
.onEnd((e) => {
  isDragging.value = false;
  scheduleOnRN(onDrop, e.absoluteX, e.absoluteY, text);
  x.value = withSpring(0);
  y.value = withSpring(0);
  scheduleOnRN(onHover, null); // ✅
});


  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
    zIndex: isDragging.value ? 9999 : 1,
    elevation: isDragging.value ? 5 : 0,
    position: isDragging.value ? "absolute" : "relative",
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.token, style]}>
        <Text>{text}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

// Simple cleanup
function preprocessOCR(rawText: string): string[] {
  return rawText
    .split(/\n|,|;/)
    .map((t) => t.trim())
    .filter(
      (t) =>
        t &&
        !/^(Mobile|Office|Tel|E-?mail|Ext\.?|ns\.?|EL)$/i.test(t) &&
        t.length > 1
    );
}

export default function ManualFill() {
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

  // store absolute rects
  const dropZones = useRef<{ [key: string]: LayoutRectangle }>({}).current;
  globalThis.__dropZones = dropZones;

  const [highlightField, setHighlightField] = useState<string | null>(null);

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
        break;
      }
    }
    setHighlightField(null);
  };

  const allTokens: string[] = ocrData
    ? preprocessOCR(JSON.parse(ocrData as string).rawText)
    : [];

  const renderInput = (
    label: string,
    value: string,
    onChange: (val: string) => void,
    zoneKey: string,
    multiline: boolean = false
  ) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <View
        ref={(ref) => {
          if (ref) {
            ref.measureInWindow((x, y, width, height) => {
              dropZones[zoneKey] = { x, y, width, height };
            });
          }
        }}
        style={[
          styles.inputRow,
          highlightField === zoneKey && {
            borderColor: "#1996fc",
            borderWidth: 2,
          },
        ]}
      >
        <TextInput
          style={[styles.input, multiline && { height: 80 }]}
          value={value}
          onChangeText={onChange}
          multiline={multiline}
        />
        {value ? (
          <TouchableOpacity onPress={() => onChange("")} style={styles.clearBtn}>
            <FontAwesome name="times" size={16} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontWeight: "bold", marginBottom: 10 }}>
          Drag OCR Tokens
        </Text>

        {/* ✅ Vertical scrollable token box */}
        <View style={styles.ocrContainer}>
          <ScrollView
            style={{ maxHeight: 160 }}
            nestedScrollEnabled
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ flexWrap: "wrap", flexDirection: "row" }}
          >
            {allTokens.map((t, i) => (
              <DraggableToken
                key={`token-${i}`}
                text={t}
                onDrop={handleDrop}
                onHover={setHighlightField}
              />
            ))}
          </ScrollView>
        </View>

        {renderInput("First Name", contact.firstName, (val) =>
          setContact({ ...contact, firstName: val }), "firstName")}
        {renderInput("Last Name", contact.lastName, (val) =>
          setContact({ ...contact, lastName: val }), "lastName")}
        {renderInput("Nickname", contact.nickname, (val) =>
          setContact({ ...contact, nickname: val }), "nickname")}
        {renderInput("Position", contact.position, (val) =>
          setContact({ ...contact, position: val }), "position")}
        {renderInput("Phone", contact.phone, (val) =>
          setContact({ ...contact, phone: val }), "phone")}

        {contact.additionalPhones.map((num, idx) => (
          <View key={`addPhone-${idx}`} style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Additional Phone {idx + 1}</Text>
            <View
              ref={(ref) => {
                if (ref) {
                  ref.measureInWindow((x, y, width, height) => {
                    dropZones[`additionalPhones_${idx}`] = {
                      x,
                      y,
                      width,
                      height,
                    };
                  });
                }
              }}
              style={[
                styles.inputRow,
                highlightField === `additionalPhones_${idx}` && {
                  borderColor: "#1996fc",
                  borderWidth: 2,
                },
              ]}
            >
              <TextInput
                style={styles.input}
                value={num}
                onChangeText={(val) => {
                  const updated = [...contact.additionalPhones];
                  updated[idx] = val;
                  setContact({ ...contact, additionalPhones: updated });
                }}
              />
              {num ? (
                <TouchableOpacity
                  onPress={() => {
                    const updated = [...contact.additionalPhones];
                    updated[idx] = "";
                    setContact({ ...contact, additionalPhones: updated });
                  }}
                  style={styles.clearBtn}
                >
                  <FontAwesome name="times" size={16} color="#666" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
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

        {renderInput("Email", contact.email, (val) =>
          setContact({ ...contact, email: val }), "email")}
        {renderInput("Company", contact.company, (val) =>
          setContact({ ...contact, company: val }), "company")}
        {renderInput("Website", contact.website, (val) =>
          setContact({ ...contact, website: val }), "website")}
        {renderInput("Notes", contact.notes, (val) =>
          setContact({ ...contact, notes: val }), "notes", true)}

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
  ocrContainer: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  label: {
    fontWeight: "600",
    marginBottom: 4,
    color: "#111",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
    flex: 1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  clearBtn: {
    marginLeft: 6,
    padding: 6,
  },
  saveBtn: {
    marginTop: 20,
    backgroundColor: "#213BBB",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});
