export interface Document {
  id: string;
  title: string;
  mimeType: string;
  sizeBytes: number;
  matterId?: string;
  retentionPolicy?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}
