/**
 * Smart Grocery & Budget Safety Tracker
 * Module: Firebase & Cloud Firestore Realtime Sync
 * Multi-device Realtime Architecture (HP & PC Synced)
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Konfigurasi Cloud Firestore Pengguna
const firebaseConfig = {
  apiKey: "AIzaSyBvk-rglYBrxKtCIWlQrAbGWiEh8tZnuaY",
  authDomain: "smart-grocery-55013.firebaseapp.com",
  projectId: "smart-grocery-55013",
  storageBucket: "smart-grocery-55013.firebasestorage.app",
  messagingSenderId: "540481521682",
  appId: "1:540481521682:web:bb7c80d5ca6314c58470cb"
};

// Inisialisasi Firebase App & Firestore
let app = null;
let db = null;
let activeSessionUnsubscribe = null;
let isFirestoreInitialized = false;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  isFirestoreInitialized = true;
  console.log("Firebase App & Cloud Firestore successfully initialized.");
} catch (error) {
  console.warn("Firebase initialization notice:", error);
}

// Collection & Document ID bersama untuk multi-device realtime session
const FIRESTORE_COLLECTION = "shopping_sessions";
const ACTIVE_SESSION_DOC_ID = "active_session";

// Kunci LocalStorage untuk fallback offline & auth
export const LOCAL_AUTH_KEY = "smart_grocery_auth_v1";
export const LOCAL_SESSION_META_KEY = "smart_grocery_session_meta_v1";

/**
 * Mendapatkan sesi akun saat ini (1 akun bersama untuk semua device)
 */
export function getAuthUser() {
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Login 1 akun tanpa verifikasi yang ribet (Langsung masuk realtime tanpa refresh)
 */
export function loginUser(username = "admin", password = "") {
  const cleanUser = (username || "Pengguna").trim();
  const session = {
    username: cleanUser,
    loggedInAt: new Date().toISOString(),
    device: navigator.userAgent.includes("Mobile") ? "Smartphone" : "Komputer/PC"
  };
  localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(session));
  return session;
}

/**
 * Logout
 */
export function logoutUser() {
  localStorage.removeItem(LOCAL_AUTH_KEY);
  if (typeof activeSessionUnsubscribe === "function") {
    activeSessionUnsubscribe();
    activeSessionUnsubscribe = null;
  }
}

/**
 * Metadata sesi belanja lokal (fallback jika offline)
 */
export function getLocalSessionMeta() {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_META_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback default
  }
  const today = new Date().toISOString().split("T")[0];
  return {
    storeLocation: "Supermarket Utama",
    shoppingDate: today
  };
}

export function saveLocalSessionMeta(meta) {
  try {
    const current = getLocalSessionMeta();
    const updated = { ...current, ...meta };
    localStorage.setItem(LOCAL_SESSION_META_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Gagal simpan session meta ke localStorage:", e);
  }
}

/**
 * Inisialisasi Realtime Listener menggunakan onSnapshot()
 * PENTING: JANGAN gunakan getDoc/getDocs sekali baca!
 * onSnapshot menjamin saat HP mengubah barang/anggaran di supermarket, PC di rumah langsung ter-update detik itu juga.
 * 
 * @param {Function} onDataCallback - Dipanggil saat ada data baru dari Firestore
 * @param {Function} onStatusChange - Dipanggil untuk mengabari status koneksi (online/offline/syncing)
 */
export function subscribeActiveSessionRealtime(onDataCallback, onStatusChange) {
  if (!isFirestoreInitialized || !db) {
    if (onStatusChange) onStatusChange("offline", "Database belum siap, beralih ke LocalStorage.");
    return () => {};
  }

  // Hentikan listener sebelumnya jika ada
  if (typeof activeSessionUnsubscribe === "function") {
    activeSessionUnsubscribe();
  }

  const sessionDocRef = doc(db, FIRESTORE_COLLECTION, ACTIVE_SESSION_DOC_ID);

  if (onStatusChange) onStatusChange("connecting", "Menghubungkan ke Cloud Firestore...");

  activeSessionUnsubscribe = onSnapshot(
    sessionDocRef,
    { includeMetadataChanges: true },
    (snapshot) => {
      const source = snapshot.metadata.fromCache ? "Lokal/Cache" : "Server Cloud";
      const hasPendingWrites = snapshot.metadata.hasPendingWrites;

      if (onStatusChange) {
        if (hasPendingWrites) {
          onStatusChange("syncing", "Menyimpan perubahan ke Cloud...");
        } else {
          onStatusChange("online", `Terhubung Realtime (${source})`);
        }
      }

      if (snapshot.exists()) {
        const data = snapshot.data();
        if (typeof onDataCallback === "function") {
          onDataCallback(data, { fromCache: snapshot.metadata.fromCache });
        }
      } else {
        // Jika dokumen belum pernah dibuat di Firestore, buat dokumen awal dari LocalStorage
        console.log("Dokumen sesi belanja belum ada di Firestore. Melakukan inisialisasi awal...");
        if (typeof onDataCallback === "function") {
          onDataCallback(null, { isInitial: true });
        }
      }
    },
    (error) => {
      console.warn("Firestore onSnapshot error/offline fallback:", error);
      if (onStatusChange) {
        onStatusChange("offline", "Koneksi terputus. Menggunakan data cadangan LocalStorage.");
      }
    }
  );

  return activeSessionUnsubscribe;
}

/**
 * Mengirim pembaruan sesi belanja ke Cloud Firestore secara Realtime
 * Variabel wajib: storeLocation, shoppingDate, walletLimit, items, totalSpent (+ totalSavings, lastUpdated, updatedBy)
 */
export async function pushSessionToFirestore(payload) {
  // Selalu amankan ke LocalStorage terlebih dahulu (Fallback Offline)
  saveLocalSessionMeta({
    storeLocation: payload.storeLocation,
    shoppingDate: payload.shoppingDate
  });

  if (!isFirestoreInitialized || !db) {
    console.warn("Firestore belum aktif, data tersimpan di LocalStorage.");
    return false;
  }

  try {
    const sessionDocRef = doc(db, FIRESTORE_COLLECTION, ACTIVE_SESSION_DOC_ID);
    const authUser = getAuthUser();

    const dataToSave = {
      storeLocation: payload.storeLocation || "Supermarket Utama",
      shoppingDate: payload.shoppingDate || new Date().toISOString().split("T")[0],
      walletLimit: Number(payload.walletLimit) || 600000,
      items: Array.isArray(payload.items) ? payload.items : [],
      totalSpent: Number(payload.totalSpent) || 0,
      totalSavings: Number(payload.totalSavings) || 0,
      lastUpdated: new Date().toISOString(),
      updatedBy: authUser ? `${authUser.username} (${authUser.device || 'Device'})` : "Pengguna"
    };

    await setDoc(sessionDocRef, dataToSave, { merge: true });
    return true;
  } catch (error) {
    console.error("Gagal sinkronisasi ke Firestore (data tetap aman di LocalStorage):", error);
    return false;
  }
}

