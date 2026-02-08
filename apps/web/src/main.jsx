import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

const root = createRoot(document.getElementById('root'));
root.render(<App />);

if (typeof globalThis !== 'undefined') {
  globalThis.__VITE_ENV__ = import.meta.env;
}

if (import.meta.env.PROD) {
  registerSW({ immediate: true });
}
