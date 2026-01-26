import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { TimerProvider } from './context/TimerContext';

// Service worker: Disabled to prevent auto-reload loops during updates
/*
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({ immediate: true });
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((reg) => reg.unregister()));
    caches?.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
}
*/

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <TimerProvider>
      <App />
    </TimerProvider>
  </React.StrictMode>
);
