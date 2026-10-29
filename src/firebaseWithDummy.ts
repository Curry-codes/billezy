// Firebase Configuration with Dummy Data Support
// This file can be imported in components to use dummy data during testing

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import * as dummyData from "./dummyData";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if using dummy credentials
export const isUsingDummyConfig = () => {
  return (
    firebaseConfig.projectId === "smart-billing-dummy-12345" ||
    firebaseConfig.apiKey?.includes("Dummy")
  );
};

// Log configuration status
if (firebaseConfig.projectId) {
  console.log("🔧 Firebase Configuration:");
  console.log(`   Project: ${firebaseConfig.projectId}`);
  if (isUsingDummyConfig()) {
    console.log("   ⚠️ Using DUMMY credentials (for testing)");
    console.log("   💡 Tip: Replace with real Firebase credentials when ready");
  }
} else {
  console.warn("⚠️ Firebase Project ID not found in .env file");
}

// Initialize Firebase
let app, auth, db, functions;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { app, auth, db, functions, dummyData };

// Helper: Get test data based on environment
export const getTestData = () => {
  if (isUsingDummyConfig()) {
    console.log("📦 Using dummy data for testing");
    return {
      products: dummyData.DUMMY_PRODUCTS,
      users: dummyData.DUMMY_USERS,
      orders: dummyData.DUMMY_ORDERS,
    };
  }
  return null;
};

// Helper: Initialize test environment
export const initializeTestEnvironment = () => {
  if (isUsingDummyConfig()) {
    console.log("🧪 Initializing test environment...");
    dummyData.initializeDummyData();
    console.log("✅ Test environment ready");
    console.log("📝 Dummy products loaded:", dummyData.DUMMY_PRODUCTS.length);
    console.log("👥 Dummy users loaded:", dummyData.DUMMY_USERS.length);
    console.log("📋 Dummy orders loaded:", dummyData.DUMMY_ORDERS.length);
  }
};

export default {
  app,
  auth,
  db,
  functions,
  isUsingDummyConfig,
  getTestData,
  initializeTestEnvironment,
};
