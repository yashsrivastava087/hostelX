    // app/PostItemScreen.tsx
import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig'; // Import db and auth

export default function PostItemScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('need'); // 'need' or 'sell'

  const handlePost = async () => {
    if (!title || !desc) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      // Add a new document with a generated ID to "posts" collection
      await addDoc(collection(db, "posts"), {
        title: title,
        description: desc,
        price: price,
        type: type, // 'need' (Borrow/Need) or 'sell' (Sell/Lend)
        userId: auth.currentUser?.uid,
        userEmail: auth.currentUser?.email,
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Success", "Item posted!");
      navigation.goBack(); // Go back to Home
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Post a Request</Text>
      
      <View style={styles.typeContainer}>
        <Button 
          title="I NEED something" 
          color={type === 'need' ? '#007AFF' : '#ccc'} 
          onPress={() => setType('need')} 
        />
        <View style={{width: 10}} />
        <Button 
          title="I'm SELLING/LENDING" 
          color={type === 'sell' ? '#007AFF' : '#ccc'} 
          onPress={() => setType('sell')} 
        />
      </View>

      <TextInput 
        placeholder="Item Name (e.g. Maggi, Blue Pen)" 
        style={styles.input} 
        value={title}
        onChangeText={setTitle}
      />
      
      <TextInput 
        placeholder="Description (e.g. Urgent, Block A Room 101)" 
        style={styles.input} 
        value={desc}
        onChangeText={setDesc}
      />

      <TextInput 
        placeholder="Price (or 'Free')" 
        style={styles.input} 
        value={price}
        onChangeText={setPrice}
      />

      <Button title="Post Item" onPress={handlePost} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 15 },
  typeContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
});
