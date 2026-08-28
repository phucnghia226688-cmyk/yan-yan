import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId); // Use correct database ID

async function createAdmin() {
  try {
    await createUserWithEmailAndPassword(auth, 'admin@nbgym.com', '966966966');
    console.log("Auth user created");
  } catch (e: any) {
    if (e.code === 'auth/email-already-in-use') {
       console.log("Already exists, signing in");
       await signInWithEmailAndPassword(auth, 'admin@nbgym.com', '966966966');
    } else if (e.code === 'auth/operation-not-allowed') {
       console.error("ERROR: Email/Password authentication is not enabled in your Firebase project.");
       console.error("Please go to Firebase Console -> Authentication -> Sign-in method -> Enable Email/Password");
       process.exit(1);
    } else {
       console.error(e);
       process.exit(1);
    }
  }
  
  try {
    await setDoc(doc(db, 'registered_emails', 'admin@nbgym.com'), { email: 'admin@nbgym.com', tenantId: 'master-admin' }, { merge: true });
    await setDoc(doc(db, 'tenant_accounts', 'master-admin'), {
      id: 'master-admin',
      username: 'admin',
      password: '966966966',
      gymName: 'NBFit Master',
      ownerName: 'Admin Chủ Phòng',
      phone: '0935244966',
      role: 'admin',
      status: 'active',
      createdAt: '2026-01-01',
      expireDate: '2099-12-31',
      tenantId: 'master-admin',
      notes: 'Tài khoản Quản trị viên Master'
    }, { merge: true });
    console.log("Firestore docs created");
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
createAdmin();
