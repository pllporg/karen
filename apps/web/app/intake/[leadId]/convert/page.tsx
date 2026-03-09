'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { AppShell } from '../../../../components/app-shell';
import { PageHeader } from '../../../../components/page-header';
import { StageNav } from '../../../../components/intake/stage-nav';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Checkbox } from '../../../../components/ui/checkbox';
import { FormField } from '../../../../components/ui/form-field';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';
import { Textarea } from '../../../../components/ui/textarea';
import { apiFetch } from '../../../../lib/api';
import { Checklist, convertLead, getSetupChecklist } from '../../../../lib/intake/leads-api';
import { leadConvertSchema } from '../../../../lib/schemas/intake';

type LeadConvertFormValues = z.infer<typeof leadConvertSchema>;

type FeedbackState = {
  tone: 'notice' | 'error';
  message: string;
  matterId?: string;
};

type ParticipantRoleOption = {
  id: string;
  key: string;
  label: string;
  sideDefault?: 'CLIENT_SIDE' | 'OPPOSING_SIDE' | 'NEUTRAL' | 'COURT';
};

type OrgUser = {
  id: string;
  user: { id: string; email: string; fullName?: string | null };
  role?: { name: string } | null;
};

function createEmptyParticipant(): LeadConvertFormValues['participants'][number] {
  return {
    name: '',
    roleKey: 'client',
    side: 'CLIENT_SIDE',
    isPrimary: false,
    notes: '',
    existingContactId: '',
    representedByContactId: '',
    representedByName: '',
    lawFirmContactId: '',
    lawFirmName: '',
  };
}

function statusTone(complete: boolean) {
  return complete ? 'approved' : 'returned';
}

