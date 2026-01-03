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
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Check permissions
    const { hasPermission, error: permissionError } = await checkServicePermissions(supabase);
    if (!hasPermission) {
      return NextResponse.json({ error: permissionError }, { status: 401 });
    }

    const { data: service, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createServerSupabaseClient();

    // Check permissions
    const { hasPermission, error: permissionError } = await checkServicePermissions(supabase);
    if (!hasPermission) {
      return NextResponse.json({ error: permissionError }, { status: 401 });
    }

    const { data: service, error } = await supabase
      .from('services')
      .update({
        name: body.name,
        description: body.description,
        category: body.category,
        base_price: body.base_price,
        duration: body.duration,
        deposit_required: body.deposit_required,
        deposit_amount: body.deposit_amount,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating service:', error);
      return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Update service error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createServerSupabaseClient();

    // Check permissions
    const { hasPermission, error: permissionError } = await checkServicePermissions(supabase);
    if (!hasPermission) {
      return NextResponse.json({ error: permissionError }, { status: 401 });
    }

    const updates: any = {};

    if (body.is_active !== undefined) {
      updates.is_active = body.is_active;
    }

    if (body.sort_order !== undefined) {
      updates.sort_order = body.sort_order;
    }

    const { data: service, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error patching service:', error);
      return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Patch service error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Check permissions
    const { hasPermission, error: permissionError } = await checkServicePermissions(supabase);
    if (!hasPermission) {
      return NextResponse.json({ error: permissionError }, { status: 401 });
    }

    // Check if service is used in any appointments
    const { count } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('service_id', id);

    if (count && count > 0) {
      // Soft delete - deactivate instead
      await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', id);

      return NextResponse.json({
        message: 'Service deactivated (has existing appointments)',
        deactivated: true
      });
    }

    // Hard delete if no appointments
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete service error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
