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
  Image,
  Pressable,
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

  const handleRemoveImage = (uriToRemove: string) => {
    setImages((prev) => prev.filter((u) => u !== uriToRemove));
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
        // keep existing Cloudinary URLs when editing
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
      <Text style={styles.headerText}>
        {editingPost ? "Edit Post" : "Post New Request"}
      </Text>

      {/* Need / Sell toggle */}
      <View style={styles.segmentContainer}>
        <Pressable
          onPress={() => setType("need")}
          style={[
            styles.segmentButton,
            type === "need" && styles.segmentButtonActive,
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              type === "need" && styles.segmentTextActive,
            ]}
          >
            Need
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setType("sell")}
          style={[
            styles.segmentButton,
            type === "sell" && styles.segmentButtonActive,
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              type === "sell" && styles.segmentTextActive,
            ]}
          >
            Sell
          </Text>
        </Pressable>
      </View>

      {/* Title */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          placeholder="What do you need or want to sell?"
          placeholderTextColor="#9ca3af"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
      </View>

      {/* Description */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          placeholder="Add details so others know exactly what you mean"
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textArea]}
          multiline
        />
      </View>

      {/* Price */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Price (optional)</Text>
        <View style={styles.priceRow}>
          <Text style={styles.currency}>₹</Text>
          <TextInput
            placeholder="0"
            placeholderTextColor="#9ca3af"
            value={price}
            onChangeText={setPrice}
            style={[styles.input, styles.priceInput]}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Duration */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Expires in</Text>
        <View style={styles.durationRow}>
          <Pressable
            onPress={() => setDurationMinutes(30)}
            style={[
              styles.durationPill,
              durationMinutes === 30 && styles.durationPillActive,
            ]}
          >
            <Text
              style={[
                styles.durationText,
                durationMinutes === 30 && styles.durationTextActive,
              ]}
            >
              30 min
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setDurationMinutes(60)}
            style={[
              styles.durationPill,
              durationMinutes === 60 && styles.durationPillActive,
            ]}
          >
            <Text
              style={[
                styles.durationText,
                durationMinutes === 60 && styles.durationTextActive,
              ]}
            >
              1 hr
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setDurationMinutes(120)}
            style={[
              styles.durationPill,
              durationMinutes === 120 && styles.durationPillActive,
            ]}
          >
            <Text
              style={[
                styles.durationText,
                durationMinutes === 120 && styles.durationTextActive,
              ]}
            >
              2 hr
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Images */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Images (up to 3)</Text>
        <Pressable style={styles.addImageButton} onPress={handlePickImages}>
          <Text style={styles.addImageText}>+ Add images</Text>
        </Pressable>
        <ScrollView horizontal style={{ marginTop: 10 }}>
          {images.map((uri) => (
            <View key={uri} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.image} />
              <Pressable
                style={styles.removeBadge}
                onPress={() => handleRemoveImage(uri)}
              >
                <Text style={styles.removeBadgeText}>×</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Submit */}
      <Pressable style={styles.primaryButton} onPress={handleSubmit}>
        <Text style={styles.primaryButtonText}>
          {editingPost ? "Save Changes" : "Post Item"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f3f4f6",
  },
  headerText: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    color: "#111827",
  },
  fieldContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    fontSize: 14,
    color: "#111827",
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    padding: 4,
    marginBottom: 18,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentButtonActive: {
    backgroundColor: "#10b981",
  },
  segmentText: {
    fontSize: 14,
    color: "#4b5563",
    fontWeight: "500",
  },
  segmentTextActive: {
    color: "#ffffff",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  currency: {
    marginRight: 6,
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "600",
  },
  priceInput: {
    flex: 1,
  },
  durationRow: {
    flexDirection: "row",
    gap: 8,
  },
  durationPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  durationPillActive: {
    backgroundColor: "#dbeafe",
    borderColor: "#10b981",
  },
  durationText: {
    fontSize: 13,
    color: "#4b5563",
  },
  durationTextActive: {
    color: "#10b981",
    fontWeight: "600",
  },
  addImageButton: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
    alignItems: "center",
  },
  addImageText: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "500",
  },
  imageWrapper: {
    marginRight: 10,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 10,
  },
  removeBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  removeBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  primaryButton: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#10b981",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});
