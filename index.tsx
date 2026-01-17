
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Surgical environment initialization for browser runtime
if (typeof window !== 'undefined') {
  const win = window as any;
  win.process = win.process || {};
  win.process.env = win.process.env || {};
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
