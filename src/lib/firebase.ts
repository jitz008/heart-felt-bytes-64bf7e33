import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
});

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with custom Database ID
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-7bd3396e-d065-46a9-9d0c-9b1847e79c41');

// Export auth providers and helpers
export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
};

// Validate connection to Firestore
export async function initializeFirebaseConnection() {
  try {
    // Validate connection to Firestore as requested by skill
    const testDocRef = doc(db, 'test', 'connection');
    await getDocFromServer(testDocRef).catch(() => {
      // It is normal to fail on 'test/connection' due to security rules
      console.log("Firestore reachability test completed");
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    } else {
      console.error("Firebase connection check:", error);
    }
  }
}

