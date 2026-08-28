import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(20));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`${new Date(data.timestamp).toLocaleString('vi-VN')} - ${data.actionType} - ${data.summary}`);
  });
  process.exit(0);
}
check().catch(console.error);
