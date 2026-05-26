import React, { createContext, useContext, useEffect, useState } from 'react';
import emailjs from '@emailjs/browser';
import { auth, provider, db } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, updateProfile, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signInWithGoogle(rememberMe = true) {
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          role: 'user',
          createdAt: serverTimestamp()
        });
      }
      return user;
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      throw error;
    }
  }

  async function signUpWithEmail(email, password, name) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Update the user's profile with their name
      await updateProfile(user, {
        displayName: name
      });

      // Save user to Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        name: name,
        email: user.email,
        role: 'user',
        createdAt: serverTimestamp()
      });
      
      return user;
    } catch (error) {
      console.error("Error signing up with email: ", error);
      throw error;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
      throw error;
    }
  }


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signInWithEmail(email, password, rememberMe = true) {
    try {
      const trimmedEmail = email.trim();
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const result = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      
      // ==========================================
      // EMAIL NOTIFICATION SYSTEM
      // ==========================================
      // We automatically send a login notification email using EmailJS.
      try {
        console.log('Preparing to send login email...');
        console.log('Service ID:', import.meta.env.VITE_EMAILJS_SERVICE_ID);
        console.log('Template ID:', import.meta.env.VITE_EMAILJS_TEMPLATE_ID);
        
        const response = await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            email: result.user.email
          },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        );
        console.log('EmailJS successfully sent login notification!', response.status, response.text);
      } catch (err) {
        // If email fails, only console.error should happen. Login still works!
        console.error('Failed to send login notification email:', err);
      }
      // ==========================================
      
      return result.user;
    } catch (error) {
      console.error("Error signing in with email: ", error);
      throw error;
    }
  }

  const value = {
    currentUser,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
