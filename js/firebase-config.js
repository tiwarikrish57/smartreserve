// ============================================================
// BusGo — Firebase Configuration (firebase-config.js)
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCNVHmtKu0EDAY-xgRhK6tQ1EqkohfYM7w",
  authDomain: "reservation-system-77eb0.firebaseapp.com",
  projectId: "reservation-system-77eb0",
  storageBucket: "reservation-system-77eb0.firebasestorage.app",
  messagingSenderId: "942786604795",
  appId: "1:942786604795:web:9c73c82968bd353e2d4a5e",
  measurementId: "G-P57JP524CD"
};

// Initialize Firebase (compat SDK)
firebase.initializeApp(firebaseConfig);

// Global references used across all pages
const auth = firebase.auth();
const db   = firebase.firestore();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ---- FastAPI Base URL ----
// Change to your deployed backend URL in production
const API_BASE = "http://localhost:8000";
