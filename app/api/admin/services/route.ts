import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

// Helper function to check if user has permission to manage services
async function checkServicePermissions(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { hasPermission: false, error: 'Authentication required' };
  }

  // Check if user has admin, owner, or stylist role in any business
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, business_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { hasPermission: false, error: 'Profile not found' };
  }

  // Allow admin, owner, and stylist (locticians) roles
  if (!['admin', 'owner', 'stylist'].includes(profile.role)) {
    return { hasPermission: false, error: 'Insufficient permissions - only admins, owners, and stylists can manage services' };
  }

  return { hasPermission: true, profile };
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Check permissions for authenticated access
    const { hasPermission, error: permissionError } = await checkServicePermissions(supabase);
    if (!hasPermission) {
      return NextResponse.json({ error: permissionError }, { status: 401 });
    }

    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .order('category')
      .order('sort_order');

    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Services error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createServerSupabaseClient();

    // Check permissions
    const { hasPermission, error: permissionError, profile } = await checkServicePermissions(supabase);
    if (!hasPermission) {
      return NextResponse.json({ error: permissionError }, { status: 401 });
    }

    // Get max sort_order for category
    const { data: existing } = await supabase
      .from('services')
      .select('sort_order')
      .eq('category', body.category)
      .order('sort_order', { ascending: false })
      .limit(1);

    const sortOrder = existing?.[0]?.sort_order
      ? existing[0].sort_order + 1
      : 0;

    // Add business_id for multi-tenant support
    const { data: service, error } = await supabase
      .from('services')
      .insert({
        name: body.name,
        description: body.description,
        category: body.category,
        base_price: body.base_price,
        duration: body.duration,
        deposit_required: body.deposit_required,
        deposit_amount: body.deposit_amount,
        sort_order: sortOrder,
        is_active: true,
        business_id: profile?.business_id, // Associate with user's business
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating service:', error);
      return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
