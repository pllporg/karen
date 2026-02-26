import { Injectable } from '@nestjs/common';
import { isProductionLikeProfile } from './provider-readiness.util';

type ProviderStatusRow = {
  key: string;
  mode: string;
  provider: string;
  critical: boolean;
  healthy: boolean;
  issues: string[];
  checkedAt: string;
  detail: string;
  missingEnv?: string[];
};

@Injectable()
export class OpsService {
  providerStatus() {
    const checkedAt = new Date().toISOString();
    const profile = (process.env.RUNTIME_PROFILE || process.env.NODE_ENV || 'development').toLowerCase();
    const productionLike = isProductionLikeProfile(profile);
    const syncLiveEnabled = this.isEnabled(process.env.INTEGRATION_SYNC_ENABLE_LIVE);
    const providers: ProviderStatusRow[] = [];

    providers.push(
      this.row({
        key: 'stripe',
        mode: this.hasEnv('STRIPE_SECRET_KEY') ? 'live' : 'stub',
        critical: true,
        productionLike,
        checkedAt,
        supportedModes: ['live', 'stub'],
        missingEnv: this.collectMissing([
          {
            when: !this.hasEnv('STRIPE_SECRET_KEY'),
            name: 'STRIPE_SECRET_KEY',
          },
          {
            when: !this.hasEnv('STRIPE_WEBHOOK_SECRET'),
            name: 'STRIPE_WEBHOOK_SECRET',
          },
        ], productionLike || this.hasEnv('STRIPE_SECRET_KEY')),
        detail: `STRIPE_SECRET_KEY=${this.hasEnv('STRIPE_SECRET_KEY') ? 'set' : 'missing'}; STRIPE_WEBHOOK_SECRET=${
          this.hasEnv('STRIPE_WEBHOOK_SECRET') ? 'set' : 'missing'
        }`,
      }),
    );

    const emailMode = this.normalizeMode(process.env.MESSAGE_EMAIL_PROVIDER, 'stub');
    providers.push(
      this.row({
        key: 'email',
        mode: emailMode,
        critical: true,
        productionLike,
        checkedAt,
        supportedModes: ['stub', 'resend'],
        missingEnv: this.collectMissing(
          [
            {
              when:
                emailMode !== 'stub' &&
                (!this.hasEnv('RESEND_FROM_EMAIL') && !this.hasEnv('MESSAGE_DEFAULT_FROM_EMAIL')),
              name: 'RESEND_FROM_EMAIL|MESSAGE_DEFAULT_FROM_EMAIL',
            },
            {
              when: emailMode !== 'stub' && !this.hasEnv('RESEND_API_KEY'),
              name: 'RESEND_API_KEY',
            },
          ],
          emailMode !== 'stub',
        ),
        detail: `MESSAGE_EMAIL_PROVIDER=${process.env.MESSAGE_EMAIL_PROVIDER || 'stub'}`,
      }),
    );

    const smsMode = this.normalizeMode(process.env.MESSAGE_SMS_PROVIDER, 'stub');
    providers.push(
      this.row({
        key: 'sms',
        mode: smsMode,
        critical: true,
        productionLike,
        checkedAt,
        supportedModes: ['stub', 'twilio'],
        missingEnv: this.collectMissing(
          [
            {
              when: smsMode !== 'stub' && !this.hasEnv('TWILIO_ACCOUNT_SID'),
              name: 'TWILIO_ACCOUNT_SID',
            },
            {
              when: smsMode !== 'stub' && !this.hasEnv('TWILIO_AUTH_TOKEN'),
              name: 'TWILIO_AUTH_TOKEN',
            },
            {
              when:
                smsMode !== 'stub' &&
                (!this.hasEnv('TWILIO_FROM_PHONE') && !this.hasEnv('MESSAGE_DEFAULT_FROM_PHONE')),
              name: 'TWILIO_FROM_PHONE|MESSAGE_DEFAULT_FROM_PHONE',
            },
          ],
          smsMode !== 'stub',
        ),
        detail: `MESSAGE_SMS_PROVIDER=${process.env.MESSAGE_SMS_PROVIDER || 'stub'}`,
      }),
    );

    const malwareMode = this.normalizeMode(process.env.MALWARE_SCANNER_PROVIDER, 'stub');
    providers.push(
      this.row({
        key: 'malware_scanner',
        mode: malwareMode,
        critical: true,
        productionLike,
        checkedAt,
        supportedModes: ['stub', 'clamav'],
        missingEnv: this.collectMissing(
          [
            {
              when: malwareMode === 'clamav' && !this.hasEnv('CLAMAV_HOST'),
              name: 'CLAMAV_HOST',
            },
            {
              when: malwareMode === 'clamav' && this.isEnabled(process.env.MALWARE_SCANNER_FAIL_OPEN),
              name: 'MALWARE_SCANNER_FAIL_OPEN=false',
            },
          ],
          malwareMode === 'clamav',
        ),
        detail: `MALWARE_SCANNER_PROVIDER=${process.env.MALWARE_SCANNER_PROVIDER || 'stub'}; MALWARE_SCANNER_FAIL_OPEN=${
          process.env.MALWARE_SCANNER_FAIL_OPEN || 'false'
        }`,
      }),
    );

    const esignMode = this.normalizeMode(process.env.ESIGN_PROVIDER, 'stub');
    providers.push(
      this.row({
        key: 'esign',
        mode: esignMode,
        critical: true,
        productionLike,
        checkedAt,
        supportedModes: ['stub', 'sandbox'],
        missingEnv: this.collectMissing(
          [
            {
              when: esignMode === 'sandbox' && !this.hasEnv('ESIGN_SANDBOX_WEBHOOK_SECRET'),
              name: 'ESIGN_SANDBOX_WEBHOOK_SECRET',
            },
          ],
          esignMode === 'sandbox',
        ),
        detail: `ESIGN_PROVIDER=${process.env.ESIGN_PROVIDER || 'stub'}`,
      }),
    );

    const clioMode = this.resolveOauthMode('CLIO_LIVE_OAUTH');
    providers.push(
      this.row({
        key: 'clio',
        mode: clioMode,
        critical: true,
        productionLike,
        checkedAt,
        supportedModes: ['stub', 'live'],
        missingEnv: this.collectMissing(
          [
            {
              when: clioMode === 'live' && !this.hasLiveCredentialValue(process.env.CLIO_CLIENT_ID),
              name: 'CLIO_CLIENT_ID',
            },
            {
              when: clioMode === 'live' && !this.hasLiveCredentialValue(process.env.CLIO_CLIENT_SECRET),
              name: 'CLIO_CLIENT_SECRET',
            },
          ],
          clioMode === 'live',
        ),
        detail: `CLIO_LIVE_OAUTH=${process.env.CLIO_LIVE_OAUTH || 'false'}`,
      }),
    );

    const mycaseMode = this.resolveOauthMode('MYCASE_LIVE_OAUTH');
    providers.push(
      this.row({
        key: 'mycase',
        mode: mycaseMode,
        critical: true,
        productionLike,
        checkedAt,
        supportedModes: ['stub', 'live'],
        missingEnv: this.collectMissing(
          [
            {
              when: mycaseMode === 'live' && !this.hasLiveCredentialValue(process.env.MYCASE_CLIENT_ID),
              name: 'MYCASE_CLIENT_ID',
            },
            {
              when: mycaseMode === 'live' && !this.hasLiveCredentialValue(process.env.MYCASE_CLIENT_SECRET),
              name: 'MYCASE_CLIENT_SECRET',
            },
          ],
          mycaseMode === 'live',
        ),
        detail: `MYCASE_LIVE_OAUTH=${process.env.MYCASE_LIVE_OAUTH || 'false'}`,
      }),
    );

    providers.push(
      this.row({
        key: 'connectors_clio_webhooks',
        mode: syncLiveEnabled ? 'live' : 'stub',
        critical: syncLiveEnabled,
        productionLike,
        checkedAt,
        supportedModes: ['stub', 'live'],
        missingEnv: this.collectMissing(
          [
            {
              when: syncLiveEnabled && !this.hasLiveCredentialValue(process.env.CLIO_WEBHOOK_REGISTER_URL),
              name: 'CLIO_WEBHOOK_REGISTER_URL',
            },
          ],
          syncLiveEnabled,
        ),
        detail: `INTEGRATION_SYNC_ENABLE_LIVE=${process.env.INTEGRATION_SYNC_ENABLE_LIVE || 'false'}; CLIO_WEBHOOK_REGISTER_URL=${
          this.hasEnv('CLIO_WEBHOOK_REGISTER_URL') ? 'set' : 'missing'
        }`,
      }),
    );

    providers.push(
      this.row({
        key: 'connectors_mycase_webhooks',
        mode: syncLiveEnabled ? 'live' : 'stub',
        critical: syncLiveEnabled,
        productionLike,
        checkedAt,
        supportedModes: ['stub', 'live'],
        missingEnv: this.collectMissing(
          [
            {
              when: syncLiveEnabled && !this.hasLiveCredentialValue(process.env.MYCASE_WEBHOOK_REGISTER_URL),
              name: 'MYCASE_WEBHOOK_REGISTER_URL',
            },
          ],
          syncLiveEnabled,
        ),
        detail: `INTEGRATION_SYNC_ENABLE_LIVE=${process.env.INTEGRATION_SYNC_ENABLE_LIVE || 'false'}; MYCASE_WEBHOOK_REGISTER_URL=${
          this.hasEnv('MYCASE_WEBHOOK_REGISTER_URL') ? 'set' : 'missing'
        }`,
      }),
    );

    const healthy = providers.every((provider) => !provider.critical || provider.healthy);

    return {
      profile,
      healthy,
      evaluatedAt: checkedAt,
      providers,
    };
  }

