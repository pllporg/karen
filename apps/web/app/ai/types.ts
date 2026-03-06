export const TOOLS = [
  'case_summary',
  'timeline_extraction',
  'intake_evaluation',
  'demand_letter',
  'preservation_notice',
  'complaint_skeleton',
  'client_status_update',
  'discovery_generate',
  'discovery_response',
  'deadline_extraction',
  'next_best_action',
] as const;

export type DeadlineCandidate = {
  id: string;
  date: string;
  description: string;
  chunkId?: string;
  excerpt?: string;
};

export type ArtifactMetadata = {
  banner?: string;
  citations?: Array<{ chunkId: string }>;
  excerptEvidence?: Array<{ chunkId: string; excerpt: string }>;
  deadlineCandidates?: DeadlineCandidate[];
  executedAt?: string;
  stylePack?: {
    id: string;
    name: string;
    description?: string | null;
    sourceDocumentVersionIds?: string[];
    sourceDocCount?: number;
  } | null;
};

export type AiArtifact = {
  id: string;
  type: string;
  content: string;
  reviewedStatus: string;
  reviewedByUserId?: string | null;
  reviewedAt?: string | null;
  createdAt?: string;
  metadataJson?: ArtifactMetadata;
};

export type AiJob = {
  id: string;
  toolName: string;
  matterId: string;
  status: string;
  createdByUserId?: string | null;
  createdAt?: string;
  artifacts?: AiArtifact[];
};

export type DeadlineSelection = {
  selected: boolean;
  createTask: boolean;
  createEvent: boolean;
};

export type StylePackSourceDoc = {
  id: string;
  documentVersionId: string;
  documentVersion: {
    id: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
    document: {
      id: string;
      matterId: string;
      title: string;
    };
  };
};

export type StylePack = {
  id: string;
  name: string;
  description?: string | null;
  sourceDocs: StylePackSourceDoc[];
};

export type StylePackDraft = {
  name: string;
  description: string;
  documentVersionId: string;
};

export type MatterLookup = {
  id: string;
  matterNumber: string;
  name: string;
  label: string;
};

export type DocumentVersionLookup = {
  id: string;
  label: string;
  document: {
    id: string;
    matterId: string;
    title: string;
  };
};

export const REVIEW_GATE_SEQUENCE = ['PROPOSED', 'IN REVIEW', 'APPROVED', 'EXECUTED', 'RETURNED'] as const;
export type ReviewGateStep = (typeof REVIEW_GATE_SEQUENCE)[number];
