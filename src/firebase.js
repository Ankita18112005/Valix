import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBtEw88BSRiJa3bCHs-JfiIfPPJAlrg9Pc",
  authDomain: "valix-5c5f7.firebaseapp.com",
  projectId: "valix-5c5f7",
  storageBucket: "valix-5c5f7.firebasestorage.app",
  messagingSenderId: "691033725745",
  appId: "1:691033725745:web:22ee5bc7f997a58cde6e10"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);