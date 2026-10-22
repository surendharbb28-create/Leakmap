import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase web config — these values are safe to ship in client code by
// design (they identify your project, they don't authorize access on their
// own). Access control is enforced by your Realtime Database Rules, not by
// keeping this object secret. See README.md for the rules you need to set.
const firebaseConfig = {
  apiKey: "AIzaSyCq8iIhzZiTlNNcFMgambOCuki838_Kb8w",
  authDomain: "leak-map-3d971.firebaseapp.com",
  databaseURL: "https://leak-map-3d971-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "leak-map-3d971",
  storageBucket: "leak-map-3d971.firebasestorage.app",
  messagingSenderId: "687994037081",
  appId: "1:687994037081:web:aa4ee7d638735bfbb76248",
  measurementId: "G-9MQ2G7RDXE"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
