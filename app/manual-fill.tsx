import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  LayoutRectangle,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ---------- Theme ---------- */
const BRAND_BLUE = "#213BBB";

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

// Simple cleanup for OCR text
function preprocessOCR(rawText: string): string[] {
  const rawTokens = rawText
    .split(/\n|,|;/) // base split
    .map((t) => t.trim())
    .filter(Boolean)
    .flatMap((t) => {
      // 🔹 handle glued labels like "Tel. Fax."
      return t.split(/\s{2,}|\t+/).map((x) => x.trim());
    })
    .map((t) =>
      // 🔹 strip leading labels
      t.replace(
        /^(Mobile|Office|Tel\.?|Phone|Ph\.?|Fax\.?|E-?mail|Email|Mail|Ext\.?|Extension|ns\.?|EL|Line\s*ID|Line|Wechat|WhatsApp|Facebook|FB|IG|Instagram|Twitter|X|LinkedIn)[:\s]*/i,
        ""
      ).trim()
    )
    .filter(
      (t) =>
        t.length > 1 &&
        !/^(Mobile|Office|Tel\.?|Phone|Ph\.?|Fax\.?|E-?mail|Email|Mail|Ext\.?|Extension|ns\.?|EL|Line\s*ID|Line|Wechat|WhatsApp|Facebook|FB|IG|Instagram|Twitter|X|LinkedIn)$/i.test(
          t
        )
    )
    .flatMap((t) => {
      // 🔹 split multiple numbers in one token
      const multiNumbers = t.match(/\+?\d[\d\s\-()]{5,}/g);
      if (multiNumbers && multiNumbers.length > 1) {
        return multiNumbers.map((n) => n.trim());
      }
      return [t];
    });

  // 🔹 expand full names into first + last
  const expanded = rawTokens.flatMap((t) => {
    const parts = t.split(/\s+/);
    if (
      parts.length === 2 &&
      /^[A-Za-z]+$/.test(parts[0]) &&
      /^[A-Za-z]+$/.test(parts[1])
    ) {
      return [t, parts[0], parts[1]];
    }
    return [t];
  });

  // 🔹 dedupe (case-insensitive), keep order
  const seen = new Set<string>();
  return expanded.filter((t) => {
    const key = t.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function ManualFill() {
  const router = useRouter();
  const { contact: contactParam, ocrData } = useLocalSearchParams();
  const [showInstructions, setShowInstructions] = useState(false);
  const screenHeight = Dimensions.get("window").height;
  const TOKEN_SECTION_HEIGHT = screenHeight * 0.2; // 20% of screen height
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

  // track active field
  const [activeField, setActiveField] = useState<string | null>(null);

  const allTokens: string[] = ocrData
    ? preprocessOCR(JSON.parse(ocrData as string).rawText)
    : [];

  // handle token tap → append instead of replace
  const handleTokenTap = (text: string) => {
    if (!activeField) return;

    if (activeField.startsWith("additionalPhones")) {
      const idx = parseInt(activeField.split("_")[1], 10);
      const updated = [...contact.additionalPhones];
      const current = updated[idx] || "";
      updated[idx] = current ? `${current} ${text}` : text;
      setContact({ ...contact, additionalPhones: updated });
    } else {
      const current = (contact as any)[activeField] || "";
      (contact as any)[activeField] = current ? `${current} ${text}` : text;
      setContact({ ...contact });
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChange: (val: string) => void,
    zoneKey: string,
    multiline: boolean = false
  ) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={0.8}
          onPress={() => setActiveField(zoneKey)}
        >
          <TextInput
            style={[
              styles.input,
              multiline && { height: 80 },
              activeField === zoneKey && {
                borderColor: "#1996fc",
                borderWidth: 2,
                borderRadius: 8,
              },
            ]}
            value={value}
            placeholder={`Tap a token to fill ${label.toLowerCase()}`}
            editable={false} // 👈 disables keyboard
            pointerEvents="none" // 👈 let touches go to wrapper, not the input
            multiline={multiline}
          />
        </TouchableOpacity>

        {value ? (
          <TouchableOpacity onPress={() => onChange("")} style={styles.clearBtn}>
            <FontAwesome name="times" size={16} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      {/* Top Bar */}
      <View
        style={{
          backgroundColor: BRAND_BLUE,
          paddingVertical: 18,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 12 }}
        >
          <FontAwesome name="arrow-left" size={20} color="white" />
        </TouchableOpacity>

        <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
          Manual Fill
        </Text>
      </View>

      {/* Main Content with two independent scroll sections */}
      <View style={{ flex: 1 }}>
        {/* Instruction Section */}
        <View
          style={{
            margin: 12,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            backgroundColor: "#fff",
          }}
        >
          <TouchableOpacity
            onPress={() => setShowInstructions((v) => !v)}
            style={{
              backgroundColor: "#F0F6FF",
              borderLeftWidth: 4,
              borderLeftColor: BRAND_BLUE,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: BRAND_BLUE, fontWeight: "700", fontSize: 15 }}>
              How to use Manual Fill
            </Text>
            <FontAwesome
              name={showInstructions ? "chevron-up" : "chevron-down"}
              size={14}
              color={BRAND_BLUE}
            />
          </TouchableOpacity>

          {showInstructions && (
            <View style={{ padding: 12 }}>
              <Text style={{ color: "#374151", fontSize: 13, lineHeight: 18 }}>
                1. Tap a field below to select it.{"\n"}
                2. Tap a token above to insert it into the selected field.{"\n"}
                3. Tokens will be added after existing text.{"\n"}
                4. Use the X button to clear a field if needed.
              </Text>
            </View>
          )}
        </View>

        {/* Token Section */}
        <View
          style={{
            maxHeight: TOKEN_SECTION_HEIGHT,
            margin: 12,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            backgroundColor: "#fff",
          }}
        >
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator
            contentContainerStyle={{
              flexWrap: "wrap",
              flexDirection: "row",
              padding: 10,
            }}
          >
            {allTokens.map((t, i) => (
              <TouchableOpacity
                key={`token-${i}`}
                style={styles.token}
                onPress={() => handleTokenTap(t)}
              >
                <Text>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Fields Section */}
        <ScrollView
          style={{
            flex: 1,
            margin: 12,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            backgroundColor: "#fff",
          }}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        >
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
                style={[
                  styles.inputRow,
                  activeField === `additionalPhones_${idx}` && {
                    borderColor: "#1996fc",
                    borderWidth: 2,
                  },
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={num}
                  placeholder="Enter phone number"
                  onFocus={() => setActiveField(`additionalPhones_${idx}`)}
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
            <Text style={{ color: BRAND_BLUE, marginBottom: 10, fontWeight: "600" }}>
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
        </ScrollView>

        {/* Sticky Save Button */}
        <View style={styles.stickySaveWrapper}>
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
        </View>
      </View>
    </SafeAreaView>
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
    backgroundColor: BRAND_BLUE,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  stickySaveWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
});