import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const snap = await getDocs(query(collection(db, "clients"), limit(2)));
  snap.forEach(doc => {
      console.log(JSON.stringify(doc.data(), null, 2));
  });
  process.exit(0);
}
check().catch(console.error);
