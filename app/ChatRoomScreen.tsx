import { useRoute } from "@react-navigation/native";
import { View, Text, StyleSheet } from "react-native";
import { Pressable } from "react-native";
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { TextInput } from "react-native";
import { ScrollView } from "react-native";


export default function ChatRoomScreen() {
    const route = useRoute<any>();
    const { conversation } = route.params;
    const conversationId = conversation.id;
    console.log("ChatRoom for:", conversationId);
    const [messages, setMessages] = useState<any[]>([]);
    const [text, setText] = useState("");

    useEffect(() => {
        const q = query(
            collection(db, "conversations", conversationId, "messages"),
            orderBy("createdAt", "asc")
        );

        const unsub = onSnapshot(q, snap => {
            const items: any[] = [];
            snap.forEach(d => items.push({ id: d.id, ...d.data() }));
            setMessages(items);
        });

        return () => unsub();
    }, [conversationId]);

    const uid = auth.currentUser?.uid;

    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Chat</Text>
            <ScrollView style={{ flex: 1 }}>


                {messages.map(m => {
                    const isMe = m.senderId === uid;
                    return (
                        <View
                            key={m.id}
                            style={{
                                alignSelf: isMe ? "flex-end" : "flex-start",
                                backgroundColor: isMe ? "#10b981" : "#e5e7eb",
                                padding: 8,
                                borderRadius: 12,
                                marginVertical: 4,
                                maxWidth: "80%",
                            }}
                        >
                            <Text style={{ color: isMe ? "#fff" : "#111827" }}>{m.text}</Text>
                        </View>
                    );
                })}

            </ScrollView>

            <View style={{ flexDirection: "row", paddingTop: 8 }}>
                <TextInput
                    style={{ flex: 1, borderWidth: 1, padding: 8 }}
                    value={text}
                    onChangeText={setText}
                    placeholder="Type a message..."
                />
                <Pressable
                    style={{ padding: 10, backgroundColor: "#10b981", marginLeft: 8 }}
                    onPress={async () => {
                        const uid = auth.currentUser?.uid;
                        if (!uid || !text.trim()) return;
                        await addDoc(collection(db, "conversations", conversationId, "messages"), {
                            text: text.trim(),
                            senderId: uid,
                            createdAt: serverTimestamp(),
                        });
                        setText("");
                    }}
                >
                    <Text style={{ color: "#fff" }}>Send</Text>
                </Pressable>
            </View>
        </View>
    );

}

const styles = StyleSheet.create({
    screen: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
    title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
});
