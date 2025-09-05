import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register service worker (respect Vite base path)
if ('serviceWorker' in navigator) {
  const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(location.hostname);
  window.addEventListener('load', async () => {
    if (isLocalhost) {
      // In local dev/preview, avoid SW interference; unregister any existing SWs
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      } catch {}
      return;
    }
    // Production: register SW with version to force updates on deploy
    const swUrl = `${import.meta.env.BASE_URL}service-worker.js?v=4`;
    navigator.serviceWorker.register(swUrl).catch(() => {});
  });
}
