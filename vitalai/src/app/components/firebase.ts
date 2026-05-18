import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDHgCEIkF--Yo1X05NIXulRAsK744mIGU8",
  authDomain: "healthmate-b8138.firebaseapp.com",
  projectId: "healthmate-b8138",
  storageBucket: "healthmate-b8138.firebasestorage.app",
  messagingSenderId: "391880430802",
  appId: "1:391880430802:web:4aad2efb14f11c3b92c90b",
  measurementId: "G-6M9MXVWB1B"
};

// Initialize Firebase (prevents re-initialization during HMR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics safely for SSR
export const analytics = typeof window !== 'undefined' 
  ? isSupported().then(yes => yes ? getAnalytics(app) : null) 
  : null;