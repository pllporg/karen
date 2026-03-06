'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { Button } from '../../components/ui/button';
import { Card, CardGrid } from '../../components/ui/card';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { apiFetch } from '../../lib/api';
import {
  communicationSearchSchema,
  createCommunicationMessageSchema,
  type CommunicationSearchFormData,
  type CreateCommunicationMessageFormData,
} from '../../lib/schemas/communications';

type CommunicationThread = {
  id: string;
  subject?: string | null;
};

type CommunicationSearchResult = {
  id: string;
  subject?: string | null;
  body?: string | null;
};

export default function CommunicationsPage() {
  const [threads, setThreads] = useState<CommunicationThread[]>([]);
  const [searchResults, setSearchResults] = useState<CommunicationSearchResult[]>([]);
  const {
    register: registerMessageForm,
    handleSubmit: handleMessageSubmit,
    setValue: setMessageValue,
    getValues: getMessageValues,
    watch: watchMessageValues,
    formState: { errors: messageErrors, isSubmitting: savingMessage },
  } = useForm<CreateCommunicationMessageFormData>({
    resolver: zodResolver(createCommunicationMessageSchema),
    mode: 'onBlur',
    defaultValues: {
      threadId: '',
      body: 'Called opposing counsel regarding mediation slots.',
    },
  });
  const {
    register: registerSearchForm,
    handleSubmit: handleSearchSubmit,
    formState: { isSubmitting: searching },
  } = useForm<CommunicationSearchFormData>({
    resolver: zodResolver(communicationSearchSchema),
    mode: 'onBlur',
    defaultValues: {
      query: '',
    },
  });
  const threadId = watchMessageValues('threadId');

  const load = useCallback(async () => {
    const data = await apiFetch<CommunicationThread[]>('/communications/threads');
    setThreads(data);
    const currentThreadId = getMessageValues('threadId');
    if (!currentThreadId && data[0]?.id) {
      setMessageValue('threadId', data[0].id, { shouldValidate: true });
    }
  }, [getMessageValues, setMessageValue]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  async function createThread() {
    const created = await apiFetch<CommunicationThread>('/communications/threads', {
      method: 'POST',
      body: JSON.stringify({ subject: 'New Thread' }),
    });
    setMessageValue('threadId', created.id, { shouldDirty: true, shouldValidate: true });
    await load();
  }

  const addMessage = handleMessageSubmit(async (data) => {
    await apiFetch('/communications/messages', {
      method: 'POST',
      body: JSON.stringify({
        threadId: data.threadId,
        type: 'CALL_LOG',
        direction: 'OUTBOUND',
        body: data.body,
      }),
    });
    await load();
  });

  const search = handleSearchSubmit(async (data) => {
    if (!data.query.trim()) {
      setSearchResults([]);
      return;
    }
    const results = await apiFetch<CommunicationSearchResult[]>(
      `/communications/search?q=${encodeURIComponent(data.query.trim())}`,
    );
    setSearchResults(results);
  });

  return (
    <AppShell>
      <PageHeader title="Communications" subtitle="Manual logs for call/email/text/portal messages with matter-linkable threads." />
      <Card className="mb-3">
        <Button tone="secondary" type="button" onClick={createThread}>
          Create Thread
        </Button>
      </Card>
      <CardGrid>
        <Card>
          <h3>Threads</h3>
          <p className="mono-meta mb-2" role="status" aria-live="polite">
            Active thread: {threadId || 'None selected'}
          </p>
          <ul className="thread-list">
            {threads.map((thread) => (
              <li key={thread.id}>
                <button
                  className={`thread-select${threadId === thread.id ? ' is-active' : ''}`}
                  type="button"
                  onClick={() => setMessageValue('threadId', thread.id, { shouldDirty: true, shouldValidate: true })}
                  aria-pressed={threadId === thread.id}
                >
                  <span className="thread-subject">{thread.subject || thread.id}</span>
                  <span className="thread-meta mono-meta">{thread.id}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3>Log Message</h3>
          <form onSubmit={addMessage} className="stack-3">
            <FormField label="Communication Thread" name="threadId" error={messageErrors.threadId?.message} required>
              <Select aria-label="Communication Thread" {...registerMessageForm('threadId')} invalid={!!messageErrors.threadId}>
                <option value="">Select Thread</option>
                {threads.map((thread) => (
                  <option key={thread.id} value={thread.id}>
                    {thread.subject || thread.id}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Call Log" name="body" error={messageErrors.body?.message} required>
              <Textarea {...registerMessageForm('body')} rows={4} invalid={!!messageErrors.body} />
            </FormField>
            <div className="form-actions">
              <Button type="submit" disabled={savingMessage}>
                {savingMessage ? 'Working...' : 'Save Call Log'}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <h3>Keyword Search</h3>
          <form onSubmit={search} className="row-2">
            <Input {...registerSearchForm('query')} placeholder="Search communications..." />
            <Button tone="ghost" type="submit" disabled={searching}>
              {searching ? 'Working...' : 'Search'}
            </Button>
          </form>
          <p className="mono-meta mt-2" role="status" aria-live="polite">
            Results: {searchResults.length}
          </p>
          <ul className="mt-2">
            {searchResults.map((row) => (
              <li key={row.id}>
                {(row.subject || 'No subject').trim()} - {String(row.body || '').slice(0, 80)}
              </li>
            ))}
          </ul>
        </Card>
      </CardGrid>
    </AppShell>
  );
}
