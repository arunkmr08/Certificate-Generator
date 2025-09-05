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
  window.addEventListener('load', () => {
    // Append a version to force update on deploys
    const swUrl = `${import.meta.env.BASE_URL}service-worker.js?v=4`;
    navigator.serviceWorker.register(swUrl).catch(() => {});
  });
}
