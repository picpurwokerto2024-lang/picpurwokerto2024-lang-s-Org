import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initAutoUpdatePWA } from './services/pwaAutoUpdate';

// Initialize immediate background auto-update for PWA
initAutoUpdatePWA();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

