import { FormEvent } from 'react';
import { MatterLookup, StylePack } from './types';

type JobCreatorFormProps = {
  matterOptions: MatterLookup[];
  stylePacks: StylePack[];
  selectedMatterId: string;
  toolName: string;
  selectedStylePackId: string;
  tools: readonly string[];
  onSubmit: (event: FormEvent) => Promise<void>;
  onMatterChange: (value: string) => void;
  onToolChange: (value: string) => void;
  onStylePackChange: (value: string) => void;
};

export function JobCreatorForm({
  matterOptions,
  stylePacks,
  selectedMatterId,
  toolName,
  selectedStylePackId,
  tools,
  onSubmit,
  onMatterChange,
  onToolChange,
  onStylePackChange,
}: JobCreatorFormProps) {
  return (
    <div className="card mb-3">
      <form onSubmit={onSubmit} className="ai-job-create-form">
        <select className="select" aria-label="AI Matter" value={selectedMatterId} onChange={(event) => onMatterChange(event.target.value)}>
          <option value="">Select matter</option>
          {matterOptions.map((matter) => (
            <option key={matter.id} value={matter.id}>
              {matter.label}
            </option>
          ))}
        </select>
        <select className="select" value={toolName} onChange={(event) => onToolChange(event.target.value)}>
          {tools.map((tool) => (
            <option key={tool} value={tool}>
              {tool}
            </option>
          ))}
        </select>
        <select className="select" value={selectedStylePackId} onChange={(event) => onStylePackChange(event.target.value)}>
          <option value="">No style pack</option>
          {stylePacks.map((stylePack) => (
            <option key={stylePack.id} value={stylePack.id}>
              {stylePack.name}
            </option>
          ))}
        </select>
        <button className="button" type="submit">
          Create AI Job
        </button>
      </form>
    </div>
  );
}
