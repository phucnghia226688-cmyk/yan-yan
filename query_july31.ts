import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const snap = await getDocs(collection(db, "auditLogs"));
  snap.forEach(doc => {
    const data = doc.data();
    const d = new Date(data.timestamp);
    if (d.getDate() === 31 && d.getMonth() === 6) {
       console.log(`${d.toLocaleString('vi-VN')} - ${data.actionType} - ${data.summary}`);
    }
  });
  process.exit(0);
}
check().catch(console.error);
