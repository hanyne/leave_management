import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCC_vUCTBl0lS87AMsX6-qIRj_1WXup7NM",
  authDomain: "hanine-cba83.firebaseapp.com",
  projectId: "hanine-cba83",
  storageBucket: "hanine-cba83.firebasestorage.app",
  messagingSenderId: "56355843986",
  appId: "1:56355843986:web:028eb5c0047a976b47db4b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);