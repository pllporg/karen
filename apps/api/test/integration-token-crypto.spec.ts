import { IntegrationTokenCryptoService } from '../src/integrations/integration-token-crypto.service';

describe('IntegrationTokenCryptoService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.INTEGRATION_TOKEN_ENCRYPTION_KEYS;
    delete process.env.INTEGRATION_TOKEN_ACTIVE_KEY_ID;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('encrypts and decrypts token with active key', () => {
    const key = Buffer.from('0123456789abcdef0123456789abcdef').toString('base64');
    process.env.INTEGRATION_TOKEN_ENCRYPTION_KEYS = `v1:${key}`;
    process.env.INTEGRATION_TOKEN_ACTIVE_KEY_ID = 'v1';
    const service = new IntegrationTokenCryptoService();

    const encrypted = service.encryptToken('secret-token');
    expect(encrypted).toBeTruthy();
    expect(encrypted).not.toContain('secret-token');
    expect(service.isEnvelopeFormat(encrypted)).toBe(true);

    const decrypted = service.decryptToken(encrypted);
    expect(decrypted).toBe('secret-token');
  });

  it('throws if encryption keys are missing', () => {
    const service = new IntegrationTokenCryptoService();
    expect(() => service.encryptToken('secret-token')).toThrow('Integration token encryption is not configured');
  });

  it('throws when envelope key id is unavailable', () => {
    const key = Buffer.from('0123456789abcdef0123456789abcdef').toString('base64');
    process.env.INTEGRATION_TOKEN_ENCRYPTION_KEYS = `v1:${key}`;
    process.env.INTEGRATION_TOKEN_ACTIVE_KEY_ID = 'v1';
    const service = new IntegrationTokenCryptoService();

    const encrypted = service.encryptToken('secret-token');
    process.env.INTEGRATION_TOKEN_ENCRYPTION_KEYS = `v2:${key}`;

    expect(() => service.decryptToken(encrypted)).toThrow('No decryption key found for key id: v1');
  });

  it('supports key rotation by decrypting old envelopes while encrypting new tokens with active key', () => {
    const keyV1 = Buffer.from('0123456789abcdef0123456789abcdef').toString('base64');
    const keyV2 = Buffer.from('fedcba9876543210fedcba9876543210').toString('base64');
    process.env.INTEGRATION_TOKEN_ENCRYPTION_KEYS = `v1:${keyV1},v2:${keyV2}`;
    process.env.INTEGRATION_TOKEN_ACTIVE_KEY_ID = 'v1';

    const service = new IntegrationTokenCryptoService();
    const oldEnvelope = service.encryptToken('legacy-token');
    expect(oldEnvelope).toContain('"kid":"v1"');

    process.env.INTEGRATION_TOKEN_ACTIVE_KEY_ID = 'v2';
    const rotatedEnvelope = service.encryptToken('new-token');
    expect(rotatedEnvelope).toContain('"kid":"v2"');

    expect(service.decryptToken(oldEnvelope)).toBe('legacy-token');
    expect(service.decryptToken(rotatedEnvelope)).toBe('new-token');
  });
});
