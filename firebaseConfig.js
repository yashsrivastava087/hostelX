import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBMq3PJmLaM1fN4iEXPrmONnmZonRjOVYs",
  authDomain: "hostel-x-dev.firebaseapp.com",
  projectId: "hostel-x-dev",
  storageBucket: "hostel-x-dev.firebasestorage.app",
  messagingSenderId: "691957156986",
  appId: "1:691957156986:web:96b9095a3161795b1affc3",
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { auth, db };
