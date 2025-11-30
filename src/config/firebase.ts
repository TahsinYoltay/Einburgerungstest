import app from '@react-native-firebase/app';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import storage, { FirebaseStorageTypes } from '@react-native-firebase/storage';

// Firebase is automatically initialized from google-services.json
// No manual initialization needed for React Native Firebase

// Initialize Firebase services
export const firebaseAuth = auth();
export const firebaseFirestore = firestore();
export const firebaseStorage = storage();

// Export types for TypeScript
export type {
  FirebaseAuthTypes,
  FirebaseFirestoreTypes,
  FirebaseStorageTypes,
};

// Helper functions
export const getCurrentUser = () => {
  return firebaseAuth.currentUser;
};

export const signOut = async () => {
  try {
    await firebaseAuth.signOut();
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error };
  }
};

export const createUserAccount = async (email: string, password: string) => {
  try {
    const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Create account error:', error);
    return { success: false, error };
  }
};

export const signInWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error };
  }
};

export const sendPasswordResetEmail = async (email: string) => {
  try {
    await firebaseAuth.sendPasswordResetEmail(email);
    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error };
  }
};

export default app; 