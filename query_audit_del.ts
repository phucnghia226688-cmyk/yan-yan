import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    const data = doc.data();
    if (data.actionType && data.actionType.includes("DELETE")) {
       console.log(`${new Date(data.timestamp).toLocaleString('vi-VN')} - ${data.actionType} - ${data.summary} - ${data.tenantId}`);
    }
  });
  process.exit(0);
}
check().catch(console.error);
