import { z } from 'zod';

export const requiredString = z.string().min(1, 'This field is required.');

export const optionalString = z.string().optional().or(z.literal(''));

export const requiredEmail = z
  .string()
  .min(1, 'This field is required.')
  .email('Enter a valid email address.');

export const optionalEmail = z
  .string()
  .email('Enter a valid email address.')
  .optional()
  .or(z.literal(''));

export const requiredPhone = z.string().min(7, 'Enter a valid phone number.');

export const optionalPhone = z
  .string()
  .min(7, 'Enter a valid phone number.')
  .optional()
  .or(z.literal(''));

export const positiveNumber = z
  .coerce
  .number({ invalid_type_error: 'Enter a number.' })
  .positive('Enter a positive number.');

export const optionalPositiveNumber = z
  .coerce
  .number({ invalid_type_error: 'Enter a number.' })
  .positive('Enter a positive number.')
  .optional()
  .or(z.literal('').transform(() => undefined));

export const requiredDate = z.string().min(1, 'Select a date.');

export const optionalDate = z.string().optional().or(z.literal(''));
