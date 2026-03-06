import { FormEvent } from 'react';
import { DocumentVersionLookup, StylePack, StylePackDraft, StylePackSourceDoc } from './types';
import { formatUtcTimestamp } from './utils';

type StylePackManagerProps = {
  stylePacks: StylePack[];
  stylePackDrafts: Record<string, StylePackDraft>;
  busyStylePackId: string | null;
  documentVersionOptions: DocumentVersionLookup[];
  newStylePackName: string;
  newStylePackDescription: string;
  onCreateStylePack: (event: FormEvent) => Promise<void>;
  onNewStylePackNameChange: (value: string) => void;
  onNewStylePackDescriptionChange: (value: string) => void;
  onUpdateStylePackDraft: (stylePackId: string, key: keyof StylePackDraft, value: string) => void;
  onSaveStylePack: (stylePackId: string) => Promise<void>;
  onAttachStylePackSourceDoc: (stylePackId: string) => Promise<void>;
  onRemoveStylePackSourceDoc: (stylePackId: string, documentVersionId: string) => Promise<void>;
  resolveMatterLabel: (matterId: string | null | undefined) => string;
};

function renderSourceDocLabel(sourceDoc: StylePackSourceDoc): string {
  return `${sourceDoc.documentVersion.document.title} | Uploaded ${formatUtcTimestamp(sourceDoc.documentVersion.uploadedAt)}`;
}

export function StylePackManager({
  stylePacks,
  stylePackDrafts,
  busyStylePackId,
  documentVersionOptions,
  newStylePackName,
  newStylePackDescription,
  onCreateStylePack,
  onNewStylePackNameChange,
  onNewStylePackDescriptionChange,
  onUpdateStylePackDraft,
  onSaveStylePack,
  onAttachStylePackSourceDoc,
  onRemoveStylePackSourceDoc,
  resolveMatterLabel,
}: StylePackManagerProps) {
  return (
    <div className="card stack-3 mb-3">
      <h3>Style Packs (Admin)</h3>
      <form onSubmit={onCreateStylePack} className="ai-style-pack-create-form">
        <input
          className="input"
          value={newStylePackName}
          onChange={(event) => onNewStylePackNameChange(event.target.value)}
          placeholder="Style pack name"
        />
        <input
          className="input"
          value={newStylePackDescription}
          onChange={(event) => onNewStylePackDescriptionChange(event.target.value)}
          placeholder="Description (optional)"
        />
        <button className="button" type="submit" disabled={busyStylePackId === 'new'}>
          {busyStylePackId === 'new' ? 'Creating...' : 'Create Style Pack'}
        </button>
      </form>

      {stylePacks.length === 0 ? <div className="notice">No style packs yet.</div> : null}
      {stylePacks.map((stylePack) => {
        const draft = stylePackDrafts[stylePack.id] || {
          name: stylePack.name,
          description: stylePack.description || '',
          documentVersionId: '',
        };
        const isBusy = busyStylePackId === stylePack.id;
        return (
          <div key={stylePack.id} className="card ai-style-pack-card stack-2">
            <div className="ai-style-pack-edit-grid">
              <input
                className="input"
                value={draft.name}
                onChange={(event) => onUpdateStylePackDraft(stylePack.id, 'name', event.target.value)}
                placeholder="Style pack name"
              />
              <input
                className="input"
                value={draft.description}
                onChange={(event) => onUpdateStylePackDraft(stylePack.id, 'description', event.target.value)}
                placeholder="Description"
              />
              <button className="button secondary" type="button" disabled={isBusy} onClick={() => onSaveStylePack(stylePack.id)}>
                {isBusy ? 'Saving...' : 'Save'}
              </button>
            </div>

            <div className="ai-style-pack-source-grid">
              <select
                className="input"
                aria-label={`Style Pack Source Document ${stylePack.name}`}
                value={draft.documentVersionId}
                onChange={(event) => onUpdateStylePackDraft(stylePack.id, 'documentVersionId', event.target.value)}
              >
                <option value="">Select source document version</option>
                {documentVersionOptions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {`${version.document.title} | ${resolveMatterLabel(version.document.matterId)}`}
                  </option>
                ))}
              </select>
              <button
                className="button ghost"
                type="button"
                disabled={isBusy || !draft.documentVersionId}
                onClick={() => onAttachStylePackSourceDoc(stylePack.id)}
              >
                Attach Source Doc
              </button>
            </div>

            <div>
              <strong>Source Docs:</strong> {stylePack.sourceDocs.length}
            </div>
            {stylePack.sourceDocs.length > 0 ? (
              <div className="ai-source-doc-list">
                {stylePack.sourceDocs.map((sourceDoc) => (
                  <div key={sourceDoc.id} className="ai-source-doc-item">
                    <span>{renderSourceDocLabel(sourceDoc)}</span>
                    <button
                      className="button ghost ai-source-doc-remove"
                      type="button"
                      disabled={isBusy}
                      onClick={() => onRemoveStylePackSourceDoc(stylePack.id, sourceDoc.documentVersionId)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
