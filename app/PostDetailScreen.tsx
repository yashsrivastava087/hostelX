import { Button, Linking, StyleSheet, Text, View } from "react-native";
import { Alert } from 'react-native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';


export default function PostDetailScreen({ route }: any) {
  const { post } = route.params;
  const currentUid = auth.currentUser?.uid;
  const isOwner = currentUid && currentUid === post.userId;

  const handleRequest = async () => {
    if (!currentUid) {
      Alert.alert('Login required', 'You must be logged in to send a request.');
      return;
    }
    if (isOwner) {
      Alert.alert('Not allowed', 'You cannot request your own post.');
      return;
    }

    try {
      await addDoc(collection(db, 'requests'), {
        postId: post.id,
        postOwnerId: post.userId,
        requesterId: currentUid,
        status: 'pending',
        type: post.type,
        postTitle: post.title,
        createdAt: serverTimestamp(),
      });
      Alert.alert('Request sent', 'The post owner will review your request.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        [{post.type === 'need' ? 'NEED' : 'SELL'}] {post.title}
      </Text>
      <Text style={styles.text}>{post.description}</Text>
      {post.price ? <Text style={styles.text}>Price: {post.price}</Text> : null}
      <Text style={styles.text}>Posted by: {post.userEmail}</Text>

      {!isOwner && (
        <View style={{ marginTop: 20 }}>
          <Button title="Send request" onPress={handleRequest} />
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  text: { fontSize: 16, marginBottom: 8 },
});