export function stringToUint8Array(str) {
  return new TextEncoder().encode(str);
}

export function uint8ArrayToString(arr) {
  return new TextDecoder().decode(arr);
}

export function stringToBase64(str) {
  const bytes = stringToUint8Array(str);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export function base64ToString(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return uint8ArrayToString(bytes);
}
