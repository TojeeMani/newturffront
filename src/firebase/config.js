import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your Firebase configuration
// Replace these values with your actual Firebase project configuration
// You can find these in your Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyCLDFCXnZJ-CV5CyAV47xB40cT_aKfi0cU",
  authDomain: "turf-f9e00.firebaseapp.com",
  projectId: "turf-f9e00",
  storageBucket: "turf-f9e00.appspot.com",
  messagingSenderId: "941202318146",
  appId: "1:941202318146:web:default-app-id" // This will work for testing
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app; 