  private row(input: {
    key: string;
    mode: string;
    critical: boolean;
    productionLike: boolean;
    checkedAt: string;
    detail: string;
    supportedModes: string[];
    missingEnv?: string[];
  }): ProviderStatusRow {
    const mode = this.normalizeMode(input.mode, 'stub');
    const supportedModes = input.supportedModes.map((candidate) => this.normalizeMode(candidate, candidate));
    const unsupportedMode = !supportedModes.includes(mode);
    const missingEnv = [...new Set((input.missingEnv || []).map((item) => String(item || '').trim()).filter(Boolean))];

    const issues: string[] = [];
    if (unsupportedMode) {
      issues.push(`Unsupported mode "${mode}" (supported: ${supportedModes.join(', ')})`);
    }
    if (input.critical && missingEnv.length > 0) {
      issues.push(`Missing required configuration: ${missingEnv.join(', ')}`);
    }
    if (input.critical && input.productionLike && (mode === 'stub' || mode === 'false' || mode === 'off')) {
      issues.push('Critical provider cannot run in stub mode for production-like profiles');
    }

    const healthy = issues.length === 0;

    const detailParts = [input.detail];
    if (issues.length > 0) {
      detailParts.push(issues.join('. '));
    }

    return {
      key: input.key,
      mode,
      provider: mode,
      critical: input.critical,
      healthy,
      issues,
      checkedAt: input.checkedAt,
      detail: detailParts.join('. '),
      missingEnv,
    };
  }

