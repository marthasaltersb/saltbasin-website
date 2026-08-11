import crypto from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateTotpSecret(bytes = 20) {
  const input = crypto.randomBytes(bytes);
  let bits = '';
  for (const byte of input) bits += byte.toString(2).padStart(8, '0');
  let output = '';
  for (let i = 0; i < bits.length; i += 5) output += ALPHABET[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return output;
}

function decodeBase32(value) {
  const bits = [...String(value).replace(/=+$/g, '').toUpperCase()].map((char) => ALPHABET.indexOf(char).toString(2).padStart(5, '0')).join('');
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function totpCode(secret, at = Date.now(), stepSeconds = 30) {
  const counter = Math.floor(at / 1000 / stepSeconds);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', decodeBase32(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 15;
  const value = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(value).padStart(6, '0');
}

export function verifyTotp(secret, code, at = Date.now()) {
  const supplied = Buffer.from(String(code || '').padStart(6, '0'));
  return [-1, 0, 1].some((window) => {
    const expected = Buffer.from(totpCode(secret, at + window * 30_000));
    return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
  });
}

export function totpUri({ secret, email, issuer = 'Salt Basin Net Works' }) {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
