import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import config from './firebase-applet-config.json' with { type: "json" };
const app = initializeApp(config);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, config.firestoreDatabaseId !== '(default)' ? config.firestoreDatabaseId : undefined);
console.log(!!db);
