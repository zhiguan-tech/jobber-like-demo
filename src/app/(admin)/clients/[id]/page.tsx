import { clients } from '@/lib/mock-data';
import ClientDetailPage from './DetailClient';

export function generateStaticParams() {
  return clients.map(c => ({ id: c.id }));
}

export default function Page() {
  return <ClientDetailPage />;
}
