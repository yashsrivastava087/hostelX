// app/SignUpScreen.tsx
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth, db } from "../firebaseConfig";

export default function SignUpScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [collegeEmail, setCollegeEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (
      !firstName ||
      !lastName ||
      !username ||
      !personalEmail ||
      !collegeEmail ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // 1) check username uniqueness
      const q = query(
        collection(db, "users"),
        where("username", "==", username.trim().toLowerCase())
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setLoading(false);
        Alert.alert("Username taken", "Please choose another username.");
        return;
      }

      // 2) create auth user
      const cred = await createUserWithEmailAndPassword(
        auth,
        personalEmail,
        password
      );
      const user = cred.user;

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

      // 3) create user profile document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim().toLowerCase(),
        personalEmail,
        collegeEmail,
        createdAt: new Date(),
      });

      setLoading(false);
      Alert.alert("Success", "Account created! Please log in.");
      navigation.replace("Auth");
    } catch (e: any) {
      setLoading(false);
      Alert.alert("Sign up error", e.message);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.appName}>HostelX</Text>
          <Text style={styles.subtitle}>Create your account</Text>

          <View style={styles.row}>
            <TextInput
              placeholder="First name"
              placeholderTextColor="#9ca3af"
              value={firstName}
              onChangeText={setFirstName}
              style={[styles.input, { flex: 1, marginRight: 6 }]}
            />
            <TextInput
              placeholder="Last name"
              placeholderTextColor="#9ca3af"
              value={lastName}
              onChangeText={setLastName}
              style={[styles.input, { flex: 1, marginLeft: 6 }]}
            />
          </View>

          <TextInput
            placeholder="Username"
            placeholderTextColor="#9ca3af"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            placeholder="Personal email"
            placeholderTextColor="#9ca3af"
            value={personalEmail}
            onChangeText={setPersonalEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            placeholder="College email"
            placeholderTextColor="#9ca3af"
            value={collegeEmail}
            onChangeText={setCollegeEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            placeholder="Confirm password"
            placeholderTextColor="#9ca3af"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
          />

          <Pressable
            style={[styles.primaryButton, loading && { opacity: 0.7 }]}
            onPress={loading ? undefined : handleSignUp}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? "Signing up..." : "Sign up"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.replace("Auth")}
            style={{ marginTop: 16 }}
          >
            <Text style={styles.switchText}>I already have an account</Text>
          </Pressable>
        </View>

        <Text style={styles.footerText}>
          Buy & sell within your hostel community
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: "center",
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 12,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#f9fafb",
    marginBottom: 12,
    fontSize: 14,
  },
  primaryButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: "#10b981",
    alignItems: "center",
    minWidth: 220,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  switchText: {
    color: "#10b981",
    fontSize: 14,
    fontWeight: "500",
  },
  footerText: {
    marginTop: 16,
    fontSize: 12,
    color: "#6b7280",
  },
});
