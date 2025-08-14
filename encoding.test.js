import assert from 'node:assert/strict';
import test from 'node:test';
import { base64ToString, stringToBase64 } from './encoding.js';

test('base64 helpers round-trip non-ASCII text', () => {
  const txt = 'Héllo 🌍';
  const encoded = stringToBase64(txt);
  const decoded = base64ToString(encoded);
  assert.equal(decoded, txt);
});
