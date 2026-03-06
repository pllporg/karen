import type { FormEventHandler } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import type { StylePackCreateFormData } from '../../lib/schemas/ai-workspace';
import { DocumentVersionLookup, StylePack, StylePackDraft, StylePackSourceDoc } from './types';
import { formatUtcTimestamp } from './utils';

type StylePackManagerProps = {
  stylePacks: StylePack[];
  stylePackDrafts: Record<string, StylePackDraft>;
  busyStylePackId: string | null;
  documentVersionOptions: DocumentVersionLookup[];
  createFormRegister: UseFormRegister<StylePackCreateFormData>;
  createFormErrors: FieldErrors<StylePackCreateFormData>;
  createFormSubmitting: boolean;
  onCreateStylePack: FormEventHandler<HTMLFormElement>;
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
  createFormRegister,
  createFormErrors,
  createFormSubmitting,
  onCreateStylePack,
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
        <FormField label="Style Pack Name" name="style-pack-name" error={createFormErrors.name?.message} required>
          <Input
            placeholder="Style pack name"
            {...createFormRegister('name')}
            invalid={!!createFormErrors.name}
          />
        </FormField>
        <FormField label="Description" name="style-pack-description" error={createFormErrors.description?.message}>
          <Input
            placeholder="Description (optional)"
            {...createFormRegister('description')}
            invalid={!!createFormErrors.description}
          />
        </FormField>
        <Button type="submit" disabled={createFormSubmitting || busyStylePackId === 'new'}>
          {createFormSubmitting || busyStylePackId === 'new' ? 'Creating...' : 'Create Style Pack'}
        </Button>
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
