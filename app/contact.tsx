// app/contact.tsx
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation, usePathname, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert, Animated, FlatList,
  Keyboard,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AnimatedSwipeableRow from "../app/AnimatedSwipeableRow";

/* ---------- Theme ---------- */
const BRAND_BLUE = "#213BBB";
const ICON_BLUE = "#1996fc";
const STAR_YELLOW = "#F4C430";
const CARD_BORDER = "#bfdbfe";

/* ---------- Types ---------- */
type Contact = {
  cardImage?: string;
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  company?: string;
  website?: string;
  notes?: string;
  isFavorite?: boolean;
  nickname?: string;
  position?: string;
  additionalPhones?: string[];
  createdAt?: string;
};

const safe = (v?: string) => (v && v.trim().length ? v : "—");

export default function ContactScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false }); // hides default
  }, [navigation]);

  // search + filters
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [hasPhone, setHasPhone] = useState(false);
  const [hasEmail, setHasEmail] = useState(false);
  const [company, setCompany] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "az" | "company">("newest");

  /* ---------- Fetch ---------- */
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const res = await fetch("https://cardlink.onrender.com/api/contacts", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (Array.isArray(data)) setContacts(data);
    } catch (e) {
      console.error("Failed to fetch contacts:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchContacts();
      return undefined;
    }, [fetchContacts])
  );

  /* ---------- Favorite toggle ---------- */
  const toggleFavorite = async (contact: Contact) => {
    try {
      const token = await SecureStore.getItemAsync("userToken");

      const res = await fetch(
        `https://cardlink.onrender.com/api/contacts/${contact._id}/favorite`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isFavorite: !contact.isFavorite }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update favorite");
      }

      const updated = await res.json();

      setContacts((prev) =>
        prev.map((c) => (c._id === updated._id ? updated : c))
      );
    } catch (err) {
      console.error("❌ toggleFavorite error:", err);
      Alert.alert("Error", "Could not update favorite.");
    }
  };

  /* ---------- Call ---------- */
  const normalizePhone = (n: string) => n.replace(/[()\-\s]/g, "");
  const getAllNumbers = (c: Contact) =>
    Array.from(
      new Set(
        [c.phone, ...(c.additionalPhones || [])]
          .map((n) => (n || "").trim())
          .filter(Boolean)
      )
    );

  const openDialer = (raw?: string) => {
    if (!raw) return Alert.alert("No phone", "This contact has no phone number.");
    const url = `tel:${normalizePhone(raw)}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open dialer.")
    );
  };

  const chooseAndCall = (c: Contact) => {
    const nums = getAllNumbers(c);
    if (nums.length === 0) {
      return Alert.alert("No phone", "This contact has no phone number.");
    }
    if (nums.length === 1) {
      return openDialer(nums[0]);
    }

    if (Platform.OS === "ios") {
      setTimeout(() => {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: `Call ${`${c.firstName} ${c.lastName}`.trim()}`,
            options: [...nums, "Cancel"],
            cancelButtonIndex: nums.length,
          },
          (i) => {
            if (i !== undefined && i >= 0 && i < nums.length) {
              openDialer(nums[i]);
            }
          }
        );
      }, 0);
    } else {
      Alert.alert("Call number", "Choose a number", [
        ...nums.map((n) => ({ text: n, onPress: () => openDialer(n) })),
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  /* ---------- Delete ---------- */
  const confirmDelete = (contactId: string) =>
    Alert.alert("Delete Contact", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => handleDelete(contactId) },
    ]);

  const handleDelete = async (contactId: string) => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const res = await fetch(`https://cardlink.onrender.com/api/contacts/${contactId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) setContacts((prev) => prev.filter((c) => c._id !== contactId));
      else Alert.alert("Error", "Failed to delete contact.");
    } catch {
      Alert.alert("Error", "Something went wrong.");
    }
  };

  /* ---------- Filtering + sorting ---------- */
  const companies = useMemo(() => {
    const set = new Set(
      contacts
        .map((c) => c.company?.trim())
        .filter((v): v is string => !!v)
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [contacts]);

  const displayed = useMemo(() => {
    let base = [...contacts];
    const q = query.toLowerCase().trim();

    if (q) {
      base = base.filter((c) =>
        [
          c.firstName,
          c.lastName,
          c.company,
          c.email,
          c.phone,
          c.nickname,
          c.position,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    if (showFavOnly) base = base.filter((c) => c.isFavorite);
    if (hasPhone) base = base.filter((c) => !!c.phone?.trim());
    if (hasEmail) base = base.filter((c) => !!c.email?.trim());
    if (company) base = base.filter((c) => c.company?.trim() === company);

    // existing sort
    if (sortBy === "az") {
      base.sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      );
    } else if (sortBy === "company") {
      base.sort((a, b) => (a.company || "").localeCompare(b.company || ""));
    } else {
      base.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    }

    // ✅ Always keep favorites on top
    base.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return 0;
    });

    return base;
  }, [contacts, query, showFavOnly, hasPhone, hasEmail, company, sortBy]);

/* ---------- Render ---------- */
const renderItem = ({ item: c }: { item: Contact }) => {
  const scale = new Animated.Value(1);
  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98, // slight shrink
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1, // back to normal
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  return (
    <AnimatedSwipeableRow
      onCall={() => chooseAndCall(c)}
      onDelete={() => confirmDelete(c._id)}
      hasPhone={getAllNumbers(c).length > 0}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: "rgba(0,0,0,0.05)" }}
        onPress={() =>
          router.push({
            pathname: "/contact-detail",
            params: {
              ...c,
              additionalPhones: JSON.stringify(c.additionalPhones || []),
              isFavorite: String(c.isFavorite ?? false),
            },
          })
        }
      >
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={styles.avatar}>
              <Text style={{ color: "#fff", fontWeight: "800" }}>
                {(c.firstName?.[0] || "").toUpperCase()}
                {(c.lastName?.[0] || "").toUpperCase()}
              </Text>
            </View>

            <View style={{ marginLeft: 12, flex: 1 }}>
              {c.nickname ? (
                <>
                  <Text style={styles.name}>{c.nickname}</Text>
                  <Text style={styles.subtitle}>
                    {`${c.firstName} ${c.lastName}`.trim()}
                  </Text>
                </>
              ) : (
                <Text style={styles.name}>
                  {`${c.firstName} ${c.lastName}`.trim()}
                </Text>
              )}
            </View>

            <TouchableOpacity onPress={() => toggleFavorite(c)} style={styles.starPill}>
              <FontAwesome
                name={c.isFavorite ? "star" : "star-o"}
                size={16}
                color={c.isFavorite ? STAR_YELLOW : "#c9d2f6"}
              />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 10 }}>
            <View style={styles.row}>
              <FontAwesome name="phone" size={14} color={ICON_BLUE} />
              <Text style={styles.rowText}>{safe(c.phone)}</Text>
            </View>
            <View style={styles.row}>
              <MaterialIcons name="email" size={14} color={ICON_BLUE} />
              <Text style={styles.rowText}>{safe(c.email)}</Text>
            </View>
            <View style={styles.row}>
              <FontAwesome name="briefcase" size={14} color={ICON_BLUE} />
              <Text style={styles.rowText}>{safe(c.company)}</Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </AnimatedSwipeableRow>
  );
};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={{ backgroundColor: BRAND_BLUE }} className="px-4 py-6">
        <Text className="text-white text-2xl font-nunito font-bold">Contacts</Text>
      </View>

      <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
        {/* Search box */}
        <View style={[styles.searchBox, { flex: 1 }]}>
          <MaterialIcons name="search" size={20} color="#9ca3af" />
          <TextInput
            placeholder="Search contacts"
            value={query}
            onChangeText={setQuery}
            style={{ flex: 1, height: 44, paddingLeft: 8 }}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          <TouchableOpacity onPress={() => setFilterOpen(true)}>
            <FontAwesome name="filter" size={16} color={BRAND_BLUE} />
          </TouchableOpacity>
        </View>

        {/* + Add button outside search bar */}
        <TouchableOpacity
          onPress={() => router.push("/add-contact")}
          style={{
            marginLeft: 12,
            backgroundColor: BRAND_BLUE,
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FontAwesome name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={BRAND_BLUE} />
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(c) => c._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
        />
      )}

      {/* Filter modal */}
      {filterOpen && (
        <Pressable style={styles.overlay} onPress={() => setFilterOpen(false)}>
          <Pressable
            style={[styles.filterCard, { marginBottom: 100 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              showsVerticalScrollIndicator={true}
              indicatorStyle="black"
            >
              <Text className="text-base font-nunito mb-3">Filters</Text>
              <ToggleRow label="Favorites only" checked={showFavOnly} onPress={() => setShowFavOnly((v) => !v)} />
              <ToggleRow label="Has phone" checked={hasPhone} onPress={() => setHasPhone((v) => !v)} />
              <ToggleRow label="Has email" checked={hasEmail} onPress={() => setHasEmail((v) => !v)} />

              {companies.length > 0 && (
                <>
                  <Divider />
                  <Text className="text-base font-nunito mb-2">Company</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    <Chip label="All" active={company === null} onPress={() => setCompany(null)} />
                    {companies.map((co) => (
                      <Chip key={co} label={co} active={company === co} onPress={() => setCompany(co)} />
                    ))}
                  </View>
                </>
              )}

              <Divider />
              <Text className="text-base font-nunito mb-2">Sort by</Text>
              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                <Chip label="Newest" active={sortBy === "newest"} onPress={() => setSortBy("newest")} />
                <Chip label="A–Z" active={sortBy === "az"} onPress={() => setSortBy("az")} />
                <Chip label="Company" active={sortBy === "company"} onPress={() => setSortBy("company")} />
              </View>

              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 20 }}>
                <TouchableOpacity onPress={() => setFilterOpen(false)} style={{ padding: 12 }}>
                  <Text style={{ color: BRAND_BLUE, fontWeight: "600" }}>Done</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      )}

      <BottomNav />
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    minHeight: 108,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#bfdbfe",
  },
  name: { fontSize: 18, fontWeight: "700", color: "#1e3a8a" },
  subtitle: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  rowText: { color: "#111827", fontSize: 14, marginLeft: 8 },
  starPill: {
    backgroundColor: "#f4f6ff",
    borderWidth: 1,
    borderColor: "#e3e8ff",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  overlay: {
    position: "absolute", left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)", justifyContent: "flex-end"
  },
  filterCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",   
    marginBottom: 100,
  },
});

