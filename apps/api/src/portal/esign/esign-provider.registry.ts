import { UnprocessableEntityException } from '@nestjs/common';
import { EsignProvider } from './esign-provider.interface';
import { SandboxEsignProvider } from './sandbox-esign.provider';
import { StubEsignProvider } from './stub-esign.provider';

export class EsignProviderRegistry {
  private readonly providers = new Map<string, EsignProvider>();

  constructor() {
    for (const provider of [new StubEsignProvider(), new SandboxEsignProvider()]) {
      this.providers.set(provider.key, provider);
    }
  }

  defaultProviderKey(): string {
    return (process.env.ESIGN_PROVIDER || 'stub').trim().toLowerCase();
  }

  resolve(requestedProvider?: string): EsignProvider {
    const key = (requestedProvider || this.defaultProviderKey()).trim().toLowerCase();
    const provider = this.providers.get(key);
    if (!provider) {
      throw new UnprocessableEntityException(
        `Unsupported e-sign provider "${requestedProvider || key}". Available providers: ${this.available().join(', ')}`,
      );
    }
    return provider;
  }

  available(): string[] {
    return [...this.providers.keys()].sort();
  }
}
