import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { auth, db } from "../firebaseConfig";

export default function EditProfileScreen({ navigation }: any) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          Alert.alert("Error", "Not logged in.");
          navigation.goBack();
          return;
        }
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          const data = snap.data() as any;
          setFullName(data.fullName || "");
          setUsername(data.username || "");
        }
      } catch (e: any) {
        Alert.alert("Error", e.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigation]);

  const handleSave = async () => {
    if (!fullName.trim() || !username.trim()) {
      Alert.alert("Missing info", "Name and username are required.");
      return;
    }
    try {
      setSaving(true);
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Not logged in");

      await updateDoc(doc(db, "users", uid), {
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
      });

      Alert.alert("Saved", "Profile updated successfully.");
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit profile</Text>

      <Text style={styles.label}>Full name</Text>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        placeholder="Your name"
        placeholderTextColor="#9ca3af"
      />

      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholder="username"
        placeholderTextColor="#9ca3af"
      />

      <Pressable
        onPress={saving ? undefined : handleSave}
        style={[
          styles.saveButton,
          saving && { opacity: 0.7 },
        ]}
      >
        <Text style={styles.saveText}>
          {saving ? "Saving..." : "Save changes"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 24,
    color: "#111827",
  },
  label: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#f9fafb",
  },
  saveButton: {
    marginTop: 24,
    borderRadius: 999,
    backgroundColor: "#10b981",
    paddingVertical: 12,
    alignItems: "center",
  },
  saveText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});
