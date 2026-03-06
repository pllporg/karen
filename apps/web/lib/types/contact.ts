export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  type: 'INDIVIDUAL' | 'ORGANIZATION';
  createdAt: string;
  updatedAt: string;
}
