import crypto from 'crypto';

const KEY_HEX = process.env.TOKEN_ENCRYPTION_KEY;

function getKey() {
  if (!KEY_HEX) throw new Error('TOKEN_ENCRYPTION_KEY is not set in .env');
  const buf = Buffer.from(KEY_HEX, 'hex');
  if (buf.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must be 64 hex chars (32 bytes)');
  return buf;
}

// AES-256-GCM encrypt. Returns "iv:authTag:ciphertext" as hex, colon-delimited.
export function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(blob) {
  if (!blob) return null;
  const key = getKey();
  const [ivHex, tagHex, ctHex] = blob.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const ct = Buffer.from(ctHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}

// Generate a ready-to-use key: node -e "require('./server/lib/crypto.js')"
// Or just: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
