// app/PostDetailScreen.tsx
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { auth, db } from "../firebaseConfig";

export default function PostDetailScreen({ route }: any) {
  const { post } = route.params;
  const currentUid = auth.currentUser?.uid;
  const isOwner = currentUid && currentUid === post.userId;

  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const expMs = post.expiresAt?.toMillis
    ? post.expiresAt.toMillis()
    : post.expiresAt;
  let remainingText = "";
  if (expMs) {
    const diff = expMs - nowMs;
    if (diff <= 0) {
      remainingText = "Expired";
    } else {
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      remainingText = `${mins}m ${secs}s left`;
    }
  }

  const handleRequest = async () => {
    if (!currentUid) {
      Alert.alert("Login required", "You must be logged in to send a request.");
      return;
    }
    if (isOwner) {
      Alert.alert("Not allowed", "You cannot request your own post.");
      return;
    }

    if (remainingText === "Expired") {
      Alert.alert("Expired", "This post has already expired.");
      return;
    }

    try {
      await addDoc(collection(db, "requests"), {
        postId: post.id,
        postOwnerId: post.userId,
        requesterId: currentUid,
        status: "pending",
        type: post.type,
        postTitle: post.title,
        createdAt: serverTimestamp(),
      });
      Alert.alert("Request sent", "The post owner will review your request.");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={styles.container}>
      {post.imageUrls && post.imageUrls.length > 0 && (
        <ScrollView
          horizontal
          style={{ marginBottom: 10 }}
          showsHorizontalScrollIndicator={false}
        >
          {post.imageUrls.slice(0, 3).map((uri: string) => (
            <Image
              key={uri}
              source={{ uri }}
              style={{
                width: 200,
                height: 200,
                marginRight: 10,
                borderRadius: 10,
              }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}

      {remainingText ? (
        <Text
          style={{
            fontSize: 14,
            color: remainingText === "Expired" ? "#cc0000" : "#007AFF",
            marginBottom: 8,
          }}
        >
          {remainingText}
        </Text>
      ) : null}

      <Text style={styles.title}>
        [{post.type === "need" ? "NEED" : "SELL"}] {post.title}
      </Text>
      <Text style={styles.text}>{post.description}</Text>
      {post.price ? <Text style={styles.text}>Price: {post.price}</Text> : null}
      <Text style={styles.text}>Posted by: {post.userEmail}</Text>

      {!isOwner && remainingText !== "Expired" && (
        <View style={{ marginTop: 20 }}>
          <Button title="Send request" onPress={handleRequest} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  text: { fontSize: 16, marginBottom: 8 },
});
