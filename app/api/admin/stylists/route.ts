import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { requireBusiness, getBusinessBySlug } from '@/lib/tenant/server';

export async function GET() {
  try {
    const supabase = createAdminClient();

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - now.getDay());

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // Get stylists
    const { data: stylists, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        avatar_url,
        bio,
        specialties,
        instagram_handle,
        commission_rate,
        is_active
      `)
      .eq('role', 'stylist')
      .order('first_name');

    if (error) {
      console.error('Error fetching stylists:', error);
      return NextResponse.json({ error: 'Failed to fetch stylists' }, { status: 500 });
    }

    // Get service counts and appointments per stylist
    const stylistIds = stylists?.map((s) => s.id) || [];

    if (stylistIds.length === 0) {
      return NextResponse.json({ stylists: [] });
    }

    // Count services per stylist
    const { data: serviceCounts } = await supabase
      .from('stylist_services')
      .select('stylist_id')
      .in('stylist_id', stylistIds);

    // Count appointments this week
    const { data: appointmentCounts } = await supabase
      .from('appointments')
      .select('stylist_id')
      .in('stylist_id', stylistIds)
      .gte('start_time', weekStart.toISOString())
      .lt('start_time', weekEnd.toISOString())
      .not('status', 'in', '("cancelled","no_show")');

    const servicesPerStylist: Record<string, number> = {};
    const appointmentsPerStylist: Record<string, number> = {};

    serviceCounts?.forEach((sc: any) => {
      servicesPerStylist[sc.stylist_id] = (servicesPerStylist[sc.stylist_id] || 0) + 1;
    });

    appointmentCounts?.forEach((ac: any) => {
      appointmentsPerStylist[ac.stylist_id] = (appointmentsPerStylist[ac.stylist_id] || 0) + 1;
    });

    const enrichedStylists = stylists?.map((stylist) => ({
      ...stylist,
      services_count: servicesPerStylist[stylist.id] || 0,
      appointments_this_week: appointmentsPerStylist[stylist.id] || 0,
    })) || [];

    return NextResponse.json({ stylists: enrichedStylists });
  } catch (error) {
    console.error('Stylists error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.first_name || !body.last_name || !body.email) {
      return NextResponse.json(
        { error: 'first_name, last_name, and email are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const email = body.email.toLowerCase();

    // Resolve business — admin UI runs on a tenant subdomain or custom domain.
    let businessId: string | null = null;
    try {
      businessId = (await requireBusiness()).id;
    } catch {
      const fallback = await getBusinessBySlug('kelatic');
      businessId = fallback?.id ?? null;
    }
    if (!businessId) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Check if a profile already exists for this email (profiles.email is UNIQUE
    // globally). maybeSingle so 0-rows isn't an error.
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `Email already in use (existing role: ${existing.role})` },
        { status: 400 }
      );
    }

    // profiles.id is a NOT NULL FK to auth.users(id), so create the auth user
    // first. email_confirm=true skips verification — the stylist will get an
    // invite/reset link via the /api/admin/stylists/invite endpoint.
    const { data: created, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        first_name: body.first_name,
        last_name: body.last_name,
        phone: body.phone || null,
        role: 'stylist',
      },
    });

    let authUserId = created?.user?.id ?? null;

    if (!authUserId && createUserError) {
      // Auth user might exist from a prior partial attempt — find them and reuse.
      const alreadyRegistered = /already.*(registered|exist)/i.test(createUserError.message || '');
      if (alreadyRegistered) {
        const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        authUserId = list?.users?.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
      }
      if (!authUserId) {
        console.error('[admin/stylists] auth.admin.createUser failed', {
          email,
          error: createUserError.message,
        });
        return NextResponse.json(
          { error: `Failed to create auth account: ${createUserError.message}` },
          { status: 500 }
        );
      }
    }

    if (!authUserId) {
      return NextResponse.json({ error: 'Could not create auth user' }, { status: 500 });
    }

    const { data: stylist, error } = await supabase
      .from('profiles')
      .insert({
        id: authUserId,
        first_name: body.first_name,
        last_name: body.last_name,
        email,
        phone: body.phone || null,
        role: 'stylist',
        business_id: businessId,
        bio: body.bio || null,
        specialties: body.specialties || null,
        instagram_handle: body.instagram_handle || null,
        commission_rate: body.commission_rate ?? null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[admin/stylists] Profile insert failed after auth user create', {
        email,
        authUserId,
        error: error.message,
      });
      // Roll back the orphan auth user so a retry works cleanly.
      await supabase.auth.admin.deleteUser(authUserId).catch((cleanupErr) => {
        console.error('[admin/stylists] Failed to clean up orphan auth user', {
          authUserId,
          error: cleanupErr?.message,
        });
      });
      return NextResponse.json(
        { error: `Failed to create stylist profile: ${error.message}` },
        { status: 500 }
      );
    }

    // Optional initial service assignments
    if (Array.isArray(body.serviceIds) && body.serviceIds.length > 0) {
      const rows = body.serviceIds.map((serviceId: string) => ({
        stylist_id: stylist.id,
        service_id: serviceId,
        business_id: businessId,
        is_active: true,
      }));
      const { error: insertError } = await supabase
        .from('stylist_services')
        .insert(rows);
      if (insertError) {
        // Non-fatal: stylist created but services not assigned. Owner can fix
        // in the edit modal. Log for diagnosis.
        console.error('[admin/stylists] Failed to assign initial services', {
          stylistId: stylist.id,
          error: insertError.message,
        });
      }
    }

    return NextResponse.json({ stylist });
  } catch (error: any) {
    console.error('Create stylist error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
