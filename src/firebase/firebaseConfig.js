import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC0BKnAIwEriEOR2eH9PGVjGc3oAH5V34w",
  authDomain: "racharuchiwebsite.firebaseapp.com",
  projectId: "racharuchiwebsite",
  storageBucket: "racharuchiwebsite.firebasestorage.app",
  messagingSenderId: "287774457114",
  appId: "1:287774457114:web:600578b9373dcd2e9640a3",
  measurementId: "G-PC8VF4Y0WL"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;