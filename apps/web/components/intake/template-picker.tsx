'use client';

export type EngagementTemplateOption = {
  id: string;
  name: string;
  detail: string;
};

export function TemplatePicker({
  options,
  selectedId,
  onSelect,
}: {
  options: EngagementTemplateOption[];
  selectedId: string;
  onSelect: (templateId: string) => void;
}) {
  return (
    <div className="card-grid engagement-template-grid">
      {options.map((option) => {
        const active = option.id === selectedId;
        return (
          <button
            key={option.id}
            type="button"
            className="engagement-template-card"
            data-active={active ? 'true' : undefined}
            onClick={() => onSelect(option.id)}
            aria-pressed={active}
          >
            <span className="engagement-template-name">{option.name}</span>
            <span className="engagement-template-detail">{option.detail}</span>
          </button>
        );
      })}
    </div>
  );
}
