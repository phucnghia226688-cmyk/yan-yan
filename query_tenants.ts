import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const snap = await getDocs(collection(db, "tenant_accounts"));
  console.log("Total tenant_accounts: ", snap.size);
  snap.forEach(doc => {
      console.log(doc.data().username);
  });
  process.exit(0);
}
check().catch(console.error);
