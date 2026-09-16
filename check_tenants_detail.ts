import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);
const auth = getAuth(app);

async function check() {
  await signInWithEmailAndPassword(auth, "admin@nbgym.com", "966966966");
  const tenants = await getDocs(collection(db, "tenant_accounts"));
  console.log("=== TENANTS ===");
  tenants.forEach(d => {
    console.log(d.id, d.data());
  });
  const emails = await getDocs(collection(db, "registered_emails"));
  console.log("=== EMAILS ===");
  emails.forEach(d => {
    console.log(d.id, d.data());
  });
}
check().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
