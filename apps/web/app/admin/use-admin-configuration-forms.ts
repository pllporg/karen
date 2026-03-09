'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { useAdminPage } from './use-admin-page';
import {
  adminConflictCheckSchema,
  adminConflictResolutionSchema,
  conflictProfileConfigSchema,
  customFieldConfigSchema,
  participantRoleConfigSchema,
  sectionConfigSchema,
  type AdminConflictCheckFormData,
  type AdminConflictResolutionFormData,
  type ConflictProfileConfigFormData,
  type CustomFieldConfigFormData,
  type ParticipantRoleConfigFormData,
  type SectionConfigFormData,
} from '../../lib/schemas/admin-config';

type AdminPageState = ReturnType<typeof useAdminPage>;

export function useAdminConfigurationForms(admin: Pick<
  AdminPageState,
  | 'conflictProfiles'
  | 'createConflictProfile'
  | 'createCustomField'
  | 'createParticipantRole'
  | 'createSection'
  | 'resolveConflictCheck'
  | 'runConflictCheck'
>) {
  const customFieldForm = useForm<CustomFieldConfigFormData>({
    resolver: zodResolver(customFieldConfigSchema),
    mode: 'onBlur',
    defaultValues: {
      key: 'project_address',
      label: 'Project Address',
    },
  });
  const sectionForm = useForm<SectionConfigFormData>({
    resolver: zodResolver(sectionConfigSchema),
    mode: 'onBlur',
    defaultValues: {
      name: 'Defect Summary',
    },
  });
  const participantRoleForm = useForm<ParticipantRoleConfigFormData>({
    resolver: zodResolver(participantRoleConfigSchema),
    mode: 'onBlur',
    defaultValues: {
      key: 'opposing_party',
      label: 'Opposing Party',
      sideDefault: 'OPPOSING_SIDE',
    },
  });
  const conflictProfileForm = useForm<ConflictProfileConfigFormData>({
    resolver: zodResolver(conflictProfileConfigSchema),
    mode: 'onBlur',
    defaultValues: {
      name: 'Construction Litigation Default',
      warnThreshold: '45',
      blockThreshold: '70',
    },
  });
  const conflictCheckForm = useForm<AdminConflictCheckFormData>({
    resolver: zodResolver(adminConflictCheckSchema),
    mode: 'onBlur',
    defaultValues: {
      queryText: 'Jane Doe',
      profileId: '',
    },
  });
  const conflictResolutionForm = useForm<AdminConflictResolutionFormData>({
    resolver: zodResolver(adminConflictResolutionSchema),
    mode: 'onBlur',
    defaultValues: {
      decision: 'WAIVE',
      rationale: 'Attorney override after review of unrelated prior engagement.',
    },
  });

  useEffect(() => {
    const currentProfileId = conflictCheckForm.getValues('profileId');
    if (!currentProfileId && admin.conflictProfiles[0]?.id) {
      conflictCheckForm.setValue('profileId', admin.conflictProfiles[0].id, { shouldDirty: false });
    }
  }, [admin.conflictProfiles, conflictCheckForm]);

  const submitCustomField = customFieldForm.handleSubmit(async (values) => {
    await admin.createCustomField(values);
    customFieldForm.reset({
      key: '',
      label: '',
    });
  });

  const submitSection = sectionForm.handleSubmit(async (values) => {
    await admin.createSection(values);
    sectionForm.reset({
      name: '',
    });
  });

  const submitParticipantRole = participantRoleForm.handleSubmit(async (values) => {
    await admin.createParticipantRole(values);
    participantRoleForm.reset({
      key: '',
      label: '',
      sideDefault: values.sideDefault,
    });
  });

  const submitConflictProfile = conflictProfileForm.handleSubmit(async (values) => {
    await admin.createConflictProfile(values);
  });

  const submitConflictCheck = conflictCheckForm.handleSubmit(async (values) => {
    await admin.runConflictCheck(values);
  });

  const resolveConflict = (checkId: string) =>
    conflictResolutionForm.handleSubmit(async (values) => {
      await admin.resolveConflictCheck(checkId, values);
    });

  return {
    customFieldForm,
    sectionForm,
    participantRoleForm,
    conflictProfileForm,
    conflictCheckForm,
    conflictResolutionForm,
    submitCustomField,
    submitSection,
    submitParticipantRole,
    submitConflictProfile,
    submitConflictCheck,
    resolveConflict,
  };
}

export type AdminConfigurationForms = ReturnType<typeof useAdminConfigurationForms>;
