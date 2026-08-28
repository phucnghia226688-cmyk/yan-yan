import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const snap = await getDocs(collection(db, "clients"));
  let c = 0;
  snap.forEach(doc => {
      if(c < 5) console.log(doc.data().clientName, doc.data().tenantId);
      c++;
  });
  process.exit(0);
}
check().catch(console.error);
