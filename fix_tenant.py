import re

with open('src/context/TenantContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """    // Ensure registered_emails & tenant_accounts docs exist on Firestore Cloud
    if (db) {
      try {
        await setDoc(doc(db, 'registered_emails', userEmail), {
          email: userEmail,
          tenantId: account.tenantId
        }, { merge: true });
        await setDoc(doc(db, 'tenant_accounts', account.id), account, { merge: true });
      } catch (e) {
        console.warn("Error writing registered_emails / tenant_accounts on login:", e);
      }
    }"""
new_code = """    // Removed unnecessary setDoc to Firestore on login to improve speed."""

content = content.replace(old_code, new_code)

with open('src/context/TenantContext.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
