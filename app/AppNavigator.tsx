// app/AppNavigator.tsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import MyPostsScreen from "./MyPostsScreen";
import PostDetailScreen from "./PostDetailScreen";
import PostItemScreen from "./PostItemScreen";
import RequestsScreen from "./RequestsScreen";

const Stack = createNativeStackNavigator();

// --- Screens ---

function AuthScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        Alert.alert("Success", "Logged in successfully!");
        navigation.replace("Home");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert("Success", "Account created! Welcome.");
        navigation.replace("Home");
      }
    } catch (error: any) {
      Alert.alert("Authentication Error", error.message);
    }
  };

  return (
    <View style={styles.authContainer}>
      <View style={styles.authCard}>
        <Text style={styles.appName}>HostelX</Text>
        <Text style={styles.subtitle}>Your hostel marketplace</Text>

        <TextInput
          placeholder="Email address"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
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
            title={isLogin ? "Log in" : "Sign up"}
            onPress={handleAuth}
            color="#10b981"
          />
        </View>

        <Pressable
          onPress={() => setIsLogin(!isLogin)}
          style={{ marginTop: 16 }}
        >
          <Text style={styles.switchText}>
            {isLogin ? "Create a new account" : "I have an account"}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.footerText}>
        Buy & sell within your hostel community
      </Text>
    </View>
  );
}

function HomeScreen({ navigation }: any) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "need" | "sell">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"time" | "price">("time");

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

  const handleLogout = async () => {
    await signOut(auth);
    navigation.replace("Auth");
  };

  const filtered = posts
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
    if (sortBy === "time") {
      // already newest-first from Firestore
      return 0;
    }
    const pa = Number(a.price) || 0;
    const pb = Number(b.price) || 0;
    return pa - pb; // low to high
  });

  return (
    <View style={styles.container}>
      <View style={{ marginBottom: 16 }}>
        {/* Top row: HostelX + right icons placeholder */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#111827" }}>
            HostelX
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* Requests count badge later */}
            <Pressable
              onPress={() => navigation.navigate("Requests")}
              style={{
                padding: 8,
                borderRadius: 999,
                backgroundColor: "#f3f4f6",
                marginRight: 8,
              }}
            >
              <Text>📩</Text>
            </Pressable>
            <Pressable onPress={handleLogout}>
              <Text style={{ fontSize: 18 }}>↩︎</Text>
            </Pressable>
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

        {/* Row: My Posts + filter chips */}
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
            <Text style={{ fontSize: 13, fontWeight: "500", color: "#111827" }}>
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
                backgroundColor: filter === key ? "#10b981" : "#ffffff",
                borderWidth: 1,
                borderColor: filter === key ? "#10b981" : "#e5e7eb",
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
                {key === "all" ? "All" : key === "need" ? "Need" : "Sell"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Sort row like “Latest • Price” */}
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
          <Text style={{ marginHorizontal: 6, color: "#9ca3af" }}>•</Text>
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
          {sorted.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => navigation.navigate("PostDetail", { post: p })}
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
              {/* Top row: badge + price */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: p.type === "sell" ? "#d1fae5" : "#fef3c7",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: p.type === "sell" ? "#047857" : "#b45309",
                    }}
                  >
                    {p.type === "sell" ? "SELL" : "NEED"}
                  </Text>
                </View>

                {p.price ? (
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: "#111827",
                    }}
                  >
                    ₹{p.price}
                  </Text>
                ) : null}
              </View>

              {/* Title */}
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

              {/* Location + email (simple for now) */}
              <View style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 13, color: "#6b7280" }}>
                  {p.description}
                </Text>
                <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
                  {p.userEmail}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
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
      <Stack.Screen name="PostItem" component={PostItemScreen} />
      <Stack.Screen name="MyPosts" component={MyPostsScreen} />
      <Stack.Screen name="Requests" component={RequestsScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
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
