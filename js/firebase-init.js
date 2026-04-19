/* ============================================
   LEJÔ — Firebase initialization
   Shared across all pages. Uses compat SDK via CDN
   (no bundler required).
   ============================================ */

const firebaseConfig = {
  apiKey: "AIzaSyBR03Vk3vOfs02KXCjBxgf8EEO6ragTde8",
  authDomain: "lejo-dc0d3.firebaseapp.com",
  projectId: "lejo-dc0d3",
  storageBucket: "lejo-dc0d3.firebasestorage.app",
  messagingSenderId: "734405826619",
  appId: "1:734405826619:web:82adc2d2579b33239ae41e",
  measurementId: "G-PSVH0VWYG9"
};

firebase.initializeApp(firebaseConfig);

// Public pages load only Firestore. Admin also loads Auth.
// Guard so missing SDKs don't break Firestore initialization.
const fbAuth = typeof firebase.auth === 'function' ? firebase.auth() : null;
const fbDb = firebase.firestore();

const PRODUCTS_COLLECTION = 'products';
