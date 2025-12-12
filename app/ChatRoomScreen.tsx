// app/ChatRoomScreen.tsx
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth, db } from "../firebaseConfig";

export default function ChatRoomScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { conversation } = route.params;
  const conversationId = conversation.id;

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  const uid = auth.currentUser?.uid;
  const otherUserId = conversation.participantIds.find(
    (id: string) => id !== uid
  );
  const otherUserName = conversation.otherUserName || "User";
  const postTitle = conversation.postTitle || "Chat";

  // Set header: name + item subtitle
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View>
          <Text style={{ fontWeight: "700", fontSize: 16 }}>
            {otherUserName}
          </Text>
          <Text style={{ color: "#6b7280", fontSize: 12 }} numberOfLines={1}>
            {postTitle}
          </Text>
        </View>
      ),
    });
  }, [navigation, otherUserName, postTitle]);

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

  // Format like: Mon, 4 at 4:59 PM (no month name)
  const formatFullTime = (d: Date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayName = days[d.getDay()];
    const day = d.getDate();

    let hh = d.getHours();
    const mm = d.getMinutes().toString().padStart(2, "0");
    const ampm = hh >= 12 ? "PM" : "AM";
    const hour12 = ((hh + 11) % 12) + 1;

    return `${dayName}, ${day} at ${hour12}:${mm} ${ampm}`;
  };

  // Build list with time separators, grouping messages within 5 minutes
  const renderItems: {
    type: "time" | "msg";
    id: string;
    data?: any;
    text?: string;
  }[] = [];

  let lastSectionTime: Date | null = null;

  messages.forEach((m) => {
    const d = m.createdAt?.toDate ? (m.createdAt.toDate() as Date) : null;

    if (d) {
      const shouldStartNewSection =
        !lastSectionTime ||
        d.getTime() - lastSectionTime.getTime() > 30 * 60 * 1000; // > 5 minutes

      if (shouldStartNewSection) {
        renderItems.push({
          type: "time",
          id: `time-${m.id}`,
          text: formatFullTime(d),
        });
        lastSectionTime = d;
      }
    }

    renderItems.push({ type: "msg", id: m.id, data: m });
  });

  const handleSend = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !text.trim()) return;

    const messageText = text.trim();

    await addDoc(collection(db, "conversations", conversationId, "messages"), {
      text: messageText,
      senderId: uid,
      createdAt: serverTimestamp(),
    });

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
  };

  return (
    <View style={styles.screen}>
      {/* Messages */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 8 }}>
        {renderItems.map((item) => {
          if (item.type === "time") {
            return (
              <View
                key={item.id}
                style={{ alignItems: "center", marginVertical: 8 }}
              >
                <Text style={{ fontSize: 11, color: "#9ca3af" }}>
                  {item.text}
                </Text>
              </View>
            );
          }

          const m = item.data;
          const isMe = m.senderId === uid;

          return (
            <View key={item.id} style={{ marginVertical: 4 }}>
              <View
                style={{
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  backgroundColor: isMe ? "#10b981" : "#e5e7eb",
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 18,
                  maxWidth: "80%",
                  borderBottomRightRadius: isMe ? 4 : 18,
                  borderBottomLeftRadius: isMe ? 18 : 4,
                }}
              >
                <Text
                  style={{
                    color: isMe ? "#fff" : "#111827",
                    fontSize: 14,
                  }}
                >
                  {m.text}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Input */}
      <View style={{ flexDirection: "row", paddingTop: 8 }}>
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            padding: 8,
            borderRadius: 12,
            backgroundColor: "#fff",
          }}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
        />
        <Pressable
          style={{
            padding: 10,
            backgroundColor: "#10b981",
            marginLeft: 8,
            borderRadius: 999,
          }}
          onPress={handleSend}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    paddingBottom: 20,
    backgroundColor: "#f5f5f5",
  },
});
