'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useParams } from 'next/navigation';
import type { z } from 'zod';
import { apiFetch } from '../../../../lib/api';
import { convertLead, getSetupChecklist, type Checklist } from '../../../../lib/intake/leads-api';
import { leadConvertSchema } from '../../../../lib/schemas/intake';

type LeadConvertFormValues = z.infer<typeof leadConvertSchema>;

export type FeedbackState = {
  tone: 'notice' | 'error';
  message: string;
  matterId?: string;
};

export type ParticipantRoleOption = {
  id: string;
  key: string;
  label: string;
  sideDefault?: 'CLIENT_SIDE' | 'OPPOSING_SIDE' | 'NEUTRAL' | 'COURT';
};

export type OrgUser = {
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

export function statusTone(complete: boolean) {
  return complete ? 'approved' : 'returned';
}

export function useLeadConvertPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId;
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [participantRoles, setParticipantRoles] = useState<ParticipantRoleOption[]>([]);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [seededFromChecklist, setSeededFromChecklist] = useState(false);

  const form = useForm<LeadConvertFormValues>({
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

  const { control, reset, setValue, watch, handleSubmit } = form;

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

    void load();

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

  return {
    leadId,
    checklist,
    participantRoles,
    orgUsers,
    loading,
    loadError,
    feedback,
    form,
    fields,
    participants,
    ethicalWallEnabled,
    deniedUserIds,
    onConvert,
    appendParticipant: () => append(createEmptyParticipant()),
    removeParticipant: remove,
    toggleDeniedUser,
  };
}

export type LeadConvertPageState = ReturnType<typeof useLeadConvertPage>;
