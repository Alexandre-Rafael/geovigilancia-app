
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Suas configurações do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDJkXl1DJ4cAN96C4nM_NAN4u0mZPTNPEk",
  authDomain: "geovigilancia-8a725.firebaseapp.com",
  projectId: "geovigilancia-8a725",
  storageBucket: "geovigilancia-8a725.appspot.com",
  messagingSenderId: "1040558627607",
  appId: "1:1040558627607:web:46b3b3650eb3de6d83b552",
  measurementId: "G-63LW6R29ZQ"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);
const analytics = getAnalytics(app);

export { auth, db };