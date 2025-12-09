import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { auth, db } from "../firebaseConfig";
import {
    collection,
    onSnapshot,
    query,
    where,
    orderBy,
    doc,
    getDoc,
} from "firebase/firestore";

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

                // load all unknown users in parallel
                (async () => {
                    try {
                        const allIds = new Set<string>();
                        items.forEach((c) =>
                            c.participantIds?.forEach((id: string) => allIds.add(id))
                        );

                        // determine which ids we still need to fetch
                        const missing = Array.from(allIds).filter((id) => !userNames[id]);

                        if (missing.length === 0) return;

                        const docs = await Promise.all(
                            missing.map((id) => getDoc(doc(db, "users", id)))
                        );

                        // build a map with results
                        const newEntries: Record<string, string> = {};
                        docs.forEach((snapDoc, idx) => {
                            const id = missing[idx];
                            if (snapDoc.exists()) {
                                const data = snapDoc.data() as any;
                                newEntries[id] =
                                    data.fullName || data.displayName || data.email || id;
                            } else {
                                newEntries[id] = id;
                            }
                        });

                        // merge into state using functional update (avoids stale closure)
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // you can include dependencies if you want to re-run when auth changes

    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Chats</Text>
            <ScrollView>
                {conversations.map((c) => {
                    const uid = auth.currentUser?.uid;
                    const otherUserId = c.participantIds?.find(
                        (id: string) => id !== uid
                    );
                    const otherUserName = otherUserId
                        ? userNames[otherUserId] || ""
                        : "";


                    const myUnread = c.unreadCounts?.[uid] || 0;

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
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                {/* Avatar */}
                                <View
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor: "#4f46e5",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        marginRight: 12,
                                    }}
                                >
                                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                                        {otherUserName?.charAt(0) || "?"}
                                    </Text>
                                </View>

                                {/* Middle content */}
                                <View style={{ flex: 1 }}>
                                    <View
                                        style={{ flexDirection: "row", justifyContent: "space-between" }}
                                    >
                                        <Text style={{ fontWeight: "600", fontSize: 15 }}>
                                            {otherUserName || "User"}
                                        </Text>
                                        <Text style={{ color: "#9ca3af", fontSize: 12 }}>
                                            {/* for now, simple time placeholder */}
                                            {c.lastMessageAt ? "·" : ""}
                                        </Text>
                                    </View>

                                    <Text
                                        style={{ color: "#6b7280", marginTop: 2, fontSize: 13 }}
                                        numberOfLines={1}
                                    >
                                        {c.postTitle}
                                    </Text>

                                    {c.lastMessage && (
                                        <Text
                                            style={{
                                                marginTop: 4,
                                                fontSize: 13,
                                                fontWeight: myUnread > 0 ? "600" : "400",
                                                color: "#111827",
                                            }}
                                            numberOfLines={1}
                                        >
                                            {c.lastMessage}
                                        </Text>
                                    )}
                                </View>

                                {/* Unread dot */}
                                {myUnread > 0 && (
                                    <View
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: 4,
                                            backgroundColor: "#2563eb",
                                            marginLeft: 8,
                                        }}
                                    />
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
    screen: { flex: 1, padding: 20 },
    title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
    card: { padding: 16, borderRadius: 12, backgroundColor: "#fff", marginBottom: 10 },
});