/* ---------- Helpers ---------- */
function Divider() {
  return <View style={{ height: 1, backgroundColor: "#eef2ff", marginVertical: 12 }} />;
}
function ToggleRow({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ paddingVertical: 12, flexDirection: "row", alignItems: "center" }}>
      <FontAwesome name={checked ? "check-square-o" : "square-o"} size={18} color="#111" />
      <Text style={{ marginLeft: 10 }}>{label}</Text>
    </TouchableOpacity>
  );
}
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: active ? BRAND_BLUE : "#f1f5f9",
        marginBottom: 8,
        marginRight: 8,
      }}
    >
      <Text style={{ color: active ? "#fff" : "#111" }}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ---------- BottomNav ---------- */
function BottomNav({ hidden }: { hidden?: boolean }) {
  if (hidden) return null;
  const router = useRouter();
  const pathname = usePathname();

  const active: "home" | "contacts" | "profile" =
    pathname.startsWith("/profile")
      ? "profile"
      : pathname.startsWith("/contact")
      ? "contacts"
      : "home";

  const Item = ({
    isActive,
    onPress,
    icon,
  }: {
    isActive?: boolean;
    onPress: () => void;
    icon: React.ComponentProps<typeof FontAwesome>["name"];
  }) =>
    isActive ? (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          backgroundColor: "#FFFFFF", // white circle highlight
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: "rgba(255,255,255,0.85)",
        }}
      >
        <FontAwesome name={icon} size={20} color={BRAND_BLUE} />
      </TouchableOpacity>
    ) : (
      <TouchableOpacity
        onPress={onPress}
        style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FontAwesome name={icon} size={20} color="#FFFFFF" />
      </TouchableOpacity>
    );

  return (
    <View
      style={{
        position: "absolute",
        left: 20,
        right: 20,
        bottom: 24,
        alignItems: "center",
      }}
      pointerEvents="box-none"
    >
      <View
        style={{
          backgroundColor: BRAND_BLUE,
          borderRadius: 999,
          paddingVertical: 12,
          paddingHorizontal: 18,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        }}
      >
        <Item
          icon="home"
          isActive={active === "home"}
          onPress={() => router.replace("/home")}
        />
        <Item
          icon="address-book-o"
          isActive={active === "contacts"} // ✅ highlight contacts too
          onPress={() => router.replace("/contact")}
        />
        <Item
          icon="user-o"
          isActive={active === "profile"}
          onPress={() => router.replace("/profile")}
        />
      </View>
    </View>
  );
}