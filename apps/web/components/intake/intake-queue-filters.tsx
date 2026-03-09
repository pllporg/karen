'use client';

import { type KeyboardEvent } from 'react';
import { Input } from '../ui/input';

export type IntakeQueueTabKey = 'all' | 'new' | 'in-review' | 'conflict-hold' | 'ready';

export type IntakeQueueTab = {
  key: IntakeQueueTabKey;
  label: string;
  count: number;
};

function resolveNextTabIndex(currentIndex: number, eventKey: string, lastIndex: number) {
  if (eventKey === 'ArrowRight') {
    return currentIndex === lastIndex ? 0 : currentIndex + 1;
  }
  if (eventKey === 'ArrowLeft') {
    return currentIndex === 0 ? lastIndex : currentIndex - 1;
  }
  if (eventKey === 'Home') {
    return 0;
  }
  return lastIndex;
}

export function IntakeQueueFilters({
  tabs,
  activeTab,
  onTabChange,
  searchValue,
  onSearchChange,
  panelId = 'intake-queue-results-panel',
}: {
  tabs: IntakeQueueTab[];
  activeTab: IntakeQueueTabKey;
  onTabChange: (value: IntakeQueueTabKey) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  panelId?: string;
}) {
  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const nextIndex = resolveNextTabIndex(index, event.key, tabs.length - 1);
    const nextTab = tabs[nextIndex];
    if (!nextTab) return;

    onTabChange(nextTab.key);
    const tabButtons = event.currentTarget
      .closest('[role="tablist"]')
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabButtons?.[nextIndex]?.focus();
  }

  return (
    <div className="intake-queue-filters stack-3">
      <div aria-label="Lead stage filters" aria-orientation="horizontal" className="intake-queue-tabs" role="tablist">
        {tabs.map((tab, index) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              id={`intake-queue-tab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              className="intake-queue-tab"
              data-active={isActive ? 'true' : undefined}
              onClick={() => onTabChange(tab.key)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              <span>{tab.label}</span>
              <span className="intake-queue-tab-count" aria-hidden="true">
                {tab.count}
              </span>
            </button>
          );
        })}
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
