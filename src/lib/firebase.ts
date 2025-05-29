
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, type Analytics } from "firebase/analytics";

// Your web app's Firebase configuration (as provided by user)
const firebaseConfig = {
  apiKey: "AIzaSyAQLHlfYTKD96oB_we39EYt15Hbfd-_Wfw",
  authDomain: "self-study-enhancer.firebaseapp.com",
  // databaseURL: "https://self-study-enhancer-default-rtdb.firebaseio.com", // Realtime Database, not currently used by Firestore
  projectId: "self-study-enhancer",
  storageBucket: "self-study-enhancer.firebasestorage.app",
  messagingSenderId: "80444506994",
  appId: "1:80444506994:web:2388af27323d7536fe53eb",
  measurementId: "G-XD8RP0PK9V"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | undefined;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

// Initialize Firebase Analytics only in the browser
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.error("Firebase Analytics initialization error:", error);
    // analytics will remain undefined if initialization fails
  }
}

export { app, auth, db, analytics };
