import React, { createContext, useContext, useEffect, useState } from 'react';
import emailjs from '@emailjs/browser';
import { auth, provider, db } from '../lib/firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, createUserWithEmailAndPassword, updateProfile, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function sendLoginNotificationEmail(user) {
    try {
      console.log('Preparing to send login notification email...');
      console.log("Service ID:", import.meta.env.VITE_EMAILJS_SERVICE_ID);
      console.log("Template ID:", import.meta.env.VITE_EMAILJS_TEMPLATE_ID);
      console.log("Public Key:", import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

      const response = await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          name: user.displayName || "User",
          email: user.email,
          time: new Date().toLocaleString(),
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );
      
      console.log('Login notification email sent successfully!', response.status, response.text);
    } catch (err) {
      // Ensure the login process succeeds even if EmailJS fails
      console.error('Failed to send login notification email:');
      console.error('HTTP status:', err?.status);
      console.error('error.text:', err?.text);
      console.error('Full Error:', err);
    }
  }

  async function signInWithGoogle(rememberMe = true) {
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
      // Check if mobile device to use redirect instead of popup
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        await signInWithRedirect(auth, provider);
        return; // Will redirect the page
      }

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

      // Send login notification email
      await sendLoginNotificationEmail(user);

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

  async function updateUserProfileData(name, bio) {
    try {
      if (!auth.currentUser) throw new Error("No user is signed in.");
      
      // 1. Update Firebase Auth Profile (DisplayName)
      await updateProfile(auth.currentUser, { displayName: name });
      
      // 2. Update Firestore User Document (name and bio)
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, { name, bio }, { merge: true });
      
      // 3. Force local state update
      setCurrentUser({
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: name,
        photoURL: auth.currentUser.photoURL
      });
      
      return true;
    } catch (error) {
      console.error("Error updating profile: ", error);
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
    // Handle redirect result for mobile Google Sign-In
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const user = result.user;
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
          
          await sendLoginNotificationEmail(user);
        }
      } catch (error) {
        console.error("Error handling Google redirect result: ", error);
      }
    };

    handleRedirectResult();

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
      
      // Send login notification email
      await sendLoginNotificationEmail(result.user);
      
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
    updateUserProfileData,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
