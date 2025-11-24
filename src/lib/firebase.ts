// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBYa6GrzR9ojDwK-ZkWf7FQx1iLrS_IsQI",
  authDomain: "rifaselguero-d346b.firebaseapp.com",
  projectId: "rifaselguero-d346b",
  storageBucket: "rifaselguero-d346b.firebasestorage.app",
  messagingSenderId: "433583777418",
  appId: "1:433583777418:web:d5fb5c9f55d4cefa032f73",
  measurementId: "G-SZ5GCL7C6S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);