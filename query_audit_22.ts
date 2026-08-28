import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const q = query(collection(db, "auditLogs"));
  const snap = await getDocs(q);
  let c = 0;
  snap.forEach(doc => {
    const data = doc.data();
    const d = new Date(data.timestamp);
    if (d.getHours() === 22) {
       console.log(`${d.toLocaleString('vi-VN')} - ${data.actionType} - ${data.summary} - ${data.tenantId}`);
       c++;
    }
  });
  console.log("Total logs at 22: ", c);
  process.exit(0);
}
check().catch(console.error);
