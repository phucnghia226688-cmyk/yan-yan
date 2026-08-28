import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const snap = await getDocs(collection(db, "clients"));
  console.log("Total clients: ", snap.size);
  const snap2 = await getDocs(collection(db, "tenants"));
  console.log("Total child accounts (tenants): ", snap2.size);
  process.exit(0);
}
check().catch(console.error);
