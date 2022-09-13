import { initializeApp } from "firebase/app";
import { getFirestore } from "@firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_KEY_FIREBASE,
  authDomain: "dice-game-87899.firebaseapp.com",
  projectId: "dice-game-87899",
  storageBucket: "dice-game-87899.appspot.com",
  messagingSenderId: "924510562122",
  appId: "1:924510562122:web:e5fea174cdda178bb343b3",
  measurementId: "G-80CD5V6XFV"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
