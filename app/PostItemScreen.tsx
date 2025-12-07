import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { auth, db } from "../firebaseConfig";

export default function PostItemScreen({ route, navigation }: any) {
  const editingPost = route?.params?.post;

  const [type, setType] = useState(editingPost?.type ?? "need");
  const [title, setTitle] = useState(editingPost?.title ?? "");
  const [description, setDescription] = useState(
    editingPost?.description ?? ""
  );
  const [price, setPrice] = useState(editingPost?.price ?? "");

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing info', 'Title and description are required.');
      return;
    }
    if (!type) {
      Alert.alert('Missing info', 'Please choose Need or Sell.');
      return;
    }

    const priceValue = price.toString().trim()
      ? Number(price)
      : null;
    if (price.toString().trim() && isNaN(priceValue as number)) {
      Alert.alert('Invalid price', 'Price must be a number.');
      return;
    }

    try {
      if (editingPost) {
        await updateDoc(doc(db, 'posts', editingPost.id), {
          type,
          title: title.trim(),
          description: description.trim(),
          price: priceValue,
        });
        Alert.alert('Updated', 'Post updated successfully');
      } else {
        await addDoc(collection(db, 'posts'), {
          type,
          title: title.trim(),
          description: description.trim(),
          price: priceValue,
          userId: auth.currentUser?.uid,
          userEmail: auth.currentUser?.email,
          createdAt: serverTimestamp(),
        });
        Alert.alert('Posted', 'Your request has been posted');
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {editingPost ? "Edit Post" : "Post New Request"}
      </Text>

      {/* very simple type toggle */}

      <View style={{ flexDirection: "row", marginBottom: 10 }}>
        <View style={{ flex: 1, marginRight: 5 }}>
          <Button
            title={type === "need" ? "✓ Need" : "Need"}
            onPress={() => setType("need")}
            color={type === "need" ? "#007AFF" : "#999"}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 5 }}>
          <Button
            title={type === "sell" ? "✓ Sell" : "Sell"}
            onPress={() => setType("sell")}
            color={type === "sell" ? "#007AFF" : "#999"}
          />
        </View>
      </View>

      <TextInput
        placeholder="Title"
        placeholderTextColor="#585858ff"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <TextInput
        placeholder="Description"
        placeholderTextColor="#585858ff"
        value={description}
        onChangeText={setDescription}
        style={[styles.input, { height: 80 }]}
        multiline
      />
      <TextInput
        placeholder="Price (optional)"
        placeholderTextColor="#585858ff"
        value={price}
        onChangeText={setPrice}
        style={styles.input}
        keyboardType="numeric"
      />

      <Button
        title={editingPost ? "Save Changes" : "Post Item"}
        onPress={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
});