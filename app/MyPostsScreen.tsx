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
import { Button, Pressable, StyleSheet, Text, View } from "react-native";
import { auth, db } from "../firebaseConfig";

export default function MyPostsScreen({ navigation }: any) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "posts", id));
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
        posts.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => navigation.navigate("PostItem", { post: p })} // EDIT
            style={styles.card}
          >
            <Text style={{ fontWeight: "bold" }}>
              [{p.type === "need" ? "NEED" : "SELL"}] {p.title}
            </Text>
            <Text>{p.description}</Text>
            <Button title="Delete" onPress={() => handleDelete(p.id)} />
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  card: { marginTop: 15, padding: 15, borderWidth: 1, borderRadius: 10 },
});
