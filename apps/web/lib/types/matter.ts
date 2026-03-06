import { type MatterStatus } from './common';

export interface Participant {
  id: string;
  contactId: string;
  name: string;
  role: string;
  side: 'PLAINTIFF' | 'DEFENDANT' | 'NEUTRAL';
  representationLink?: string;
}

export interface Matter {
  id: string;
  matterNumber: string;
  name: string;
  practiceArea: string;
  status: MatterStatus;
  caseType?: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}
