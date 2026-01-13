import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';

export async function GET() {
  try {
    const business = await requireBusiness();
    const supabase = await createClient();

    // Get clients from profiles table (authenticated users)
    const { data: profileClients, error: profileError } = await supabase
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
      .eq('business_id', business.id)
      .order('last_visit_at', { ascending: false, nullsFirst: false });

    if (profileError) {
      console.error('Error fetching profile clients:', profileError);
    }

    // Get clients from clients table (imported from Amelia / walk-ins)
    const { data: importedClients, error: importedError } = await supabase
      .from('clients')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        created_at,
        notes,
        birthday,
        source,
        amelia_id
      `)
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });

    if (importedError) {
      console.error('Error fetching imported clients:', importedError);
    }

    // Combine both lists, marking the source
    const allClients = [
      ...(profileClients || []).map(c => ({ 
        ...c, 
        source: 'registered',
        visit_count: 0,
        total_spent: 0 
      })),
      ...(importedClients || []).map(c => ({ 
        ...c, 
        source: c.source || 'imported',
        last_visit_at: null,
        hair_type: null,
        texture: null,
        allergies: null,
        zip_code: null,
        preferred_contact: null,
        sms_opt_in: true,
        marketing_opt_in: false,
        referral_source: null,
        visit_count: 0,
        total_spent: 0 
      })),
    ];

    // Get visit counts for profile clients
    const profileIds = (profileClients || []).map((c) => c.id);
    if (profileIds.length > 0) {
      const { data: appointmentStats } = await supabase
        .from('appointments')
        .select('client_id')
        .in('client_id', profileIds)
        .eq('business_id', business.id)
        .eq('status', 'completed');

      const visitCounts: Record<string, number> = {};
      appointmentStats?.forEach((apt: any) => {
        visitCounts[apt.client_id] = (visitCounts[apt.client_id] || 0) + 1;
      });

      allClients.forEach(client => {
        if (visitCounts[client.id]) {
          client.visit_count = visitCounts[client.id];
        }
      });
    }

    return NextResponse.json({ clients: allClients });
  } catch (error: any) {
    console.error('Clients error:', error?.message || error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error?.message || String(error) 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const business = await requireBusiness();
    const body = await request.json();
    const supabase = await createClient();

    const email = body.email?.toLowerCase()?.trim() || null;

    // Check if email already exists in this business (only if email provided)
    if (email) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .eq('business_id', business.id)
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
        business_id: business.id,
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
