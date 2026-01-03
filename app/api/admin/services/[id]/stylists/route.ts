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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await params;
    const supabase = await createServerSupabaseClient();

    // Check permissions
    const { hasPermission, error: permissionError } = await checkServicePermissions(supabase);
    if (!hasPermission) {
      return NextResponse.json({ error: permissionError }, { status: 401 });
    }

    // Get stylists assigned to this service
    const { data: stylistServices, error } = await supabase
      .from('stylist_services')
      .select('stylist_id')
      .eq('service_id', serviceId);

    if (error) {
      console.error('Error fetching service stylists:', error);
      return NextResponse.json({ error: 'Failed to fetch assigned stylists' }, { status: 500 });
    }

    const stylistIds = (stylistServices || []).map(ss => ss.stylist_id);

    return NextResponse.json({ stylistIds });
  } catch (error) {
    console.error('Error fetching service stylists:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await params;
    const { stylistIds } = await request.json();
    const supabase = await createServerSupabaseClient();

    // Check permissions
    const { hasPermission, error: permissionError, profile } = await checkServicePermissions(supabase);
    if (!hasPermission) {
      return NextResponse.json({ error: permissionError }, { status: 401 });
    }

    // Remove existing assignments for this service
    await supabase
      .from('stylist_services')
      .delete()
      .eq('service_id', serviceId);

    // Add new assignments
    if (stylistIds && stylistIds.length > 0) {
      const assignments = stylistIds.map((stylistId: string) => ({
        service_id: serviceId,
        stylist_id: stylistId,
        business_id: profile?.business_id,
        is_active: true
      }));

      const { error: insertError } = await supabase
        .from('stylist_services')
        .insert(assignments);

      if (insertError) {
        console.error('Error creating stylist assignments:', insertError);
        return NextResponse.json({ error: 'Failed to assign stylists' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating service stylists:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}