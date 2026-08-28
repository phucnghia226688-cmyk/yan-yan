import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Factory reset for v2 auth flow
if (!localStorage.getItem('v2_auth_reset_done')) {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('v2_auth_reset_done', 'true');
}

import { auth } from './lib/firebase';
import { setPersistence, browserSessionPersistence } from 'firebase/auth';

// Ensure session persists in the same tab but not across tabs/restarts
setPersistence(auth, browserSessionPersistence).catch(console.error);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

