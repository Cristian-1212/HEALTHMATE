import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration keys
const firebaseConfig = {
  apiKey: "AIzaSyDHgCEIkF--Yo1X05NIXulRAsK744mIGU8",
  authDomain: "healthmate-b8138.firebaseapp.com",
  projectId: "healthmate-b8138",
  storageBucket: "healthmate-b8138.firebasestorage.app",
  messagingSenderId: "391880430802",
  appId: "1:391880430802:web:4aad2efb14f11c3b92c90b",
  measurementId: "G-6M9MXVWB1B"
};

// Initialize Firebase app instance safely for Next.js (prevents crashing on reload)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 🌟 BOTH OF THESE ARE NOW EXPORTED AND READY TO USE!
export const auth = getAuth(app);
export const db = getFirestore(app);