'use client';

import { KVStack } from '../ui/kv-display';
import type { EngagementEnvelopeRecord } from '../../lib/intake/leads-api';

export function EngagementPreview({
  envelope,
  templateName,
  feeType,
  rate,
  retainerAmount,
  recipientName,
  recipientEmail,
  secondaryRecipients,
}: {
  envelope: EngagementEnvelopeRecord | null;
  templateName: string;
  feeType: string;
  rate?: number;
  retainerAmount?: number;
  recipientName: string;
  recipientEmail: string;
  secondaryRecipients: Array<{ name: string; email: string }>;
}) {
  return (
    <KVStack
      columns={2}
      pairs={[
        { label: 'Template', value: templateName || 'Not selected' },
        { label: 'Envelope', value: envelope?.id ?? 'Not generated' },
        { label: 'Status', value: envelope?.status ?? 'Not generated' },
        { label: 'Fee Type', value: feeType || 'Pending selection' },
        { label: 'Rate', value: rate ? `$${rate.toFixed(2)}` : 'Not set' },
        { label: 'Retainer', value: retainerAmount ? `$${retainerAmount.toFixed(2)}` : 'Not set' },
        { label: 'Primary Recipient', value: recipientName || 'Not set' },
        { label: 'Primary Email', value: recipientEmail || 'Not set' },
        {
          label: 'Secondary Recipients',
          value: secondaryRecipients.length
            ? secondaryRecipients.map((recipient) => `${recipient.name} <${recipient.email}>`).join(', ')
            : 'None',
        },
      ]}
    />
  );
}
