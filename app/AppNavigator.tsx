// app/AppNavigator.tsx
import { useState } from 'react';
import PostItemScreen from './PostItemScreen';
import { useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import MyPostsScreen from './MyPostsScreen';
import RequestsScreen from './RequestsScreen';
import { Pressable } from 'react-native';
import { View, Text, Button, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import PostDetailScreen from './PostDetailScreen';
import { onAuthStateChanged } from 'firebase/auth';
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
        Alert.alert('Success', 'Logged in successfully!');
        navigation.replace('Home');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert('Success', 'Account created! Welcome.');
        navigation.replace('Home');
      }
    } catch (error: any) {
      Alert.alert('Authentication Error', error.message);
    }
  };

  return (
    <View style={styles.authContainer}>
      <View style={styles.authCard}>
        <Text style={styles.appName}>HostelX</Text>
        <Text style={styles.subtitle}>Your hostel marketplace</Text>

        <TextInput
          placeholder="Email address"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          style={styles.authInput}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          style={styles.authInput}
          secureTextEntry
        />

        <View style={{ marginTop: 10 }}>
          <Button
            title={isLogin ? 'Log in' : 'Sign up'}
            onPress={handleAuth}
            color="#10b981"
          />
        </View>

        <Pressable
          onPress={() => setIsLogin(!isLogin)}
          style={{ marginTop: 16 }}
        >
          <Text style={styles.switchText}>
            {isLogin ? 'Create a new account' : 'I have an account'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.footerText}>
        Buy & sell within your hostel community
      </Text>
    </View>
  );
}

function HomeScreen({ navigation }: any) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'need' | 'sell'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'price'>('time');

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

  const filtered = posts
    .filter(p => filter === 'all' || p.type === filter)
    .filter(p => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'time') {
      // already newest-first from Firestore
      return 0;
    }
    const pa = Number(a.price) || 0;
    const pb = Number(b.price) || 0;
    return pa - pb; // low to high
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HostelX Marketplace</Text>

      <TextInput
        placeholder="Search items..."
        placeholderTextColor="#585858ff"
        value={search}
        onChangeText={setSearch}
        style={[styles.input, { marginBottom: 10 }]}
      />

      <View style={{ flexDirection: 'row', marginBottom: 10, flexWrap: 'wrap' }}>
        <Button title="My Posts" onPress={() => navigation.navigate('MyPosts')} />
          <Button title="Requests" onPress={() => navigation.navigate('Requests')} />
        <View style={{ width: 10 }} />
        <Button title="All" onPress={() => setFilter('all')} />
        <View style={{ width: 10 }} />
        <Button title="Need" onPress={() => setFilter('need')} />
        <View style={{ width: 10 }} />
        <Button title="Sell" onPress={() => setFilter('sell')} />
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <Button title="Sort by time" onPress={() => setSortBy('time')} />
        <View style={{ width: 10 }} />
        <Button title="Sort by price" onPress={() => setSortBy('price')} />
      </View>

      <Button title="Post New Request" onPress={() => navigation.navigate('PostItem')} />

      <View style={{ marginTop: 10 }}>
        <Button title="Logout" color="#cc0000" onPress={handleLogout} />
      </View>

            {loading ? (
        <Text style={{ marginTop: 20 }}>Loading posts...</Text>
      ) : (
        <ScrollView style={{ marginTop: 20 }}>
          {sorted.map(p => (
            <Pressable
              key={p.id}
              onPress={() => navigation.navigate('PostDetail', { post: p })}
              style={{ marginBottom: 15, padding: 15, borderWidth: 1, borderRadius: 10 }}
            >
              <Text style={{ fontWeight: 'bold' }}>
                [{p.type === 'need' ? 'NEED' : 'SELL'}] {p.title}
              </Text>
              <Text>{p.description}</Text>
              {p.price ? <Text>Price: {p.price}</Text> : null}
              <Text style={{ fontSize: 12, color: '#666' }}>{p.userEmail}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

    </View>
  );
}
export default function AppNavigator() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setInitializing(false);
    });
    return () => unsub();
  }, []);

  if (initializing) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }
  return (
    <Stack.Navigator initialRouteName={user ? 'Home' : 'Auth'}>
      <Stack.Screen name="PostItem" component={PostItemScreen} />
      <Stack.Screen name="MyPosts" component={MyPostsScreen} />
      <Stack.Screen name="Requests" component={RequestsScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({

  authContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  authCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  authInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#f9fafb',
    marginBottom: 12,
    fontSize: 14,
  },
  switchText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '500',
  },
  footerText: {
    marginTop: 16,
    fontSize: 12,
    color: '#6b7280',
  },
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