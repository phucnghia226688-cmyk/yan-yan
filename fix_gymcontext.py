import re

with open('src/context/GymContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """        try {
          await user.getIdToken(true); // force refresh token before sync
        } catch(e) {
          console.warn("Failed to refresh ID token", e);
        }"""
new_code = ""

content = content.replace(old_code, new_code)

with open('src/context/GymContext.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
