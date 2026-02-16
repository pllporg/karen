import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

type TokenEnvelopeV1 = {
  v: 1;
  alg: 'aes-256-gcm';
  kid: string;
  iv: string;
  tag: string;
  ciphertext: string;
  createdAt: string;
};

@Injectable()
export class IntegrationTokenCryptoService {
  encryptToken(plaintext?: string | null): string | null {
    if (!plaintext) return null;

    const keyRing = this.parseKeyRing();
    if (keyRing.size === 0) {
      throw new Error(
        'Integration token encryption is not configured. Set INTEGRATION_TOKEN_ENCRYPTION_KEYS and INTEGRATION_TOKEN_ACTIVE_KEY_ID.',
      );
    }

    const activeKeyId = this.resolveActiveKeyId(keyRing);
    const key = keyRing.get(activeKeyId);
    if (!key) {
      throw new Error(`Active encryption key not found in key ring: ${activeKeyId}`);
    }

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    const envelope: TokenEnvelopeV1 = {
      v: 1,
      alg: 'aes-256-gcm',
      kid: activeKeyId,
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
      createdAt: new Date().toISOString(),
    };

    return JSON.stringify(envelope);
  }

  decryptToken(encrypted?: string | null): string | null {
    if (!encrypted) return null;
    const envelope = this.parseEnvelope(encrypted);
    if (!envelope) {
      throw new Error('Unsupported integration token format');
    }

    const keyRing = this.parseKeyRing();
    const key = keyRing.get(envelope.kid);
    if (!key) {
      throw new Error(`No decryption key found for key id: ${envelope.kid}`);
    }

    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  }

  isEnvelopeFormat(value?: string | null): boolean {
    if (!value) return false;
    return this.parseEnvelope(value) !== null;
  }

  private parseEnvelope(value: string): TokenEnvelopeV1 | null {
    try {
      const parsed = JSON.parse(value) as Partial<TokenEnvelopeV1>;
      if (
        parsed &&
        parsed.v === 1 &&
        parsed.alg === 'aes-256-gcm' &&
        typeof parsed.kid === 'string' &&
        typeof parsed.iv === 'string' &&
        typeof parsed.tag === 'string' &&
        typeof parsed.ciphertext === 'string'
      ) {
        return parsed as TokenEnvelopeV1;
      }
    } catch {
      return null;
    }
    return null;
  }

  private resolveActiveKeyId(keyRing: Map<string, Buffer>): string {
    const configured = String(process.env.INTEGRATION_TOKEN_ACTIVE_KEY_ID || '').trim();
    if (configured) {
      if (!keyRing.has(configured)) {
        throw new Error(`INTEGRATION_TOKEN_ACTIVE_KEY_ID "${configured}" is not present in key ring`);
      }
      return configured;
    }
    const first = keyRing.keys().next().value;
    if (!first) {
      throw new Error('Integration token encryption key ring is empty');
    }
    return first;
  }

  private parseKeyRing(): Map<string, Buffer> {
    const raw = String(process.env.INTEGRATION_TOKEN_ENCRYPTION_KEYS || '').trim();
    if (!raw) return new Map();

    const keyRing = new Map<string, Buffer>();
    const entries = raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    for (const entry of entries) {
      const separator = entry.indexOf(':');
      if (separator <= 0 || separator === entry.length - 1) {
        throw new Error(
          'Invalid INTEGRATION_TOKEN_ENCRYPTION_KEYS entry. Use format "key-id:base64-encoded-32-byte-key".',
        );
      }

      const keyId = entry.slice(0, separator).trim();
      const keyMaterial = entry.slice(separator + 1).trim();
      const key = Buffer.from(keyMaterial, 'base64');
      if (key.byteLength !== 32) {
        throw new Error(
          `Invalid key length for "${keyId}". Expected 32 bytes after base64 decoding, got ${key.byteLength}.`,
        );
      }
      keyRing.set(keyId, key);
    }

    return keyRing;
  }
}
