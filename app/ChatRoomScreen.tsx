import { useRoute } from "@react-navigation/native";
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable } from "react-native";
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

export default function ChatRoomScreen() {
  const route = useRoute<any>();
  const { conversation } = route.params;
  const conversationId = conversation.id;
  console.log("ChatRoom for:", conversationId);

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  const uid = auth.currentUser?.uid;
  const otherUserId = conversation.participantIds.find((id: string) => id !== uid);
  // we pass otherUserName from ChatsScreen when navigating
  const otherUserName = conversation.otherUserName || "User";
  const postTitle = conversation.postTitle || "Chat";

  // mark my messages as read on open
  useEffect(() => {
    const markRead = async () => {
      if (!uid) return;
      const convoRef = doc(db, "conversations", conversationId);
      await updateDoc(convoRef, {
        [`unreadCounts.${uid}`]: 0,
      });
    };
    markRead();
  }, [conversationId, uid]);

  // subscribe to messages
  useEffect(() => {
    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const items: any[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setMessages(items);
    });

    return () => unsub();
  }, [conversationId]);

  return (
    <View style={styles.screen}>
      {/* Header with avatar + name + post title */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={{ color: "#fff", fontWeight: "600"  }}>
            {otherUserName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", fontSize: 16 }}>{otherUserName}</Text>
          <Text style={{ color: "#6b7280", fontSize: 13 }} numberOfLines={1}>
            {postTitle}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 8 }}>
        {messages.map((m) => {
          const isMe = m.senderId === uid;
          const time =
            m.createdAt?.toDate
              ? m.createdAt.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

          return (
            <View key={m.id} style={{ marginVertical: 4 }}>
              <View
                style={{
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  backgroundColor: isMe ? "#10b981" : "#e5e7eb", // your original colors
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 18,
                  maxWidth: "80%",
                  borderBottomRightRadius: isMe ? 4 : 18,
                  borderBottomLeftRadius: isMe ? 18 : 4,
                }}
              >
                <Text
                  style={{ color: isMe ? "#fff" : "#111827", fontSize: 14 }}
                >
                  {m.text}
                </Text>
              </View>
              {time ? (
                <Text
                  style={{
                    fontSize: 10,
                    color: "#9ca3af",
                    alignSelf: isMe ? "flex-end" : "flex-start",
                    marginTop: 2,
                    marginHorizontal: 4,
                  }}
                >
                  {time}
                </Text>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* Input */}
      <View style={{ flexDirection: "row", paddingTop: 8 }}>
        <TextInput
          style={{ flex: 1, borderWidth: 1, borderColor: "#e5e7eb", padding: 8, borderRadius: 12, backgroundColor: "#fff" }}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
        />
        <Pressable
          style={{ padding: 10, backgroundColor: "#10b981", marginLeft: 8, borderRadius: 999 }}
          onPress={async () => {
            const uid = auth.currentUser?.uid;
            if (!uid || !text.trim()) return;

            const messageText = text.trim();

            await addDoc(
              collection(db, "conversations", conversationId, "messages"),
              {
                text: messageText,
                senderId: uid,
                createdAt: serverTimestamp(),
              }
            );

            const convoRef = doc(db, "conversations", conversationId);

            await updateDoc(convoRef, {
              lastMessage: messageText,
              lastMessageAt: serverTimestamp(),
              [`unreadCounts.${uid}`]: 0,
              ...(otherUserId && {
                [`unreadCounts.${otherUserId}`]:
                  (conversation.unreadCounts?.[otherUserId] || 0) + 1,
              }),
            });

            setText("");
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, paddingBottom: 20, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
});
