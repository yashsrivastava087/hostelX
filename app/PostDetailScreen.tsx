// app/PostDetailScreen.tsx
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../firebaseConfig";

export default function PostDetailScreen({ route }: any) {
  const { post } = route.params;
  const currentUid = auth.currentUser?.uid;
  const isOwner = currentUid && currentUid === post.userId;

  const [nowMs, setNowMs] = useState(Date.now());
  const [zoomImageUri, setZoomImageUri] = useState<string | null>(null);

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
      const totalMins = Math.floor(diff / 60000);
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;

      if (hours > 0) {
        remainingText = mins > 0 ? `${hours}h ${mins}m left` : `${hours}h left`;
      } else {
        remainingText = `${mins}m left`;
      }
    }
  }
  const [hasRequested, setHasRequested] = useState(false);

  useEffect(() => {
    if (!currentUid || !post?.id) return;

    const q = query(
      collection(db, "requests"),
      where("postId", "==", post.id),
      where("requesterId", "==", currentUid)
    );

    const unsub = onSnapshot(q, (snap) => {
      setHasRequested(!snap.empty);
    });

    return () => unsub();
  }, [currentUid, post?.id]);

  const handleRequest = async () => {
    if (hasRequested) {
      return;
    }

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
    <View style={styles.screen}>
      {/* Fullscreen zoom modal */}
      <Modal visible={!!zoomImageUri} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setZoomImageUri(null)}
          >
            {zoomImageUri && (
              <>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setZoomImageUri(null)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>

                <Image
                  source={{ uri: zoomImageUri }}
                  style={styles.zoomImage}
                  resizeMode="contain"
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image strip, like a mini gallery on top */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <ScrollView
            horizontal
            style={{ marginBottom: 16 }}
            showsHorizontalScrollIndicator={false}
          >
            {post.imageUrls.slice(0, 3).map((uri: string) => (
              <TouchableOpacity key={uri} onPress={() => setZoomImageUri(uri)}>
                <Image
                  source={{ uri }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Main white card */}
        <View style={styles.card}>
          {/* Top badge + timer */}
          <View style={styles.cardHeaderRow}>
            <View
              style={[
                styles.badge,
                post.type === "need" ? styles.badgeNeed : styles.badgeSell,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  post.type === "need"
                    ? styles.badgeTextNeed
                    : styles.badgeTextSell,
                ]}
              >
                {post.type === "need" ? "NEED" : "SELL"}
              </Text>
            </View>

            {remainingText ? (
              <Text
                style={[
                  styles.timerText,
                  remainingText === "Expired" && styles.timerExpired,
                ]}
              >
                {remainingText}
              </Text>
            ) : null}
          </View>

          {/* Title & description */}
          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.subtitle}>{post.description}</Text>

          {/* Price block */}
          {post.price ? (
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.priceValue}>₹{post.price}</Text>
            </View>
          ) : null}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Location + email row (simple icons) */}
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText}>
              {post.location || "Hostel"} {/* optional field */}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>✉️</Text>
            <Text style={styles.infoText}>{post.userEmail}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom primary button */}
      {!isOwner && remainingText !== "Expired" && (
        <View style={styles.bottomBar}>
          <Pressable
            style={[
              styles.primaryButton,
              hasRequested && { backgroundColor: "#d1d5db" },
            ]}
            onPress={hasRequested ? undefined : handleRequest}
          >
            <Text style={styles.primaryButtonIcon}>
              {hasRequested ? "✅" : "📨"}
            </Text>
            <Text style={styles.primaryButtonText}>
              {hasRequested ? "Request sent" : "Send Request"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scroll: {
    flex: 1,
  },

  // Card
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  // Badge
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeNeed: {
    backgroundColor: "#fff7e6",
  },
  badgeSell: {
    backgroundColor: "#e6fff4",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  badgeTextNeed: {
    color: "#b7791f",
  },
  badgeTextSell: {
    color: "#047857",
  },

  // Title, subtitle
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },

  // Price block
  priceBlock: {
    backgroundColor: "#f3f4f6",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginBottom: 16,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#4b5563",
  },

  timerText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#10b981",
  },
  timerExpired: {
    color: "#dc2626",
  },

  // Thumbnails
  thumbnail: {
    width: 200,
    height: 160,
    borderRadius: 16,
    marginRight: 10,
  },

  // Zoom modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomImage: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 2,
    padding: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    bottom: 40,
    paddingTop: 8,
    backgroundColor: "#f5f5f5",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#10b981",
  },
  primaryButtonIcon: {
    fontSize: 16,
    color: "#ffffff",
    marginRight: 8,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
