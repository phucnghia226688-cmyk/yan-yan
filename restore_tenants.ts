import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function restore() {
  const snap = await getDocs(collection(db, "clients"));
  const tenantsFound = new Set<string>();
  snap.forEach(d => {
    const t = d.data().tenantId;
    if (t && t !== 'default') {
       tenantsFound.add(t);
    }
  });

  const existingTenants = await getDocs(collection(db, "tenant_accounts"));
  const existingSet = new Set<string>();
  existingTenants.forEach(d => existingSet.add(d.id));

  for (const t of tenantsFound) {
     if (!existingSet.has(t)) {
        console.log("Restoring missing tenant:", t);
        const shortId = t.split('_').pop() || t;
        const newAccount = {
          id: t,
          tenantId: t,
          username: `user_${shortId}`,
          password: `pass_${shortId}`,
          gymName: `Phòng Tập ${shortId} (Phục Hồi)`,
          ownerName: `Chủ Phòng ${shortId}`,
          phone: "0000000000",
          role: 'tenant',
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0],
          expireDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          notes: 'Được phục hồi tự động sau sự cố.',
          maxClients: 100
        };
        await setDoc(doc(db, "tenant_accounts", t), newAccount);
     }
  }
  console.log("Done restoring tenants.");
  process.exit(0);
}
restore().catch(console.error);
