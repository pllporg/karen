'use client';

import { Input } from '../ui/input';

export type IntakeQueueTabKey = 'all' | 'new' | 'in-review' | 'conflict-hold' | 'ready';

export type IntakeQueueTab = {
  key: IntakeQueueTabKey;
  label: string;
  count: number;
};

export function IntakeQueueFilters({
  tabs,
  activeTab,
  onTabChange,
  searchValue,
  onSearchChange,
}: {
  tabs: IntakeQueueTab[];
  activeTab: IntakeQueueTabKey;
  onTabChange: (value: IntakeQueueTabKey) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="intake-queue-filters stack-3">
      <div aria-label="Lead stage filters" className="intake-queue-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === activeTab}
            className="intake-queue-tab"
            data-active={tab.key === activeTab ? 'true' : undefined}
            onClick={() => onTabChange(tab.key)}
          >
            <span>{tab.label}</span>
            <span className="intake-queue-tab-count" aria-hidden="true">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="intake-queue-toolbar">
        <div className="intake-queue-search">
          <label className="sr-only" htmlFor="intake-queue-search">
            Search leads
          </label>
          <Input
            id="intake-queue-search"
            placeholder="Search lead, source, or attorney"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <p className="intake-queue-toolbar-note mono-meta">25 per page</p>
      </div>
    </div>
  );
}
