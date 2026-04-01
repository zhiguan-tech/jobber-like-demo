import { tasks } from '@/lib/mock-data';
import DetailClient from './DetailClient';

export function generateStaticParams() {
  return tasks.map(t => ({ id: t.id }));
}

export default function Page() {
  return <DetailClient />;
}