  private boolMode(raw: string | undefined) {
    if (this.isEnabled(raw)) {
      return 'live';
    }
    return 'stub';
  }

  private resolveOauthMode(providerFlagName: string): string {
    const providerFlag = String(process.env[providerFlagName] || '').trim();
    if (providerFlag.length > 0) {
      return this.boolMode(providerFlag);
    }
    return this.boolMode(process.env.INTEGRATION_OAUTH_ENABLE_LIVE);
  }

  private hasEnv(name: string): boolean {
    return String(process.env[name] || '').trim().length > 0;
  }

  private hasLiveCredentialValue(raw: string | undefined): boolean {
    const value = String(raw || '').trim();
    if (!value) {
      return false;
    }
    return !value.toLowerCase().startsWith('stub-');
  }

  private isEnabled(raw: string | undefined): boolean {
    const normalized = String(raw || '').trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
  }

  private normalizeMode(raw: string | undefined, fallback: string): string {
    const normalized = String(raw || '').trim().toLowerCase();
    return normalized || String(fallback || '').trim().toLowerCase();
  }

  private collectMissing(
    checks: Array<{
      when: boolean;
      name: string;
    }>,
    enabled = true,
  ): string[] {
    if (!enabled) {
      return [];
    }
    return checks.filter((item) => item.when).map((item) => item.name);
  }
}
