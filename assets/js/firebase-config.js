// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyBnnhV10gVqSiYaU5a_ST7N8hPTjIV6PX0",
  authDomain: "blooddoner-4f9dd.firebaseapp.com",
  projectId: "blooddoner-4f9dd",
  storageBucket: "blooddoner-4f9dd.appspot.com",
  messagingSenderId: "735634301432",
  appId: "1:735634301432:web:863ceef0d404e79265360d"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Export Firestore and Auth instances for use in other files
export { db, auth };
