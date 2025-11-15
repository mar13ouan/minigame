import { defineConfig } from 'vite';
import { randomFillSync, webcrypto as nodeWebcrypto } from 'node:crypto';

const ensureRandomValuesSupport = () => {
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    return;
  }

  const fallbackCrypto: Crypto = (nodeWebcrypto ?? {
    getRandomValues<T extends ArrayBufferView | null>(array: T): T {
      if (array === null) {
        throw new TypeError("Expected an ArrayBufferView, got null.");
      }

      if (!ArrayBuffer.isView(array)) {
        throw new TypeError('Expected input to be an ArrayBufferView.');
      }

      if (array.byteLength === 0) {
        return array;
      }

      const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
      randomFillSync(bytes);
      return array;
    }
  }) as Crypto;

  Object.defineProperty(globalThis, 'crypto', {
    value: fallbackCrypto,
    configurable: true
  });
};

ensureRandomValuesSupport();

export default defineConfig({
  server: {
    port: 5173,
    open: false
  }
});
