// app/contact.tsx
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { router, usePathname, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { SafeAreaView } from "react-native-safe-area-context";

/* ---------- Theme ---------- */
const BRAND_BLUE = "#213BBB";
const LIGHT_BG = "#F6F7FB";
const STAR_YELLOW = "#F4C430";

/* ---------- Types ---------- */
type Contact = {
  cardImage: string;
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
  website?: string;
  notes?: string;
  isFavorite: boolean;
  nickname?: string;
  position?: string;
  additionalPhones?: string[];
  createdAt?: string;
};

export default function Contacts() {
  const navigation = useNavigation();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  // filter UI state
  const [filterOpen, setFilterOpen] = useState(false);
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [hasPhone, setHasPhone] = useState(false);
  const [hasEmail, setHasEmail] = useState(false);
  const [company, setCompany] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "az" | "company">("newest");
  const cardStyle = {
  backgroundColor: "white",
  borderRadius: 16,
  paddingVertical: 16,
  paddingHorizontal: 12,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: "#bfdbfe", // border-blue-100
  // iOS shadow
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 4 },
  // Android shadow
  elevation: 3,
};


  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  useEffect(() => {
  const fetchContacts = async () => {
    const token = await SecureStore.getItemAsync("userToken");
    if (!token) return; // ✅ safety check

    try {
      const res = await fetch("https://cardlink.onrender.com/api/contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        setContacts(data); // ✅ 
      } else {
        console.error("Fetch error:", data?.message);
      }
    } catch (err) {
      console.error("Error loading contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchContacts();
}, []);



  // unique companies for filter
  const companies = useMemo(() => {
    const set = new Set(
      contacts
        .map((c) => c.company?.trim())
        .filter((v): v is string => !!v)
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [contacts]);

  // derived list with filters
  const displayed = useMemo(() => {
    let base = [...contacts];

    if (showFavOnly) base = base.filter((c) => c.isFavorite);
    if (hasPhone) base = base.filter((c) => !!c.phone?.trim());
    if (hasEmail) base = base.filter((c) => !!c.email?.trim());
    if (company) base = base.filter((c) => c.company?.trim() === company);

    if (sortBy === "az") {
      base.sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      );
    } else if (sortBy === "company") {
      base.sort((a, b) => (a.company || "").localeCompare(b.company || ""));
    } else {
      // newest by createdAt
      base.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    }
    return base;
  }, [contacts, showFavOnly, hasPhone, hasEmail, company, sortBy]);

  /* ---------- Actions ---------- */
  const confirmDelete = (contactId: string) => {
    Alert.alert("Delete Contact", "Are you sure you want to delete this contact?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => handleDelete(contactId) },
    ]);
  };

  const handleDelete = async (contactId: string) => {
    const token = await SecureStore.getItemAsync("userToken");
    try {
      const res = await fetch(`https://cardlink.onrender.com/api/contacts/${contactId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c._id !== contactId));
        Alert.alert("Deleted", "Contact successfully deleted.");
      } else {
        Alert.alert("Error", "Failed to delete contact.");
      }
    } catch (err) {
      console.error("Error deleting contact:", err);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  const toggleFavorite = async (contact: Contact) => {
    // optimistic UI
    setContacts((prev) =>
      prev.map((c) => (c._id === contact._id ? { ...c, isFavorite: !c.isFavorite } : c))
    );

    try {
      const token = await SecureStore.getItemAsync("userToken");
      await fetch(`https://cardlink.onrender.com/api/contacts/${contact._id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isFavorite: !contact.isFavorite }),
      });
    } catch (e) {
      // rollback if needed
      setContacts((prev) =>
        prev.map((c) => (c._id === contact._id ? { ...c, isFavorite: contact.isFavorite } : c))
      );
      Alert.alert("Error", "Could not update favorite.");
    }
  };

  /* ---------- Swipe buttons ---------- */
  const renderRightActions = (_progress: any, _dragX: any, onDelete: () => void) => (
    <TouchableOpacity
      onPress={onDelete}
      style={{
        backgroundColor: "#ff5047",
        justifyContent: "center",
        alignItems: "center",
        width: 88,
        marginVertical: 14,
        borderRadius: 12,
        transform: [{ translateY: -8 }],
      }}
    >
      <FontAwesome name="trash" size={20} color="white" />
      <Text style={{ color: "white", marginTop: 4 }}>Delete</Text>
    </TouchableOpacity>
  );

  const renderLeftActions = (_progress: any, _dragX: any, onFav: () => void, fav: boolean) => (
    <TouchableOpacity
      onPress={onFav}
      style={{
        backgroundColor: fav ? "#e9d68a" : "#ffeaa3",
        justifyContent: "center",
        alignItems: "center",
        width: 88,
        marginVertical: 14,
        borderRadius: 12,
        transform: [{ translateY: -8 }],
      }}
    >
      <FontAwesome name={fav ? "star" : "star-o"} size={20} color={STAR_YELLOW} />
      <Text style={{ color: "#5b4a00", marginTop: 4 }}>{fav ? "Unfave" : "Favorite"}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LIGHT_BG }}>
      {/* Header: title + actions (Add pill, Filter icon) */}
      <View
        style={{ backgroundColor: BRAND_BLUE }}
        className="px-4 py-6 flex-row justify-between items-center"
      >
        <Text className="text-white text-2xl font-nunito font-bold">Contacts</Text>

        <View className="flex-row items-center">
          {/* Add pill */}
          <TouchableOpacity
            onPress={() => router.push("/add-contact")}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#fff",
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 20,
              marginRight: 12,
            }}
            accessibilityRole="button"
            accessibilityLabel="Add contact"
          >
            <FontAwesome name="plus" size={14} color={BRAND_BLUE} />
            <Text style={{ color: BRAND_BLUE, marginLeft: 6, fontWeight: "600" }}>Add</Text>
          </TouchableOpacity>

          {/* Filter icon */}
          <TouchableOpacity
            onPress={() => setFilterOpen(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
          >
            <FontAwesome name="filter" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <ScrollView className="px-4 mt-4 mb-36">
        {loading ? (
          <ActivityIndicator size="large" color={BRAND_BLUE} />
        ) : displayed.length === 0 ? (
          <Text className="text-center text-gray-600 font-nunito">No contacts found.</Text>
        ) : (
          displayed.map((c) => (
            <Swipeable
              key={c._id}
              renderLeftActions={(progress, dragX) =>
                renderLeftActions(progress, dragX, () => toggleFavorite(c), c.isFavorite)
              }
              renderRightActions={(progress, dragX) =>
                renderRightActions(progress, dragX, () => confirmDelete(c._id))
              }
            >
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/contact-detail",
                    params: {
                      _id: c._id,
                      firstName: c.firstName,
                      lastName: c.lastName,
                      phone: c.phone,
                      email: c.email,
                      company: c.company,
                      website: c.website || "",
                      notes: c.notes || "",
                      nickname: c.nickname || "",
                      position: c.position || "",
                      additionalPhones: JSON.stringify(c.additionalPhones || []),
                      createdAt: c.createdAt || "",
                      cardImage: c.cardImage || "",
                      isFavorite: String(c.isFavorite),
                    },
                  })
                }
              >
              <View style={cardStyle}>
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-blue-200 rounded-full justify-center items-center">
                    <Text className="text-white font-bold text-sm">
                      {c.firstName?.[0]}
                      {c.lastName?.[0]}
                    </Text>
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-xl font-bold text-blue-900 font-nunito">
                      {c.firstName} {c.lastName}
                    </Text>
                    <Text className="text-xs text-gray-500">{c.company}</Text>
                  </View>

                  {/* Optional star indicator */}
                  <FontAwesome
                    name={c.isFavorite ? "star" : "star-o"}
                    size={18}
                    color={c.isFavorite ? "#F4C430" : "#cbd5e1"}
                  />
                </View>

                <View className="mt-3 space-y-1">
                  <View className="flex-row items-center">
                    <FontAwesome name="phone" size={14} color="#1996fc" />
                    <Text className="ml-2 text-sm text-gray-800">{c.phone || "—"}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <MaterialIcons name="email" size={14} color="#1996fc" />
                    <Text className="ml-2 text-sm text-gray-800">{c.email || "—"}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <FontAwesome name="briefcase" size={14} color="#1996fc" />
                    <Text className="ml-2 text-sm text-gray-800">{c.company || "—"}</Text>
                  </View>
                </View>
              </View>

              </TouchableOpacity>
            </Swipeable>
          ))
        )}
      </ScrollView>

      {/* Filter sheet (tap outside to close) — sits ABOVE nav */}
      {filterOpen && (
        <Pressable
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.25)",
            justifyContent: "flex-end",
            zIndex: 999, // ensure above
          }}
          onPress={() => setFilterOpen(false)}
        >
          <Pressable
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-base font-nunito mb-3">Filters</Text>

            {/* Toggles */}
            <TouchableOpacity
              onPress={() => setShowFavOnly((v) => !v)}
              style={{ paddingVertical: 12, flexDirection: "row", alignItems: "center" }}
            >
              <FontAwesome
                name={showFavOnly ? "check-square-o" : "square-o"}
                size={18}
                color="#111"
              />
              <Text style={{ marginLeft: 10 }}>Favorites only</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setHasPhone((v) => !v)}
              style={{ paddingVertical: 12, flexDirection: "row", alignItems: "center" }}
            >
              <FontAwesome name={hasPhone ? "check-square-o" : "square-o"} size={18} color="#111" />
              <Text style={{ marginLeft: 10 }}>Has phone</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setHasEmail((v) => !v)}
              style={{ paddingVertical: 12, flexDirection: "row", alignItems: "center" }}
            >
              <FontAwesome name={hasEmail ? "check-square-o" : "square-o"} size={18} color="#111" />
              <Text style={{ marginLeft: 10 }}>Has email</Text>
            </TouchableOpacity>

            {/* Company chips */}
            {companies.length > 0 && (
              <>
                <View style={{ height: 1, backgroundColor: "#eee", marginVertical: 12 }} />
                <Text className="text-base font-nunito mb-2">Company</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setCompany(null)}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 999,
                      backgroundColor: company === null ? BRAND_BLUE : "#f1f5f9",
                    }}
                  >
                    <Text style={{ color: company === null ? "#fff" : "#111" }}>All</Text>
                  </TouchableOpacity>

                  {companies.map((co) => (
                    <TouchableOpacity
                      key={co}
                      onPress={() => setCompany(co)}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 999,
                        backgroundColor: company === co ? BRAND_BLUE : "#f1f5f9",
                      }}
                    >
                      <Text style={{ color: company === co ? "#fff" : "#111" }}>{co}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Sort */}
            <View style={{ height: 1, backgroundColor: "#eee", marginVertical: 12 }} />
            <Text className="text-base font-nunito mb-2">Sort by</Text>
            <View style={{ flexDirection: "row", columnGap: 10, flexWrap: "wrap" }}>
              <Chip label="Newest" active={sortBy === "newest"} onPress={() => setSortBy("newest")} />
              <Chip label="A–Z (Name)" active={sortBy === "az"} onPress={() => setSortBy("az")} />
              <Chip
                label="Company (A–Z)"
                active={sortBy === "company"}
                onPress={() => setSortBy("company")}
              />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 14 }}>
              <TouchableOpacity onPress={() => setFilterOpen(false)} style={{ padding: 10 }}>
                <Text style={{ color: BRAND_BLUE, fontWeight: "600" }}>Done</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      )}

      {/* Pill bottom nav — hidden when the filter is open so sheet never goes under it */}
      <BottomNav hidden={filterOpen} />
    </SafeAreaView>
  );
}

/* ---------- Small Chip component ---------- */
function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: active ? BRAND_BLUE : "#f1f5f9",
        marginBottom: 8,
      }}
    >
      <Text style={{ color: active ? "#fff" : "#111" }}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ---------- BottomNav ---------- */
function BottomNav({ hidden }: { hidden?: boolean }) {
  if (hidden) return null;

  const pathname = usePathname();
  const router = useRouter();

  const active: "home" | "contacts" | "calendar" | "profile" =
    pathname.startsWith("/profile")
      ? "profile"
      : pathname.startsWith("/calendar")
      ? "calendar"
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
          backgroundColor: "#FFFFFF",
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
        <Item icon="home" isActive={active === "home"} onPress={() => router.replace("/home")} />
        <Item
          icon="address-book-o"
          isActive={active === "contacts"}
          onPress={() => router.replace("/contact")}
        />
        <Item
          icon="calendar-o"
          isActive={active === "calendar"}
          onPress={() => router.replace("/calendar")}
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
