import { Membership, Permission, Role } from '@prisma/client';
import { Request } from 'express';

export type AuthenticatedUser = {
  id: string;
  email: string;
  organizationId: string;
  membership: Membership & { role: (Role & { permissions: Permission[] }) | null };
  permissions: string[];
};

export type RequestWithUser = Request & {
  user?: AuthenticatedUser;
};

export type UploadedFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};
