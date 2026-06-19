import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// LearnEase Firebase (Web)
const firebaseConfig = {
  apiKey: "AIzaSyAhKOC9eML-D7oRo_zAY3dEbSME_atnNl4",
  authDomain: "learnease-7a1fe.firebaseapp.com",
  projectId: "learnease-7a1fe",
  storageBucket: "learnease-7a1fe.firebasestorage.app",
  messagingSenderId: "930899346583",
  appId: "1:930899346583:web:a040e638f2dd80f59e95d2",
  measurementId: "G-DGGXF6ZV5D"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(firebaseApp);
