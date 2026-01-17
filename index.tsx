import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

/**
 * PERMANENT FIX FOR NETLIFY:
 * In browser environments, process.env is not natively available.
 * This shim captures the injected API_KEY and makes it available to the SDK.
 */
if (typeof window !== 'undefined') {
  const win = window as any;
  win.process = win.process || {};
  win.process.env = win.process.env || {};
  
  // Try to find the API key in all possible locations injected by Netlify/Vite/Web-loaders
  const discoveredKey = 
    win.process.env.API_KEY || 
    win.API_KEY || 
    (win.import?.meta?.env?.VITE_API_KEY);

  if (discoveredKey) {
    win.process.env.API_KEY = discoveredKey;
    console.debug("Lumina Engine: Secure key handshake successful.");
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);