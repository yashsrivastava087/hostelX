// app/PostItemScreen.tsx
import * as ImagePicker from "expo-image-picker";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} from "../cloudinaryConfig";
import { auth, db } from "../firebaseConfig";

export default function PostItemScreen({ route, navigation }: any) {
  const [durationMinutes, setDurationMinutes] = useState<30 | 60 | 120>(30);

  const editingPost = route?.params?.post;
  const [images, setImages] = useState<string[]>(editingPost?.imageUrls ?? []);
  const [type, setType] = useState(editingPost?.type ?? "need");
  const [title, setTitle] = useState(editingPost?.title ?? "");
  const [description, setDescription] = useState(
    editingPost?.description ?? ""
  );
  const [price, setPrice] = useState(editingPost?.price ?? "");

  const handlePickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "We need access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (result.canceled) return;

    const uris = result.assets.map((a) => a.uri);

    setImages((prev) => {
      const combined = [...prev, ...uris];
      if (combined.length > 3) {
        Alert.alert("Limit reached", "You can upload at most 3 images.");
      }
      return combined.slice(0, 3);
    });
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Missing info", "Title and description are required.");
      return;
    }
    if (!type) {
      Alert.alert("Missing info", "Please choose Need or Sell.");
      return;
    }

    const priceValue = price.toString().trim() ? Number(price) : null;
    if (price.toString().trim() && isNaN(priceValue as number)) {
      Alert.alert("Invalid price", "Price must be a number.");
      return;
    }

    try {
      const imageUrls: string[] = [];

      for (const uri of images) {
        if (uri.startsWith("https://res.cloudinary.com")) {
          imageUrls.push(uri);
          continue;
        }

        const data = new FormData();
        data.append("file", {
          uri,
          type: "image/jpeg",
          name: "upload.jpg",
        } as any);
        data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: data,
          }
        );

        const json = await res.json();
        if (!json.secure_url) {
          console.log("Cloudinary error", json);
          throw new Error("Failed to upload image");
        }

        imageUrls.push(json.secure_url);
      }

      const now = Date.now();
      const expiresAt = new Date(now + durationMinutes * 60 * 1000);

      if (editingPost) {
        await updateDoc(doc(db, "posts", editingPost.id), {
          type,
          title: title.trim(),
          description: description.trim(),
          price: priceValue,
          imageUrls,
          expiresAt,
        });
        Alert.alert("Updated", "Post updated successfully");
      } else {
        await addDoc(collection(db, "posts"), {
          type,
          title: title.trim(),
          description: description.trim(),
          price: priceValue,
          imageUrls,
          userId: auth.currentUser?.uid,
          userEmail: auth.currentUser?.email,
          createdAt: serverTimestamp(),
          expiresAt,
        });
        Alert.alert("Posted", "Your request has been posted");
      }

      navigation.goBack();
    } catch (e: any) {
      console.log("Upload error", e);
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {editingPost ? "Edit Post" : "Post New Request"}
      </Text>

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

      <View style={{ flexDirection: "row", marginBottom: 10 }}>
        <View style={{ flex: 1, marginRight: 5 }}>
          <Button
            title={durationMinutes === 30 ? "✓ 30 min" : "30 min"}
            onPress={() => setDurationMinutes(30)}
            color={durationMinutes === 30 ? "#007AFF" : "#999"}
          />
        </View>
        <View style={{ flex: 1, marginHorizontal: 5 }}>
          <Button
            title={durationMinutes === 60 ? "✓ 1 hr" : "1 hr"}
            onPress={() => setDurationMinutes(60)}
            color={durationMinutes === 60 ? "#007AFF" : "#999"}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 5 }}>
          <Button
            title={durationMinutes === 120 ? "✓ 2 hr" : "2 hr"}
            onPress={() => setDurationMinutes(120)}
            color={durationMinutes === 120 ? "#007AFF" : "#999"}
          />
        </View>
      </View>

      <View style={{ marginVertical: 10 }}>
        <Button title="Add images" onPress={handlePickImages} />
        <ScrollView horizontal style={{ marginTop: 10 }}>
          {images.map((uri) => (
            <Image
              key={uri}
              source={{ uri }}
              style={{ width: 80, height: 80, marginRight: 8, borderRadius: 8 }}
            />
          ))}
        </ScrollView>
      </View>

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