export default function LeadConvertPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId;
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [participantRoles, setParticipantRoles] = useState<ParticipantRoleOption[]>([]);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [seededFromChecklist, setSeededFromChecklist] = useState(false);
  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadConvertFormValues>({
    resolver: zodResolver(leadConvertSchema),
    defaultValues: {
      name: '',
      matterNumber: '',
      practiceArea: 'Construction Litigation',
      jurisdiction: '',
      venue: '',
      ethicalWallEnabled: false,
      ethicalWallNotes: '',
      deniedUserIds: [],
      participants: [createEmptyParticipant()],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'participants',
  });

  const ethicalWallEnabled = watch('ethicalWallEnabled');
  const deniedUserIds = watch('deniedUserIds');
  const participants = watch('participants');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setLoadError(null);

      try {
        const [checklistResult, usersResult, rolesResult] = await Promise.all([
          getSetupChecklist(leadId),
          apiFetch<OrgUser[]>('/admin/users'),
          apiFetch<ParticipantRoleOption[]>('/admin/participant-roles'),
        ]);

        if (!active) {
          return;
        }

        setChecklist(checklistResult);
        setOrgUsers(usersResult);
        setParticipantRoles(rolesResult);

        if (!seededFromChecklist) {
          const defaultParticipants =
            checklistResult.conversionPreview?.defaultParticipants?.map((participant) => ({
              ...createEmptyParticipant(),
              name: participant.name,
              roleKey: participant.roleKey,
              side: participant.side,
              isPrimary: participant.isPrimary,
              existingContactId: participant.existingContactId ?? '',
            })) ?? [];

          reset({
            name: checklistResult.conversionPreview?.suggestedMatterName ?? 'Construction Intake Matter',
            matterNumber: checklistResult.conversionPreview?.suggestedMatterNumber ?? `M-${new Date().getFullYear()}-LEAD`,
            practiceArea: 'Construction Litigation',
            jurisdiction: '',
            venue: '',
            ethicalWallEnabled: false,
            ethicalWallNotes: '',
            deniedUserIds: [],
            participants: defaultParticipants.length > 0 ? defaultParticipants : [createEmptyParticipant()],
          });
          setSeededFromChecklist(true);
        }
      } catch (error) {
        if (!active) {
          return;
        }
        setLoadError(error instanceof Error ? error.message : 'Unable to load conversion workspace.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [leadId, reset, seededFromChecklist]);

  const onConvert = handleSubmit(async (values) => {
    setFeedback(null);

    try {
      const result = await convertLead(leadId, values);
      setFeedback({
        tone: 'notice',
        message: `Matter ${result.matter.matterNumber} created at ${new Date().toLocaleString()}.`,
        matterId: result.matter.id,
      });
      setChecklist((current) => (current ? { ...current, readyToConvert: false, convertible: false } : current));
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to convert lead.',
      });
    }
  });

  const toggleDeniedUser = (userId: string, checked: boolean) => {
    const next = new Set(deniedUserIds);
    if (checked) {
      next.add(userId);
    } else {
      next.delete(userId);
    }
    setValue('deniedUserIds', [...next], { shouldDirty: true, shouldValidate: true });
  };

  return (
    <AppShell>
      <PageHeader title="Lead Conversion" subtitle="Review gate, participant seeding, and ethical wall before matter creation." />
      <StageNav leadId={leadId} active="convert" />

      {loading ? (
        <section className="card stack-3">
          <h2 className="type-section-title">Loading Conversion Workspace</h2>
          <p className="type-caption muted">Fetching checklist, participant roles, and organization users.</p>
        </section>
      ) : loadError ? (
        <section className="card stack-3">
          <h2 className="type-section-title">Conversion Workspace Unavailable</h2>
          <p className="error" role="alert">
            {loadError}
          </p>
        </section>
      ) : (
        <form className="stack-6" onSubmit={onConvert}>
          <section className="card stack-4">
            <div className="card-header">
              <div>
                <p className="card-module">GP-01-F</p>
                <h2 className="type-section-title">Conversion Gate</h2>
              </div>
              <Badge tone={checklist?.readyToConvert ? 'approved' : 'returned'}>
                {checklist?.readyToConvert ? 'READY TO CONVERT' : 'GATE BLOCKED'}
              </Badge>
            </div>

            <table aria-label="Data table" className="table">
              <thead>
                <tr>
                  <th scope="col">Checkpoint</th>
                  <th scope="col">Status</th>
                  <th scope="col">Evidence</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Intake Draft</td>
                  <td>
                    <Badge tone={statusTone(Boolean(checklist?.intakeDraftCreated))}>
                      {checklist?.intakeDraftCreated ? 'COMPLETE' : 'PENDING'}
                    </Badge>
                  </td>
                  <td>{checklist?.conversionPreview?.clientName ?? 'No draft summary available.'}</td>
                </tr>
                <tr>
                  <td>Conflict Resolution</td>
                  <td>
                    <Badge tone={statusTone(Boolean(checklist?.conflictResolved))}>
                      {checklist?.conflictResolved ? 'CLEARED' : 'OPEN'}
                    </Badge>
                  </td>
                  <td>{checklist?.conflictChecked ? 'Conflict check recorded.' : 'Conflict check not run.'}</td>
                </tr>
                <tr>
                  <td>Engagement</td>
                  <td>
                    <Badge tone={statusTone(Boolean(checklist?.engagementSigned))}>
                      {checklist?.engagementSigned ? 'SIGNED' : 'UNSIGNED'}
                    </Badge>
                  </td>
                  <td>{checklist?.engagementSent ? 'Envelope sent to recipient.' : 'Envelope still in review.'}</td>
                </tr>
              </tbody>
            </table>

            {checklist?.conversionPreview ? (
              <div className="convert-preview-grid">
                <div className="stack-2">
                  <p className="type-label">Client Record</p>
                  <p className="type-caption">{checklist.conversionPreview.clientName || 'Unnamed client'}</p>
                  {checklist.conversionPreview.clientEmail ? (
                    <p className="type-caption muted">{checklist.conversionPreview.clientEmail}</p>
                  ) : null}
                  {checklist.conversionPreview.clientPhone ? (
                    <p className="type-caption muted">{checklist.conversionPreview.clientPhone}</p>
                  ) : null}
                </div>
                <div className="stack-2">
                  <p className="type-label">Property Record</p>
                  <p className="type-caption">
                    {checklist.conversionPreview.propertyAddress || 'No property address recorded in intake draft.'}
                  </p>
                </div>
              </div>
            ) : null}
          </section>

          <section className="card stack-4">
            <div className="card-header">
              <div>
                <p className="card-module">Matter Record</p>
                <h2 className="type-section-title">Matter Details</h2>
              </div>
            </div>

            <div className="form-grid-2">
              <FormField label="Matter Name" name="matter-name" error={errors.name?.message} required>
                <Input {...register('name')} invalid={Boolean(errors.name)} />
              </FormField>
              <FormField label="Matter Number" name="matter-number" error={errors.matterNumber?.message} required>
                <Input {...register('matterNumber')} invalid={Boolean(errors.matterNumber)} />
              </FormField>
            </div>

            <div className="form-grid-3">
              <FormField label="Practice Area" name="practice-area" error={errors.practiceArea?.message} required>
                <Input {...register('practiceArea')} invalid={Boolean(errors.practiceArea)} />
              </FormField>
              <FormField label="Jurisdiction" name="jurisdiction" error={errors.jurisdiction?.message}>
                <Input {...register('jurisdiction')} invalid={Boolean(errors.jurisdiction)} />
              </FormField>
              <FormField label="Venue" name="venue" error={errors.venue?.message}>
                <Input {...register('venue')} invalid={Boolean(errors.venue)} />
              </FormField>
            </div>
          </section>

          <section className="card stack-4">
            <div className="card-header">
              <div>
                <p className="card-module">Participant Graph</p>
                <h2 className="type-section-title">Participants and Representation</h2>
              </div>
              <Button
                type="button"
                tone="secondary"
                onClick={() => append(createEmptyParticipant())}
              >
                Add Participant
              </Button>
            </div>

            {errors.participants?.message ? (
              <p className="error" role="alert">
                {errors.participants.message}
              </p>
            ) : null}

            <table aria-label="Data table" className="table">
              <thead>
                <tr>
                  <th scope="col">Participant</th>
                  <th scope="col">Role</th>
                  <th scope="col">Side</th>
                  <th scope="col">Representation</th>
                  <th scope="col">Primary</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const roleKey = participants?.[index]?.roleKey ?? '';
                  const counselRole = /(counsel|attorney|lawyer)/i.test(roleKey);

                  return (
                    <tr key={field.id}>
                      <td>
                        <div className="stack-2">
                          <FormField
                            label="Name"
                            name={`participant-${index}-name`}
                            error={errors.participants?.[index]?.name?.message}
                            required
                          >
                            <Input
                              {...register(`participants.${index}.name` as const)}
                              invalid={Boolean(errors.participants?.[index]?.name)}
                            />
                          </FormField>
                          <FormField
                            label="Notes"
                            name={`participant-${index}-notes`}
                            error={errors.participants?.[index]?.notes?.message}
                          >
                            <Textarea
                              rows={2}
                              {...register(`participants.${index}.notes` as const)}
                              invalid={Boolean(errors.participants?.[index]?.notes)}
                            />
                          </FormField>
                        </div>
                      </td>
                      <td>
                        <FormField
                          label="Role"
                          name={`participant-${index}-role`}
                          error={errors.participants?.[index]?.roleKey?.message}
                          required
                        >
                          <Select
                            {...register(`participants.${index}.roleKey` as const)}
                            invalid={Boolean(errors.participants?.[index]?.roleKey)}
                            onChange={(event) => {
                              const nextRoleKey = event.target.value;
                              const nextRole = participantRoles.find((role) => role.key === nextRoleKey);
                              setValue(`participants.${index}.roleKey`, nextRoleKey, {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                              if (nextRole?.sideDefault) {
                                setValue(`participants.${index}.side`, nextRole.sideDefault, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                              }
                              if (/(counsel|attorney|lawyer)/i.test(nextRoleKey)) {
                                setValue(`participants.${index}.representedByName`, '', {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                              } else {
                                setValue(`participants.${index}.lawFirmName`, '', {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                              }
                            }}
                          >
                            {participantRoles.map((role) => (
                              <option key={role.id} value={role.key}>
                                {role.label}
                              </option>
                            ))}
                          </Select>
                        </FormField>
                      </td>
                      <td>
                        <FormField
                          label="Side"
                          name={`participant-${index}-side`}
                          error={errors.participants?.[index]?.side?.message}
                          required
                        >
                          <Select
                            {...register(`participants.${index}.side` as const)}
                            invalid={Boolean(errors.participants?.[index]?.side)}
                          >
                            <option value="CLIENT_SIDE">Client Side</option>
                            <option value="OPPOSING_SIDE">Opposing Side</option>
                            <option value="NEUTRAL">Neutral</option>
                            <option value="COURT">Court</option>
                          </Select>
                        </FormField>
                      </td>
                      <td>
                        {counselRole ? (
                          <FormField
                            label="Law Firm"
                            name={`participant-${index}-law-firm`}
                            error={errors.participants?.[index]?.lawFirmName?.message}
                          >
                            <Input
                              {...register(`participants.${index}.lawFirmName` as const)}
                              invalid={Boolean(errors.participants?.[index]?.lawFirmName)}
                              placeholder="Firm or carrier counsel group"
                            />
                          </FormField>
                        ) : (
                          <FormField
                            label="Represented By"
                            name={`participant-${index}-represented-by`}
                            error={errors.participants?.[index]?.representedByName?.message}
                          >
                            <Input
                              {...register(`participants.${index}.representedByName` as const)}
                              invalid={Boolean(errors.participants?.[index]?.representedByName)}
                              placeholder="Counsel or representative name"
                            />
                          </FormField>
                        )}
                      </td>
                      <td>
                        <Checkbox
                          checked={Boolean(participants?.[index]?.isPrimary)}
                          onChange={(checked) =>
                            setValue(`participants.${index}.isPrimary`, checked, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                          label="Primary"
                        />
                      </td>
                      <td>
                        <Button
                          type="button"
                          tone="ghost"
                          disabled={fields.length === 1}
                          onClick={() => remove(index)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className="card stack-4">
            <div className="card-header">
              <div>
                <p className="card-module">Access Policy</p>
                <h2 className="type-section-title">Ethical Wall</h2>
              </div>
              <Badge tone={ethicalWallEnabled ? 'in-review' : 'default'}>
                {ethicalWallEnabled ? 'ENABLED' : 'STANDARD TEAM ACCESS'}
              </Badge>
            </div>

            <Checkbox
              checked={ethicalWallEnabled}
              onChange={(checked) =>
                setValue('ethicalWallEnabled', checked, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              label="Enable ethical wall review on matter creation"
            />

            <FormField label="Wall Notes" name="ethical-wall-notes" error={errors.ethicalWallNotes?.message}>
              <Textarea
                rows={3}
                {...register('ethicalWallNotes')}
                invalid={Boolean(errors.ethicalWallNotes)}
                placeholder="Reason, review notes, or staffing constraint."
              />
            </FormField>

            {ethicalWallEnabled ? (
              <div className="stack-3">
                <p className="type-label">Deny List</p>
                <p className="type-caption muted">
                  The converting user remains on the matter team. Any selected user below will be denied by default.
                </p>
                <div className="convert-deny-grid">
                  {orgUsers.map((membership) => (
                    <Checkbox
                      key={membership.id}
                      checked={deniedUserIds.includes(membership.user.id)}
                      onChange={(checked) => toggleDeniedUser(membership.user.id, checked)}
                      label={`${membership.user.fullName || membership.user.email} · ${membership.role?.name || 'User'}`}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {feedback ? (
            <section className="card stack-3">
              <p
                className={feedback.tone === 'error' ? 'error' : 'notice'}
                role={feedback.tone === 'error' ? 'alert' : 'status'}
              >
                {feedback.message}
              </p>
              {feedback.matterId ? (
                <div className="form-actions">
                  <Link href={`/matters/${feedback.matterId}`} className="button">
                    Open Matter Dashboard
                  </Link>
                </div>
              ) : null}
            </section>
          ) : null}

          <div className="form-actions">
            <Button type="submit" disabled={!checklist?.readyToConvert || isSubmitting}>
              {isSubmitting ? 'Converting...' : 'Convert Lead to Matter'}
            </Button>
          </div>
        </form>
      )}
    </AppShell>
  );
}
