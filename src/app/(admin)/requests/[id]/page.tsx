import { requests } from '@/lib/mock-data';
import RequestDetailPage from './DetailClient';

export function generateStaticParams() {
  return requests.map(r => ({ id: r.id }));
}

export default function Page() {
  return <RequestDetailPage />;
}
