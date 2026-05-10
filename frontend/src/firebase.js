import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBU8GkXniRXuvvKfuP4JJo3cnWr2sGY07k",
    authDomain: "shle-7e87e.firebaseapp.com",
    projectId: "shle-7e87e",
    storageBucket: "shle-7e87e.firebasestorage.app",
    messagingSenderId: "690930985087",
    appId: "1:690930985087:web:9f5510a50ac32599fc774a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
