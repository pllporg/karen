import { Dispatch, SetStateAction } from 'react';

type DocumentsPanelProps = {
  dashboard: any;
  documentTitle: string;
  setDocumentTitle: Dispatch<SetStateAction<string>>;
  setDocumentFile: Dispatch<SetStateAction<File | null>>;
  setDocumentVersionFiles: Dispatch<SetStateAction<Record<string, File | null>>>;
  documentStatusMessage: string | null;
  uploadMatterDocument: () => Promise<void>;
  uploadMatterDocumentVersion: (documentId: string) => Promise<void>;
  toggleMatterDocumentSharing: (documentId: string, sharedWithClient: boolean) => Promise<void>;
  createMatterDocumentShareLink: (documentId: string) => Promise<void>;
  issueLatestDocumentDownload: (documentId: string, latestVersionId?: string | null) => Promise<void>;
};

export function DocumentsPanel({
  dashboard,
  documentTitle,
  setDocumentTitle,
  setDocumentFile,
  setDocumentVersionFiles,
  documentStatusMessage,
  uploadMatterDocument,
  uploadMatterDocumentVersion,
  toggleMatterDocumentSharing,
  createMatterDocumentShareLink,
  issueLatestDocumentDownload,
}: DocumentsPanelProps) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Documents</h3>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr auto' }}>
        <input
          className="input"
          aria-label="Matter Document Title"
          placeholder="Document title"
          value={documentTitle}
          onChange={(event) => setDocumentTitle(event.target.value)}
        />
        <input
          className="input"
          aria-label="Matter Document File"
          type="file"
          onChange={(event) => setDocumentFile(event.target.files?.[0] || null)}
        />
        <button className="button" type="button" onClick={uploadMatterDocument}>
          Upload Document
        </button>
      </div>
      {documentStatusMessage ? (
        <p style={{ marginTop: 8, color: 'var(--lic-text-muted)' }}>{documentStatusMessage}</p>
      ) : null}
      <table className="table" style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Versions</th>
            <th>Shared</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(dashboard.documents || []).map((doc: any) => (
            <tr key={doc.id}>
              <td>{doc.title}</td>
              <td>{doc.versions?.length || 0}</td>
              <td>{doc.sharedWithClient ? 'Yes' : 'No'}</td>
              <td>
                <div style={{ display: 'grid', gap: 8 }}>
                  <input
                    className="input"
                    aria-label={`Document Version File ${doc.id}`}
                    type="file"
                    onChange={(event) =>
                      setDocumentVersionFiles((current) => ({
                        ...current,
                        [doc.id]: event.target.files?.[0] || null,
                      }))
                    }
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      className="button secondary"
                      type="button"
                      aria-label={`Upload Document Version ${doc.id}`}
                      onClick={() => uploadMatterDocumentVersion(doc.id)}
                    >
                      Upload Version
                    </button>
                    <button
                      className="button secondary"
                      type="button"
                      aria-label={`Toggle Document Sharing ${doc.id}`}
                      onClick={() => toggleMatterDocumentSharing(doc.id, Boolean(doc.sharedWithClient))}
                    >
                      {doc.sharedWithClient ? 'Disable Sharing' : 'Enable Sharing'}
                    </button>
                    <button
                      className="button secondary"
                      type="button"
                      aria-label={`Create Document Share Link ${doc.id}`}
                      onClick={() => createMatterDocumentShareLink(doc.id)}
                    >
                      Create Share Link
                    </button>
                    <button
                      className="button secondary"
                      type="button"
                      aria-label={`Issue Document Download URL ${doc.id}`}
                      onClick={() => issueLatestDocumentDownload(doc.id, doc.versions?.[0]?.id || null)}
                    >
                      Download Latest
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
          {(dashboard.documents || []).length === 0 ? (
            <tr>
              <td colSpan={4}>No documents for this matter yet.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
