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


    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Chats</Text>
            <ScrollView>
                {conversations.map((c) => (
                    <Pressable
                        key={c.id}
                        style={styles.card}
                        onPress={() => navigation.navigate("ChatRoom", { conversation: c })}
                    >
                        <Text>{c.postId || c.requestId}</Text>
                    </Pressable>
                ))}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, padding: 20 },
    title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
    card: { padding: 16, borderRadius: 12, backgroundColor: "#fff", marginBottom: 10 },
});
