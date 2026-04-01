import { jobs } from '@/lib/mock-data';
import JobDetailPage from './DetailClient';

export function generateStaticParams() {
  return jobs.map(j => ({ id: j.id }));
}

export default function Page() {
  return <JobDetailPage />;
}
