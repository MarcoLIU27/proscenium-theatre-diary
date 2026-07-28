import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Production } from '../types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Real-time listener for user's productions
export function subscribeToUserProductions(
  userId: string, 
  onData: (productions: Production[]) => void,
  onError?: (err: Error) => void
) {
  const prodsRef = collection(db, 'users', userId, 'productions');
  const q = query(prodsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q, 
    (snapshot) => {
      const items: Production[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Production);
      });
      onData(items);
    },
    (err) => {
      console.error('Firestore subscription error:', err);
      if (onError) onError(err);
    }
  );
}

// Helper to remove undefined fields which Firestore rejects
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        clean[key] = sanitizeForFirestore(val);
      } else {
        clean[key] = val;
      }
    }
  });
  return clean;
}

// Save or update a production in Firestore
export async function saveProductionToCloud(userId: string, production: Production) {
  const docRef = doc(db, 'users', userId, 'productions', production.id);
  const sanitized = sanitizeForFirestore(production);
  await setDoc(docRef, sanitized, { merge: true });
}

// Delete a production from Firestore
export async function deleteProductionFromCloud(userId: string, productionId: string) {
  const docRef = doc(db, 'users', userId, 'productions', productionId);
  await deleteDoc(docRef);
}

// Batch seed initial data if cloud database is empty
export async function seedInitialDataToCloud(userId: string, initialItems: Production[]) {
  if (initialItems.length === 0) return;
  const batch = writeBatch(db);
  initialItems.forEach((item) => {
    const docRef = doc(db, 'users', userId, 'productions', item.id);
    const sanitized = sanitizeForFirestore(item);
    batch.set(docRef, sanitized, { merge: true });
  });
  await batch.commit();
}

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  type User
};
