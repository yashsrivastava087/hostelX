// app/ChatsScreen.tsx
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { auth, db } from "../firebaseConfig";

export default function ChatsScreen({ navigation }: any) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const q = query(
      collection(db, "conversations"),
      where("participantIds", "array-contains", uid),
      orderBy("lastMessageAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: any[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setConversations(items);

        (async () => {
          try {
            const allIds = new Set<string>();
            items.forEach((c) =>
              c.participantIds?.forEach((id: string) => allIds.add(id))
            );
            const missing = Array.from(allIds).filter((id) => !userNames[id]);
            if (missing.length === 0) return;

            const docs = await Promise.all(
              missing.map((id) => getDoc(doc(db, "users", id)))
            );
            const newEntries: Record<string, string> = {};
            docs.forEach((snapDoc, idx) => {
              const id = missing[idx];
              if (snapDoc.exists()) {
                const data = snapDoc.data() as any;
                newEntries[id] =
                  data.fullName || data.displayName || data.username || id;
              } else {
                newEntries[id] = id;
              }
            });
            setUserNames((prev) => ({ ...prev, ...newEntries }));
          } catch (err) {
            console.error("Failed to load user profiles:", err);
          }
        })();
      },
      (err) => {
        console.error("conversations onSnapshot error:", err);
      }
    );

    return () => unsub();
  }, []);

  const formatTime = (ts: any) => {
    if (!ts?.toDate) return "";
    const d = ts.toDate() as Date;
    const hh = d.getHours();
    const mm = d.getMinutes().toString().padStart(2, "0");
    const ampm = hh >= 12 ? "PM" : "AM";
    const hour12 = ((hh + 11) % 12) + 1;
    return `${hour12}:${mm} ${ampm}`;
  };

  const uid = auth.currentUser?.uid;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Chats</Text>
      <ScrollView>
        {conversations.map((c) => {
          const otherUserId = c.participantIds?.find(
            (id: string) => id !== uid
          );
          const otherUserName = otherUserId ? userNames[otherUserId] || "" : "";

          const myUnread = c.unreadCounts?.[uid || ""] || 0;
          const lastTime = c.lastMessage ? formatTime(c.lastMessageAt) : "";

          return (
            <Pressable
              key={c.id}
              style={styles.card}
              onPress={() =>
                navigation.navigate("ChatRoom", {
                  conversation: { ...c, otherUserName },
                })
              }
            >
              <View style={styles.row}>
                {/* Avatar */}
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {otherUserName?.charAt(0)?.toUpperCase() || "?"}
                  </Text>
                </View>

                {/* Middle */}
                <View style={styles.middle}>
                  <View style={styles.topRow}>
                    <Text
                      style={[
                        styles.nameText,
                        myUnread > 0 && styles.nameTextUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {otherUserName || "User"}
                    </Text>

                    {/* time only for last message */}
                    {lastTime ? (
                      <Text style={styles.timeText}>{lastTime}</Text>
                    ) : null}
                  </View>

                  {/* Post title (subtle, like preview line) */}
                  {c.postTitle ? (
                    <Text style={styles.postTitle} numberOfLines={1}>
                      {c.postTitle}
                    </Text>
                  ) : null}

                  {/* Last message preview */}
                  {c.lastMessage && (
                    <Text
                      style={[
                        styles.lastMessage,
                        myUnread > 0 && styles.lastMessageUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {c.lastMessage}
                    </Text>
                  )}
                </View>

                {/* Unread badge (like iMessage dot) */}
                {myUnread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {myUnread > 9 ? "9+" : myUnread}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: "#f3f4f6" },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111827",
  },

  card: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 18,
  },

  middle: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nameText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    maxWidth: "70%",
  },
  nameTextUnread: {
    color: "#000000",
  },
  timeText: {
    fontSize: 11,
    color: "#9ca3af",
  },

  postTitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#6b7280",
  },
  lastMessage: {
    marginTop: 3,
    fontSize: 13,
    color: "#4b5563",
  },
  lastMessageUnread: {
    fontWeight: "600",
    color: "#111827",
  },

  unreadBadge: {
    minWidth: 20,
    paddingHorizontal: 6,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
});
