// Import the required functions from Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAk2QNm1AIgyGzNdT7Hs4TaVcozOCshrwA",
  authDomain: "lifelog-6bb29.firebaseapp.com",
  projectId: "lifelog-6bb29",
  storageBucket: "lifelog-6bb29.appspot.com", // Fixed incorrect URL
  messagingSenderId: "203803492510",
  appId: "1:203803492510:web:d9afb8896b143824f5fb8f",
  measurementId: "G-KGGG7S6F70",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Firebase Authentication and export it
export const auth = getAuth(app);
export default app;
