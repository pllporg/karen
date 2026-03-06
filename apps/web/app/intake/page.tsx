'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { EmptyState } from '../../components/empty-state';
import { ErrorState } from '../../components/error-state';
import { IntakeQueueFilters, type IntakeQueueTab, type IntakeQueueTabKey } from '../../components/intake/intake-queue-filters';
import { LoadingState } from '../../components/loading-state';
import { PageHeader } from '../../components/page-header';
import { Badge } from '../../components/ui/badge';
import { Table, TableWrapper } from '../../components/ui/table';
import { useLeads } from '../../lib/hooks/use-leads';
import { type Lead } from '../../lib/types/lead';

const PAGE_SIZE = 25;

type QueueRow = Lead & {
  displayName: string;
  displayType: string;
  displayAttorney: string;
  portalOrigin: boolean;
};

function shortenId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'Unknown';

  const deltaMs = timestamp - Date.now();
  const absMs = Math.abs(deltaMs);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (absMs < 60_000) return formatter.format(Math.round(deltaMs / 1000), 'second');
  if (absMs < 3_600_000) return formatter.format(Math.round(deltaMs / 60_000), 'minute');
  if (absMs < 86_400_000) return formatter.format(Math.round(deltaMs / 3_600_000), 'hour');
  return formatter.format(Math.round(deltaMs / 86_400_000), 'day');
}

function isPortalOrigin(lead: Lead) {
  return lead.isPortalOrigin || /portal/i.test(lead.source);
}

function stageLabel(stage: string) {
  switch (stage) {
    case 'NEW':
    case 'DRAFT':
    case 'SUBMITTED':
      return 'NEW';
    case 'SCREENING':
    case 'IN_REVIEW':
      return 'IN REVIEW';
    case 'CONFLICT_CHECK':
    case 'CONFLICT_HOLD':
      return 'CONFLICT HOLD';
    case 'READY_TO_CONVERT':
    case 'RETAINED':
      return 'READY';
    case 'CONSULTATION':
    case 'ENGAGED_PENDING':
      return 'ENGAGEMENT';
    case 'CONVERTED':
      return 'CONVERTED';
    default:
      return stage.replace(/_/g, ' ');
  }
}

function stageTone(stage: string) {
  switch (stage) {
    case 'SCREENING':
    case 'IN_REVIEW':
      return 'in-review' as const;
    case 'CONFLICT_CHECK':
    case 'CONFLICT_HOLD':
      return 'blocked' as const;
    case 'READY_TO_CONVERT':
    case 'RETAINED':
      return 'approved' as const;
    case 'CONVERTED':
      return 'executed' as const;
    default:
      return 'proposed' as const;
  }
}

function matchesStage(tab: IntakeQueueTabKey, stage: string) {
  if (tab === 'all') return true;

  const normalized = stage.toUpperCase();

  if (tab === 'new') {
    return ['NEW', 'DRAFT', 'SUBMITTED'].includes(normalized);
  }

  if (tab === 'in-review') {
    return ['SCREENING', 'IN_REVIEW'].includes(normalized);
  }

  if (tab === 'conflict-hold') {
    return ['CONFLICT_CHECK', 'CONFLICT_HOLD'].includes(normalized);
  }

  return ['READY_TO_CONVERT', 'RETAINED'].includes(normalized);
}

function buildQueueRows(leads: Lead[]) {
  return leads.map<QueueRow>((lead) => {
    const portalOrigin = isPortalOrigin(lead);

    return {
      ...lead,
      displayName: lead.name?.trim() || `Lead ${shortenId(lead.id)}`,
      displayType: lead.type?.trim() || (portalOrigin ? 'PORTAL' : 'GENERAL'),
      displayAttorney: lead.attorneyName?.trim() || 'UNASSIGNED',
      portalOrigin,
    };
  });
}

