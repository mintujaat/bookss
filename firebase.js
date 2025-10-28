// /js/firebase.js
// Firebase init (your config inserted)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtyTzP8p26_QZQ2tk3KGsg5pZXU-nEY9Q",
  authDomain: "books-e1b53.firebaseapp.com",
  projectId: "books-e1b53",
  storageBucket: "books-e1b53.firebasestorage.app",
  messagingSenderId: "206852333319",
  appId: "1:206852333319:web:7c37f760db3cdba21c2fa2",
  measurementId: "G-J1KG00X7D2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
