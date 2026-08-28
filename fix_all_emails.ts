import { initializeApp } from "firebase/app";
import { getFirestore, getDocs, collection, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const snap = await getDocs(collection(db, "tenant_accounts"));
  for (const d of snap.docs) {
    const data = d.data();
    if (data.username) {
      const email = data.username.toLowerCase() + "@nbgym.com";
      await setDoc(doc(db, 'registered_emails', email), { valid: true, tenantId: data.id });
      console.log("Registered email for existing tenant:", email);
    }
  }
  process.exit(0);
}
run();