export default function IntakeQueuePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<IntakeQueueTabKey>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useLeads({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    stage: activeTab === 'all' ? undefined : activeTab,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const rows = useMemo(() => buildQueueRows(data ?? []), [data]);

  const filteredRows = useMemo(() => {
    const query = debouncedSearch.toLowerCase();

    return rows.filter((lead) => {
      if (!matchesStage(activeTab, lead.stage)) return false;
      if (!query) return true;

      return [lead.displayName, lead.source, lead.displayAttorney, lead.id]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [activeTab, debouncedSearch, rows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== currentPage) {
      setPage(currentPage);
    }
  }, [currentPage, page]);

  const pagedRows = useMemo(() => {
    const offset = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(offset, offset + PAGE_SIZE);
  }, [currentPage, filteredRows]);

  const tabs = useMemo<IntakeQueueTab[]>(
    () => [
      { key: 'all', label: 'All', count: rows.length },
      { key: 'new', label: 'New', count: rows.filter((lead) => matchesStage('new', lead.stage)).length },
      { key: 'in-review', label: 'In Review', count: rows.filter((lead) => matchesStage('in-review', lead.stage)).length },
      { key: 'conflict-hold', label: 'Conflict Hold', count: rows.filter((lead) => matchesStage('conflict-hold', lead.stage)).length },
      { key: 'ready', label: 'Ready', count: rows.filter((lead) => matchesStage('ready', lead.stage)).length },
    ],
    [rows],
  );

  const showingFrom = filteredRows.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const showingTo = filteredRows.length ? Math.min(currentPage * PAGE_SIZE, filteredRows.length) : 0;

  return (
    <AppShell>
      <div className="intake-queue-shell">
        <PageHeader
          title="Intake Queue"
          subtitle="Lead staging queue with gated progression, search, and operator review filters."
          right={
            <Link className="button" href="/intake/new">
              New Lead
            </Link>
          }
        />

        <section className="card stack-4">
          <IntakeQueueFilters
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(value) => {
              setActiveTab(value);
              setPage(1);
            }}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
          />

          {loading ? <LoadingState label="Loading intake queue..." /> : null}
          {!loading && error ? <ErrorState message="Unable to load intake queue." onRetry={refetch} /> : null}

          {!loading && !error ? (
            <>
              {pagedRows.length ? (
                <>
                  <TableWrapper>
                    <Table>
                      <thead>
                        <tr>
                          <th>Lead</th>
                          <th>Source</th>
                          <th>Stage</th>
                          <th>Type</th>
                          <th>Attorney</th>
                          <th>Created</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedRows.map((lead) => (
                          <tr key={lead.id}>
                            <td>
                              <div className="intake-queue-lead">
                                <span className="intake-queue-lead-name">{lead.displayName}</span>
                                <span className="mono-meta">ID {shortenId(lead.id)}</span>
                              </div>
                            </td>
                            <td>
                              <span className="intake-queue-source">
                                {lead.portalOrigin ? <span aria-hidden="true">◆</span> : null}
                                <span>{lead.source}</span>
                              </span>
                            </td>
                            <td>
                              <Badge tone={stageTone(lead.stage)}>{stageLabel(lead.stage)}</Badge>
                            </td>
                            <td className="mono-meta">{lead.displayType}</td>
                            <td>{lead.displayAttorney}</td>
                            <td className="mono-meta">{formatRelativeTime(lead.createdAt)}</td>
                            <td>
                              <Link className="button ghost" href={`/intake/${lead.id}/intake`}>
                                Open
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </TableWrapper>

                  <div className="intake-queue-pagination">
                    <p className="mono-meta">
                      Showing {showingFrom}-{showingTo} of {filteredRows.length}
                    </p>
                    <div className="intake-queue-page-buttons">
                      <button
                        type="button"
                        className="button ghost"
                        onClick={() => setPage((value) => Math.max(1, value - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, index) => index + 1)
                        .slice(Math.max(0, currentPage - 3), Math.max(5, currentPage + 2))
                        .map((pageNumber) => (
                          <button
                            key={pageNumber}
                            type="button"
                            className={`button ${pageNumber === currentPage ? '' : 'ghost'}`}
                            onClick={() => setPage(pageNumber)}
                            aria-current={pageNumber === currentPage ? 'page' : undefined}
                          >
                            {pageNumber}
                          </button>
                        ))}
                      <button
                        type="button"
                        className="button ghost"
                        onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  message="No leads match the current filter."
                  action={{ label: 'Create Lead', onClick: () => router.push('/intake/new') }}
                />
              )}
            </>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
