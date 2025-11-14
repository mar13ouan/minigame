import { defineConfig } from 'vite';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto || typeof globalThis.crypto.getRandomValues !== 'function') {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true
  });
}

export default defineConfig({
  server: {
    port: 5173,
    open: false
  }
});
