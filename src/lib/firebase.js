// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "soundware-prototype.firebaseapp.com",
    projectId: "soundware-prototype",
    storageBucket: "soundware-prototype.firebasestorage.app",
    messagingSenderId: "622926820242",
    appId: "1:622926820242:web:baf1027f3ee3aa56f5474b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth }; 