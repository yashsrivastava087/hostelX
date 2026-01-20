// app/AppNavigator.tsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import EditProfileScreen from "./EditProfileScreen";

import SignUpScreen from "./SignUpScreen";
// at top
import { doc, getDoc, getDocs, where } from "firebase/firestore";

import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import ChatRoomScreen from "./ChatRoomScreen";
import ChatsScreen from "./ChatsScreen";
import MyPostsScreen from "./MyPostsScreen";
import PostDetailScreen from "./PostDetailScreen";
import PostItemScreen from "./PostItemScreen";
import RequestsScreen from "./RequestsScreen";

const Stack = createNativeStackNavigator();

// --- Screens ---

function AuthScreen({ navigation }: any) {
  const [identifier, setIdentifier] = useState(""); // email or username
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!identifier || !password) {
      Alert.alert("Missing info", "Please enter email/username and password.");
      return;
    }

    setLoading(true);
    try {
      let emailToUse = identifier.trim();
      const looksLikeUsername = !emailToUse.includes("@");

      if (looksLikeUsername) {
        // username → resolve to stored email
        const qUser = query(
          collection(db, "users"),
          where("username", "==", emailToUse.toLowerCase())
        );
        const snap = await getDocs(qUser);
        if (snap.empty) {
          setLoading(false);
          Alert.alert("Login failed", "Username not found.");
          return;
        }
        const userDoc = snap.docs[0];
        const userData = userDoc.data() as any;

        emailToUse =
          userData.collegeEmail || userData.personalEmail || "";
        if (!emailToUse) {
          setLoading(false);
          Alert.alert(
            "Login failed",
            "User record missing email. Please contact support."
          );
          return;
        }
      }
      // else: identifier is an email (college or personal) – use it directly.

      await signInWithEmailAndPassword(auth, emailToUse, password);
      setLoading(false);
      Alert.alert("Success", "Logged in successfully!");
      navigation.replace("Home");
    } catch (error: any) {
      setLoading(false);
      Alert.alert("Authentication Error", error.message);
    }
  };


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.authContainer}>
        <View style={styles.authCard}>
          <Text style={styles.appName}>HostelX</Text>
          <Text style={styles.subtitle}>Your hostel marketplace</Text>

          <TextInput
            placeholder="Email or username"
            placeholderTextColor="#9ca3af"
            value={identifier}
            onChangeText={setIdentifier}
            style={styles.authInput}
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            style={styles.authInput}
            secureTextEntry
          />

          <View style={{ marginTop: 10 }}>
            <Button
              title={loading ? "Logging in..." : "Log in"}
              onPress={loading ? undefined : handleAuth}
              color="#10b981"
            />
          </View>

          <Pressable
            onPress={() => navigation.navigate("SignUp")}
            style={{ marginTop: 16 }}
          >
            <Text style={styles.switchText}>Create a new account</Text>
          </Pressable>
        </View>

        <Text style={styles.footerText}>
          Buy & sell within your hostel community
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

