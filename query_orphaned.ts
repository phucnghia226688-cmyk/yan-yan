import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const snap = await getDocs(collection(db, "clients"));
  const tenantsCount = {};
  snap.forEach(doc => {
    const t = doc.data().tenantId || 'default';
    tenantsCount[t] = (tenantsCount[t] || 0) + 1;
  });
  console.log("Clients by tenant: ", tenantsCount);
  process.exit(0);
}
check().catch(console.error);
