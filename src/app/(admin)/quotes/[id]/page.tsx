import { quotes } from '@/lib/mock-data';
import QuoteDetailPage from './DetailClient';

export function generateStaticParams() {
  return quotes.map(q => ({ id: q.id }));
}

export default function Page() {
  return <QuoteDetailPage />;
}
