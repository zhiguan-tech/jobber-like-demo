import { invoices } from '@/lib/mock-data';
import InvoiceDetailPage from './DetailClient';

export function generateStaticParams() {
  return invoices.map(i => ({ id: i.id }));
}

export default function Page() {
  return <InvoiceDetailPage />;
}