function HomeScreen({ navigation }: any) {
  const [posts, setPosts] = useState<any[]>([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "need" | "sell">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"time" | "price">("time");
  const [nowMs, setNowMs] = useState(Date.now());

 useEffect(() => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  (async () => {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      setUserProfile(snap.data());
    }
  })();
}, []);


  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const items: any[] = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setPosts(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const getRemainingText = (p: any) => {
    const expMs = p.expiresAt?.toMillis ? p.expiresAt.toMillis() : p.expiresAt;
    if (!expMs) return "";
    const diff = expMs - nowMs;
    if (diff <= 0) return "Expired";

    const totalMins = Math.floor(diff / 60000);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;

    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m left` : `${hours}h left`;
    }
    return `${mins}m left`;
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigation.replace("Auth");
  };

  const filtered = posts
    .filter((p) => {
      const expMs = p.expiresAt?.toMillis
        ? p.expiresAt.toMillis()
        : p.expiresAt;
      if (!expMs) return true;
      return expMs > nowMs;
    })
    .filter((p) => filter === "all" || p.type === filter)
    .filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (p.title || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
    });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "time") return 0;
    const pa = Number(a.price) || 0;
    const pb = Number(b.price) || 0;
    return pa - pb;
  });

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        if (profileMenuOpen) setProfileMenuOpen(false);
      }}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={{ marginBottom: 16 }}>
            {/* Top row: HostelX + right icons */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                zIndex: 10,
              }}
            >
              <Text
                style={{ fontSize: 24, fontWeight: "700", color: "#111827" }}
              >
                HostelX
              </Text>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {/* Chat icon */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate("Chats");
                  }}
                  style={{
                    padding: 8,
                    borderRadius: 999,
                    backgroundColor: "#f3f4f6",
                    marginRight: 8,
                  }}
                >
                  <Text>💬</Text>
                </Pressable>

                {/* Profile avatar + dropdown */}
                <View style={{ position: "relative", zIndex: 20 }}>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setProfileMenuOpen((prev) => !prev);
                    }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#10b981",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>{(userProfile?.fullName || "User").charAt(0).toUpperCase()}</Text>
                  </Pressable>

                  {profileMenuOpen && (
                    <View
                      style={{
                        position: "absolute",
                        top: 48,
                        right: 0,
                        backgroundColor: "#ffffff",
                        borderRadius: 20,
                        width: 260,
                        shadowColor: "#000",
                        shadowOpacity: 0.18,
                        shadowRadius: 16,
                        shadowOffset: { width: 0, height: 6 },
                        elevation: 14,
                        zIndex: 30,
                        overflow: "hidden",
                      }}
                    >
                      {/* Header */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                          borderBottomWidth: 1,
                          borderBottomColor: "#e5e7eb",
                        }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: "#10b981",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          <Text
                            style={{ color: "#fff", fontWeight: "700" }}
                          >
                            {(userProfile?.fullName || "User").charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "600",
                              color: "#111827",
                            }}
                          >
                            {userProfile?.fullName || "User"}
                          </Text>
                          <Text
                            style={{ fontSize: 13, color: "#6b7280" }}
                          >
                            {userProfile?.collegeEmail || userProfile?.personalEmail || ""}
                          </Text>
                        </View>
                      </View>

                      {/* Edit Profile */}
                      <Pressable
                        onPress={() => {
                          setProfileMenuOpen(false);
                          navigation.navigate("EditProfile");
                        }}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                        }}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: "#ecfdf5",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          <Text style={{ fontSize: 16 }}>👤</Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 15,
                            color: "#111827",
                            flex: 1,
                          }}
                        >
                          Edit Profile
                        </Text>
                        <Text style={{ fontSize: 16, color: "#9ca3af" }}>
                          ›
                        </Text>
                      </Pressable>

                      {/* Requests */}
                      <Pressable
                        onPress={() => {
                          setProfileMenuOpen(false);
                          navigation.navigate("Requests");
                        }}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                        }}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: "#ecfdf5",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          <Text style={{ fontSize: 16 }}>💬</Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 15,
                            color: "#111827",
                            flex: 1,
                          }}
                        >
                          Requests
                        </Text>
                      </Pressable>

                      <View
                        style={{
                          height: 1,
                          backgroundColor: "#e5e7eb",
                          marginHorizontal: 16,
                          marginVertical: 6,
                        }}
                      />

                      {/* Logout */}
                      <Pressable
                        onPress={() => {
                          setProfileMenuOpen(false);
                          handleLogout();
                        }}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                        }}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: "#fef2f2",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          <Text
                            style={{ fontSize: 16, color: "#dc2626" }}
                          >
                            ↩︎
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 15,
                            color: "#dc2626",
                            fontWeight: "500",
                          }}
                        >
                          Logout
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Search */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f3f4f6",
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 8,
                marginBottom: 12,
              }}
            >
              <Text style={{ marginRight: 8, fontSize: 16 }}>🔍</Text>
              <TextInput
                placeholder="Search items..."
                placeholderTextColor="#9ca3af"
                value={search}
                onChangeText={setSearch}
                style={{ flex: 1, fontSize: 14 }}
              />
            </View>

            {/* Filter row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Pressable
                onPress={() => navigation.navigate("MyPosts")}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  backgroundColor: "#ffffff",
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: "#111827",
                  }}
                >
                  My Posts
                </Text>
              </Pressable>

              {(["all", "need", "sell"] as const).map((key) => (
                <Pressable
                  key={key}
                  onPress={() => setFilter(key)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 999,
                    backgroundColor:
                      filter === key ? "#10b981" : "#ffffff",
                    borderWidth: 1,
                    borderColor:
                      filter === key ? "#10b981" : "#e5e7eb",
                    marginRight: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "500",
                      color: filter === key ? "#ffffff" : "#4b5563",
                    }}
                  >
                    {key === "all"
                      ? "All"
                      : key === "need"
                        ? "Need"
                        : "Sell"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Sort row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text style={{ marginRight: 4 }}>↕︎</Text>
              <Pressable onPress={() => setSortBy("time")}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: sortBy === "time" ? "600" : "400",
                    color: sortBy === "time" ? "#10b981" : "#6b7280",
                  }}
                >
                  Latest
                </Text>
              </Pressable>
              <Text style={{ marginHorizontal: 6, color: "#9ca3af" }}>
                •
              </Text>
              <Pressable onPress={() => setSortBy("price")}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: sortBy === "price" ? "600" : "400",
                    color: sortBy === "price" ? "#10b981" : "#6b7280",
                  }}
                >
                  Price
                </Text>
              </Pressable>
            </View>
          </View>

          {loading ? (
            <Text style={{ marginTop: 20 }}>Loading posts...</Text>
          ) : (
            <ScrollView style={{ marginTop: 20 }}>
              {sorted.map((p) => {
                const remainingText = getRemainingText(p);
                return (
                  <Pressable
                    key={p.id}
                    onPress={() =>
                      navigation.navigate("PostDetail", { post: p })
                    }
                    style={{
                      marginBottom: 16,
                      padding: 16,
                      borderRadius: 20,
                      backgroundColor: "#fff",
                      shadowColor: "#000",
                      shadowOpacity: 0.05,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: 3,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <View
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 999,
                          backgroundColor:
                            p.type === "sell" ? "#d1fae5" : "#fef3c7",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color:
                              p.type === "sell" ? "#047857" : "#b45309",
                          }}
                        >
                          {p.type === "sell" ? "SELL" : "NEED"}
                        </Text>
                      </View>

                      {remainingText ? (
                        <Text
                          style={{
                            fontSize: 20,
                            fontWeight: "bold",
                            color:
                              remainingText === "Expired"
                                ? "#dc2626"
                                : "#10b981",
                          }}
                        >
                          {remainingText}
                        </Text>
                      ) : null}
                    </View>

                    {p.imageUrls && p.imageUrls.length > 0 && (
                      <View style={{ marginBottom: 8 }}>
                        <Image
                          source={{ uri: p.imageUrls[0] }}
                          style={{
                            width: "100%",
                            height: 160,
                            borderRadius: 12,
                            marginBottom: 8,
                          }}
                          resizeMode="cover"
                        />
                      </View>
                    )}

                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: "#111827",
                        marginBottom: 4,
                      }}
                    >
                      {p.title}
                    </Text>

                    <View style={{ marginTop: 4 }}>
                      <Text style={{ fontSize: 13, color: "#6b7280" }}>
                        {p.description}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#9ca3af",
                          marginTop: 6,
                        }}
                      >
                        {p.userEmail}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "flex-end",
                        marginTop: 8,
                      }}
                    >
                      {p.price ? (
                        <Text
                          style={{
                            fontSize: 20,
                            fontWeight: "700",
                            color: "#111827",
                          }}
                        >
                          ₹{p.price}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        <Pressable
          onPress={() => navigation.navigate("PostItem")}
          style={{
            position: "absolute",
            bottom: 50,
            alignSelf: "center",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 999,
            backgroundColor: "#10b981",
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 5,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 20, marginRight: 8 }}>
            ＋
          </Text>
          <Text
            style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}
          >
            Post Request
          </Text>
        </Pressable>
      </View>
    </TouchableWithoutFeedback>
  );
}


export default function AppNavigator() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return () => unsub();
  }, []);

  if (initializing) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={user ? "Home" : "Auth"}>
      <Stack.Screen name="Chats" component={ChatsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <Stack.Screen name="PostItem" component={PostItemScreen} />
      <Stack.Screen name="MyPosts" component={MyPostsScreen} />
      <Stack.Screen name="Requests" component={RequestsScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  chipPrimary: {
    flex: 1,
    marginRight: 6,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#10b981",
    alignItems: "center",
  },
  chipPrimaryText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  chipOutline: {
    flex: 1,
    marginLeft: 6,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  chipOutlineText: {
    color: "#111827",
    fontWeight: "500",
    fontSize: 14,
  },
  filterChip: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  filterChipActive: {
    backgroundColor: "#e0f2fe",
  },
  filterChipText: {
    color: "#4b5563",
    fontSize: 14,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#0369a1",
    fontWeight: "600",
  },
  sortChip: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  sortChipActive: {
    borderColor: "#10b981",
    backgroundColor: "#ecfdf5",
  },
  sortChipText: {
    color: "#4b5563",
    fontSize: 14,
  },
  sortChipTextActive: {
    color: "#047857",
    fontWeight: "600",
  },
  primaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: "#10b981",
    alignItems: "center",
    minWidth: 220,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },

  authContainer: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  authCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: "center",
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
  },
  authInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#f9fafb",
    marginBottom: 12,
    fontSize: 14,
  },
  switchText: {
    color: "#10b981",
    fontSize: 14,
    fontWeight: "500",
  },
  footerText: {
    marginTop: 16,
    fontSize: 12,
    color: "#6b7280",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
});
