import { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function RequestsScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const q = query(
      collection(db, 'requests'),
      where('postOwnerId', '==', uid),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, snap => {
      const items: any[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setRequests(items);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'accepted' | 'rejected') => {
    await updateDoc(doc(db, 'requests', id), { status });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Requests for my posts</Text>

      {loading ? (
        <Text>Loading...</Text>
      ) : requests.length === 0 ? (
        <Text>No pending requests.</Text>
      ) : (
        requests.map(r => (
          <View key={r.id} style={styles.card}>
            <Text style={{ fontWeight: 'bold' }}>{r.postTitle || 'Post'}</Text>
            <Text>Type: {r.type}</Text>
            <Text>From user: {r.requesterId}</Text>

            <View style={styles.row}>
              <Button title="Accept" onPress={() => handleUpdateStatus(r.id, 'accepted')} />
              <Button title="Reject" color="#cc0000" onPress={() => handleUpdateStatus(r.id, 'rejected')} />
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  card: { marginTop: 15, padding: 15, borderWidth: 1, borderRadius: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
});
