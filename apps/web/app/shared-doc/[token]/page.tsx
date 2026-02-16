import { redirect } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

type SharedDocPageProps = {
  params: Promise<{ token: string }>;
};

export default async function SharedDocPage({ params }: SharedDocPageProps) {
  const { token } = await params;
  redirect(`${API_BASE}/documents/share/${token}`);
}
