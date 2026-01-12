import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';
import { notFound } from 'next/navigation';

// Next.js 15 App Router dynamic route signature
type PageProps = {
  params?: Promise<{ id: string }>;
  searchParams?: any;
};

export default async function Page({ params }: PageProps) {
  const resolvedParams = params ? await params : { id: '' };
  const business = await requireBusiness();
  const supabase = await createClient();

  const { data: appointment, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', resolvedParams.id)
    .eq('business_id', business.id)
    .single();

  if (error || !appointment) {
    notFound();
  }

  // Render appointment details (customize as needed)
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Appointment Details</h1>
      <div className="mb-2"><strong>ID:</strong> {appointment.id}</div>
      <div className="mb-2"><strong>Client:</strong> {appointment.client_name || appointment.client_id}</div>
      <div className="mb-2"><strong>Date:</strong> {appointment.start_time}</div>
      <div className="mb-2"><strong>Status:</strong> {appointment.status}</div>
      {/* Add more fields as needed */}
    </div>
  );
}