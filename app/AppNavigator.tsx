// app/AppNavigator.tsx
import { useState } from 'react';
import PostItemScreen from './PostItemScreen';
import { useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import MyPostsScreen from './MyPostsScreen';

import { Pressable } from 'react-native';

import { View, Text, Button, TextInput, StyleSheet, Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import PostDetailScreen from './PostDetailScreen';

import { signOut } from 'firebase/auth';

const Stack = createNativeStackNavigator();

// --- Screens ---

function AuthScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        // We will handle navigation better later, but this works for now
        Alert.alert("Success", "Logged in successfully!");
        navigation.replace('Home');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert("Success", "Account created! Welcome.");
        navigation.replace('Home');
      }
    } catch (error: any) {
      Alert.alert("Authentication Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HostelX</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />

      <Button title={isLogin ? "Login" : "Sign Up"} onPress={handleAuth} />

      <View style={{ marginTop: 20 }}>
        <Button
          title={isLogin ? "Create new account" : "I have an account"}
          onPress={() => setIsLogin(!isLogin)}
          color="#666"
        />
      </View>
    </View>
  );
}

function HomeScreen({ navigation }: any) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'need' | 'sell'>('all'); 
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const items: any[] = [];
      snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setPosts(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigation.replace('Auth');
  };

  const filtered = posts.filter(p => filter === 'all' || p.type === filter);

  return (
    
    <View style={styles.container}>
      <Text style={styles.title}>HostelX Marketplace</Text>
     
      

      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <Button title="My Posts" onPress={() => navigation.navigate('MyPosts')} />
        <Button title="All" onPress={() => setFilter('all')} />
        <View style={{ width: 10 }} />
        <Button title="Need" onPress={() => setFilter('need')} />
        <View style={{ width: 10 }} />
        <Button title="Sell" onPress={() => setFilter('sell')} />
      </View>

      <Button title="Post New Request" onPress={() => navigation.navigate('PostItem')} />

      <View style={{ marginTop: 10 }}>
        <Button title="Logout" color="#cc0000" onPress={handleLogout} />
      </View>

      {loading ? (
        <Text style={{ marginTop: 20 }}>Loading posts...</Text>
      ) : (
        filtered.map(p => (
          <Pressable
            key={p.id}
            onPress={() => navigation.navigate('PostDetail', { post: p })}
            style={{ marginTop: 20, padding: 15, borderWidth: 1, borderRadius: 10 }}
          >
            <Text style={{ fontWeight: 'bold' }}>
              [{p.type === 'need' ? 'NEED' : 'SELL'}] {p.title}
            </Text>
            <Text>{p.description}</Text>
            {p.price ? <Text>Price: {p.price}</Text> : null}
            <Text style={{ fontSize: 12, color: '#666' }}>{p.userEmail}</Text>
          </Pressable>
        ))
      )}

    </View>
  );
}




export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Auth">
      <Stack.Screen name="PostItem" component={PostItemScreen} />
      <Stack.Screen name="MyPosts" component={MyPostsScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
});
