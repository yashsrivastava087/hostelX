// app/MyPostsScreen.tsx
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { auth, db } from "../firebaseConfig";

export default function MyPostsScreen({ navigation }: any) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDelete = (id: string) => {
    Alert.alert("Delete post", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "posts", id));
        },
      },
    ]);
  };

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const q = query(
      collection(db, "posts"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const items: any[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setPosts(items);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Posts</Text>

      {loading ? (
        <Text>Loading...</Text>
      ) : posts.length === 0 ? (
        <Text>No posts yet.</Text>
      ) : (
        <ScrollView style={{ marginTop: 10 }}>
          {posts.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => navigation.navigate("PostDetail", { post: p })}
              style={styles.card}
            >
              {/* Top row: badge + price */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 6,
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
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#111827",
                    }}
                  >
                    ₹{p.price}
                  </Text>
                ) : null}
              </View>

              {/* Title & description */}
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
              <Text
                style={{
                  fontSize: 13,
                  color: "#4b5563",
                  marginBottom: 10,
                }}
              >
                {p.description}
              </Text>

              {/* Edit / Delete row */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Pressable
                  onPress={() => navigation.navigate("PostItem", { post: p })}
                >
                  <Text style={{ color: "#2563eb", fontWeight: "600" }}>
                    Edit
                  </Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(p.id)}>
                  <Text style={{ color: "#ef4444", fontWeight: "600" }}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  card: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
});
