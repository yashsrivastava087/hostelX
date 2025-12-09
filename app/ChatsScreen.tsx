import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { auth, db } from "../firebaseConfig";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";

export default function ChatsScreen({ navigation }: any) {
    const [conversations, setConversations] = useState<any[]>([]);


    useEffect(() => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const q = query(
            collection(db, "conversations"),
            where("participantIds", "array-contains", uid),
            orderBy("lastMessageAt", "desc")
        );

        const unsub = onSnapshot(q, (snap) => {
            const items: any[] = [];
            snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
            setConversations(items);
        });

        return () => unsub();
    }, []);
    const uid = auth.currentUser?.uid;
    return (
        <View style={styles.screen}>

            <Text style={styles.title}>Chats</Text>
            <ScrollView>
                {conversations.map((c) => {
                    const uid = auth.currentUser?.uid;
                    const otherUserId = c.participantIds.find((id: string) => id !== uid);
                    const myUnread = c.unreadCounts?.[uid] || 0;

                    return (
                        <Pressable
                            key={c.id}
                            style={styles.card}
                            onPress={() => navigation.navigate("ChatRoom", { conversation: c })}
                        >
                            {/* Top row: post title + unread dot */}
                            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                <Text style={{ fontWeight: "600", fontSize: 15 }}>
                                    {c.postTitle || "Chat"}
                                </Text>
                                {myUnread > 0 && (
                                    <View
                                        style={{
                                            minWidth: 20,
                                            paddingHorizontal: 6,
                                            paddingVertical: 2,
                                            borderRadius: 999,
                                            backgroundColor: "#10b981",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text style={{ color: "#fff", fontSize: 11 }}>{myUnread}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Other user */}
                            <Text style={{ color: "#6b7280", marginTop: 2 }} numberOfLines={1}>
                                With: {otherUserId}
                            </Text>

                            {/* Last message */}
                            {c.lastMessage && (
                                <Text
                                    style={{ color: "#9ca3af", marginTop: 4, fontSize: 13 }}
                                    numberOfLines={1}
                                >
                                    {c.lastMessage}
                                </Text>
                            )}
                        </Pressable>
                    );
                })}




            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, padding: 20 },
    title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
    card: { padding: 16, borderRadius: 12, backgroundColor: "#fff", marginBottom: 10 },
});
