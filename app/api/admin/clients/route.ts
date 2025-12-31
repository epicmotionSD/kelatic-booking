import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get clients with aggregate data
    const { data: clients, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        created_at,
        last_visit_at,
        hair_type,
        texture,
        allergies,
        birthday,
        zip_code,
        preferred_contact,
        sms_opt_in,
        marketing_opt_in,
        referral_source
      `)
      .eq('role', 'client')
      .order('last_visit_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }

    // Get visit counts and total spent for each client
    const clientIds = clients?.map((c) => c.id) || [];

    if (clientIds.length === 0) {
      return NextResponse.json({ clients: [] });
    }

    // Get completed appointments count and total spent
    const { data: appointmentStats } = await supabase
      .from('appointments')
      .select('client_id')
      .in('client_id', clientIds)
      .eq('status', 'completed');

    const { data: paymentStats } = await supabase
      .from('payments')
      .select('appointments!inner(client_id), total_amount')
      .in('appointments.client_id', clientIds)
      .eq('status', 'paid');

    // Calculate stats per client
    const visitCounts: Record<string, number> = {};
    const totalSpent: Record<string, number> = {};

    appointmentStats?.forEach((apt: any) => {
      visitCounts[apt.client_id] = (visitCounts[apt.client_id] || 0) + 1;
    });

    paymentStats?.forEach((payment: any) => {
      const clientId = payment.appointments?.client_id;
      if (clientId) {
        totalSpent[clientId] = (totalSpent[clientId] || 0) + payment.total_amount;
      }
    });

    const enrichedClients = clients?.map((client) => ({
      ...client,
      visit_count: visitCounts[client.id] || 0,
      total_spent: totalSpent[client.id] || 0,
    })) || [];

    return NextResponse.json({ clients: enrichedClients });
  } catch (error) {
    console.error('Clients error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createAdminClient();

    const email = body.email?.toLowerCase()?.trim() || null;

    // Check if email already exists (only if email provided)
    if (email) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    const { data: client, error } = await supabase
      .from('profiles')
      .insert({
        first_name: body.first_name,
        last_name: body.last_name,
        email: email,
        phone: body.phone || null,
        role: 'client',
        hair_type: body.hair_type || null,
        texture: body.texture || null,
        scalp_sensitivity: body.scalp_sensitivity || null,
        allergies: body.allergies || null,
        preferred_products: body.preferred_products || null,
        notes: body.notes || null,
        // New fields
        birthday: body.birthday || null,
        zip_code: body.zip_code || null,
        preferred_contact: body.preferred_contact || 'both',
        sms_opt_in: body.sms_opt_in ?? true,
        marketing_opt_in: body.marketing_opt_in ?? false,
        referral_source: body.referral_source || null,
        preferred_times: body.preferred_times || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Create client error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
