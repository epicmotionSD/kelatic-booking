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
        allergies
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
      .eq('status', 'succeeded');

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

    // Check if email already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', body.email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const { data: client, error } = await supabase
      .from('profiles')
      .insert({
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email.toLowerCase(),
        phone: body.phone,
        role: 'client',
        hair_type: body.hair_type,
        texture: body.texture,
        scalp_sensitivity: body.scalp_sensitivity,
        allergies: body.allergies,
        preferred_products: body.preferred_products,
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
