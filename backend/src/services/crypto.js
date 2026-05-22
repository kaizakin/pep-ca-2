import crypto from 'node:crypto';
import { env } from '../config/env.js';

function getKey() {
  const raw = env.TOKEN_ENCRYPTION_KEY;
  const decoded = Buffer.from(raw, 'base64');

  if (decoded.length === 32) {
    return decoded;
  }

  return crypto.createHash('sha256').update(raw).digest();
}

export function encryptToken(token) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext: encrypted.toString('base64')
  };
}

export function decryptToken(encryptedToken) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getKey(),
    Buffer.from(encryptedToken.iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(encryptedToken.authTag, 'base64'));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedToken.ciphertext, 'base64')),
    decipher.final()
  ]).toString('utf8');
}

export function verifyGitHubSignature(payloadBuffer, signatureHeader, secret) {
  if (!secret || !signatureHeader) {
    return false;
  }

  const expected = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(payloadBuffer)
    .digest('hex')}`;

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signatureHeader);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}
