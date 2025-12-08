// app/RequestsScreen.tsx
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
  addDoc,
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

export default function RequestsScreen() {
  const navigation = useNavigation<any>();
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"incoming" | "outgoing">("incoming");

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Incoming: requests on my posts
    const qIncoming = query(
      collection(db, "requests"),
      where("postOwnerId", "==", uid),
      orderBy("createdAt", "desc")
    );

    // Outgoing: requests I have sent
    const qOutgoing = query(
      collection(db, "requests"),
      where("requesterId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsubIncoming = onSnapshot(qIncoming, (snap) => {
      const items: any[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setIncoming(items);
      setLoading(false);
    });

    const unsubOutgoing = onSnapshot(qOutgoing, (snap) => {
      const items: any[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setOutgoing(items);
      setLoading(false);
    });

    return () => {
      unsubIncoming();
      unsubOutgoing();
    };
  }, []);

  const handleUpdateStatus = async (
    request: any,
    status: "accepted" | "rejected"
  ) => {
    await updateDoc(doc(db, "requests", request.id), { status });

    if (status === "accepted") {
      await addDoc(collection(db, "conversations"), {
        participantIds: [request.postOwnerId, request.requesterId],
        postId: request.postId,
        requestId: request.id,
        status: "active",
        createdAt: serverTimestamp(),
        lastMessage: null,
        lastMessageAt: null,
      });
    }
  };

  const list = mode === "incoming" ? incoming : outgoing;
  const handleOpenPost = async (postId: string) => {
    try {
      const postDoc = await getDoc(doc(db, "posts", postId));
      if (!postDoc.exists()) {
        Alert.alert("Post not found", "This post may have been removed.");
        return;
      }
      const post = { id: postDoc.id, ...postDoc.data() };
      navigation.navigate("PostDetail", { post });
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Requests</Text>

        {/* Filter chips */}
        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setMode("incoming")}
            style={[
              styles.modeChip,
              mode === "incoming" && styles.modeChipActive,
            ]}
          >
            <Text
              style={[
                styles.modeChipText,
                mode === "incoming" && styles.modeChipTextActive,
              ]}
            >
              Incoming
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("outgoing")}
            style={[
              styles.modeChip,
              mode === "outgoing" && styles.modeChipActive,
            ]}
          >
            <Text
              style={[
                styles.modeChipText,
                mode === "outgoing" && styles.modeChipTextActive,
              ]}
            >
              Outgoing
            </Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text>Loading...</Text>
        </View>
      ) : list.length === 0 ? (
        <View style={styles.center}>
          <Text>
            {mode === "incoming"
              ? "No requests for your posts."
              : "You haven't sent any requests."}
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {list.map((r) => {
            const isPending = r.status === "pending";
            const isAccepted = r.status === "accepted";
            const isRejected = r.status === "rejected";

            return (
              <Pressable
                key={r.id}
                style={styles.card}
                onPress={() => handleOpenPost(r.postId)}
              >
                {/* Top row: badge + status */}
                <View style={styles.cardTopRow}>
                  <View
                    style={[
                      styles.typeBadge,
                      r.type === "sell"
                        ? styles.typeBadgeSell
                        : styles.typeBadgeNeed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        r.type === "sell"
                          ? styles.typeBadgeTextSell
                          : styles.typeBadgeTextNeed,
                      ]}
                    >
                      {r.type === "sell" ? "SELL" : "NEED"}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isAccepted && { backgroundColor: "#dcfce7" },
                      isRejected && { backgroundColor: "#fee2e2" },
                      isPending && { backgroundColor: "#fef9c3" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isAccepted && { color: "#166534" },
                        isRejected && { color: "#b91c1c" },
                        isPending && { color: "#92400e" },
                      ]}
                    >
                      {r.status?.toUpperCase() || "PENDING"}
                    </Text>
                  </View>
                </View>

                {/* Title */}
                <Text style={styles.cardTitle}>
                  {r.postTitle || "Post request"}
                </Text>

                {/* Who from / to */}
                {mode === "incoming" ? (
                  <Text style={styles.cardSubText}>
                    From user: {r.requesterId}
                  </Text>
                ) : (
                  <Text style={styles.cardSubText}>
                    To owner: {r.postOwnerId}
                  </Text>
                )}

                {/* Buttons only for incoming & pending */}
                {mode === "incoming" && isPending && (
                  <View style={styles.actionsRow}>
                    <Pressable
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleUpdateStatus(r, "accepted")}
                    >
                      <Text style={styles.actionButtonText}>Accept</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleUpdateStatus(r, "rejected")}
                    >
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </Pressable>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  modeRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  modeChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 8,
  },
  modeChipActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  modeChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4b5563",
  },
  modeChipTextActive: {
    color: "#ffffff",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typeBadgeSell: {
    backgroundColor: "#d1fae5",
  },
  typeBadgeNeed: {
    backgroundColor: "#fef3c7",
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  typeBadgeTextSell: {
    color: "#047857",
  },
  typeBadgeTextNeed: {
    color: "#b45309",
  },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  cardSubText: {
    fontSize: 13,
    color: "#6b7280",
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: "#10b981",
  },
  rejectButton: {
    backgroundColor: "#ef4444",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
});
