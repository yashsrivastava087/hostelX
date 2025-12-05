import { initializeApp } from 'firebase/app';
// CHANGED: Import initializeAuth and getReactNativePersistence
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyA34h3fU9JuNdLv7BuzlkBTeJEpgvIiuUI",
  authDomain: "hostelx-ecc94.firebaseapp.com",
  projectId: "hostelx-ecc94",
  storageBucket: "hostelx-ecc94.firebasestorage.app",
  messagingSenderId: "367404049088",
  appId: "1:367404049088:web:697f386d97e3403cba8325"
};

const app = initializeApp(firebaseConfig);

// CHANGED: Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = getFirestore(app);

export { auth, db };
