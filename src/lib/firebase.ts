import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (import.meta.env.NEXT_PUBLIC_FIREBASE_API_KEY as string),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (import.meta.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string),
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || (import.meta.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL as string),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (import.meta.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (import.meta.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (import.meta.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string),
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (import.meta.env.NEXT_PUBLIC_FIREBASE_APP_ID as string),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || (import.meta.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID as string),
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const rtdb = getDatabase(app)
export const googleProvider = new GoogleAuthProvider()

export async function loginWithGoogle() {
  const res = await signInWithPopup(auth, googleProvider)
  return res.user
}

export async function loginAnon() {
  const res = await signInAnonymously(auth)
  return res.user
}
