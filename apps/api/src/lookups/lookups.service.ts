import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/types';

@Injectable()
export class LookupsService {
  constructor(private readonly prisma: PrismaService) {}

  async matters(user: AuthenticatedUser, query?: string, limitRaw?: string) {
    const search = this.normalizeQuery(query);
    const limit = this.normalizeLimit(limitRaw);
    const matters = await this.prisma.matter.findMany({
      where: {
        organizationId: user.organizationId,
        ...(search
          ? {
              OR: [
                { matterNumber: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { practiceArea: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        matterNumber: true,
        name: true,
        status: true,
        practiceArea: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return matters.map((matter) => ({
      ...matter,
      label: `${matter.matterNumber} - ${matter.name}`,
    }));
  }

  async contacts(user: AuthenticatedUser, query?: string, limitRaw?: string) {
    const search = this.normalizeQuery(query);
    const limit = this.normalizeLimit(limitRaw);
    const contacts = await this.prisma.contact.findMany({
      where: {
        organizationId: user.organizationId,
        ...(search
          ? {
              OR: [
                { displayName: { contains: search, mode: 'insensitive' } },
                { primaryEmail: { contains: search, mode: 'insensitive' } },
                { primaryPhone: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        displayName: true,
        kind: true,
        primaryEmail: true,
        primaryPhone: true,
      },
      orderBy: { displayName: 'asc' },
      take: limit,
    });

    return contacts.map((contact) => ({
      ...contact,
      label: contact.displayName,
    }));
  }

  async trustAccounts(user: AuthenticatedUser, query?: string, limitRaw?: string) {
    const search = this.normalizeQuery(query);
    const limit = this.normalizeLimit(limitRaw);
    const accounts = await this.prisma.trustAccount.findMany({
      where: {
        organizationId: user.organizationId,
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      select: {
        id: true,
        name: true,
        bankName: true,
      },
      orderBy: { name: 'asc' },
      take: limit,
    });

    return accounts.map((account) => ({
      ...account,
      label: account.name,
    }));
  }

  async invoices(user: AuthenticatedUser, query?: string, limitRaw?: string, matterId?: string) {
    const search = this.normalizeQuery(query);
    const limit = this.normalizeLimit(limitRaw);
    const invoices = await this.prisma.invoice.findMany({
      where: {
        organizationId: user.organizationId,
        ...(matterId ? { matterId } : {}),
        ...(search
          ? {
              OR: [
                { invoiceNumber: { contains: search, mode: 'insensitive' } },
                { matter: { name: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        matterId: true,
        invoiceNumber: true,
        status: true,
        total: true,
        balanceDue: true,
        matter: {
          select: {
            name: true,
            matterNumber: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
      take: limit,
    });

    return invoices.map((invoice) => ({
      ...invoice,
      label: `${invoice.invoiceNumber} - ${invoice.matter?.matterNumber || invoice.matterId}`,
    }));
  }

  async documentVersions(user: AuthenticatedUser, query?: string, limitRaw?: string, matterId?: string) {
    const search = this.normalizeQuery(query);
    const limit = this.normalizeLimit(limitRaw);
    const versions = await this.prisma.documentVersion.findMany({
      where: {
        organizationId: user.organizationId,
        ...(matterId ? { document: { matterId } } : {}),
        ...(search
          ? {
              OR: [
                { storageKey: { contains: search, mode: 'insensitive' } },
                { document: { title: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        mimeType: true,
        size: true,
        uploadedAt: true,
        document: {
          select: {
            id: true,
            matterId: true,
            title: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
      take: limit,
    });

    return versions.map((version) => ({
      ...version,
      label: `${version.document.title} (${version.id})`,
    }));
  }

  private normalizeQuery(value?: string) {
    const trimmed = String(value || '').trim();
    return trimmed || undefined;
  }

  private normalizeLimit(value?: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 25;
    }
    return Math.min(200, Math.max(1, Math.floor(parsed)));
  }
}
