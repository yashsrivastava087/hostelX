// app/EditProfileScreen.tsx
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { auth, db } from "../firebaseConfig";

export default function EditProfileScreen({ navigation }: any) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
          setEmail(
            data.collegeEmail || data.personalEmail || auth.currentUser?.email || ""
          );
          setPhone(data.phone || "");
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
      Alert.alert("Missing info", "Full name and username are required.");
      return;
    }
    try {
      setSaving(true);
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Not logged in");

      await updateDoc(doc(db, "users", uid), {
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        phone: phone.trim(),
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
      <View style={styles.center}>
        <ActivityIndicator color="#10b981" />
      </View>
    );
  }

  const initials =
    fullName.trim() !== ""
      ? fullName
          .trim()
          .split(" ")
          .map((p) => p.charAt(0).toUpperCase())
          .slice(0, 2)
          .join("")
      : "U";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.container}>
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <Pressable
            style={styles.avatarCamera}
            onPress={() => Alert.alert("Coming soon", "Profile photo upload later.")}
          >
            <Text style={{ fontSize: 14 }}>📷</Text>
          </Pressable>
        </View>
        <Text style={styles.avatarHint}>Tap to change photo</Text>

        {/* Full name */}
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Full name"
          placeholderTextColor="#9ca3af"
        />

        {/* Username */}
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          autoCapitalize="none"
          placeholderTextColor="#9ca3af"
        />

        {/* Email (read‑only) */}
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={[styles.input, { backgroundColor: "#f3f4f6", color: "#6b7280" }]}
          value={email}
          editable={false}
        />

        {/* Phone */}
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+91 9876543210"
          keyboardType="phone-pad"
          placeholderTextColor="#9ca3af"
        />

        {/* Buttons */}
        <Pressable
          onPress={saving ? undefined : handleSave}
          style={[
            styles.saveButton,
            saving && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.saveText}>
            {saving ? "Saving..." : "Save Changes"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.goBack()}
          style={{ marginTop: 12, alignItems: "center" }}
        >
          <Text style={{ color: "#6b7280", fontSize: 14 }}>Cancel</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    backgroundColor: "#ffffff",
  },
  backText: {
    fontSize: 14,
    color: "#6b7280",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  avatarWrapper: {
    alignSelf: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#ecfdf5",
    borderWidth: 2,
    borderColor: "#a7f3d0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: "700",
    color: "#047857",
  },
  avatarCamera: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: {
    textAlign: "center",
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 16,
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
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#ffffff",
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
