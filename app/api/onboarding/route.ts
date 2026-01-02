import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      name,
      slug,
      email,
      phone,
      businessType,
      address,
      city,
      state,
      zip,
      timezone,
      primaryColor,
      secondaryColor,
      tagline,
      instagramHandle,
    } = body;

    // Validate required fields
    if (!name || !slug || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, email' },
        { status: 400 }
      );
    }

    // Check if slug is available
    const { data: existingBusiness } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingBusiness) {
      return NextResponse.json(
        { error: 'This URL is already taken. Please choose another.' },
        { status: 400 }
      );
    }

    // Create the business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        slug,
        name,
        email,
        phone,
        address,
        city,
        state,
        zip,
        timezone: timezone || 'America/Chicago',
        primary_color: primaryColor || '#8b5cf6',
        secondary_color: secondaryColor || '#a78bfa',
        business_type: businessType || 'salon',
        tagline,
        instagram_handle: instagramHandle,
        plan: 'starter',
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (businessError) {
      console.error('Failed to create business:', businessError);
      return NextResponse.json(
        { error: 'Failed to create business' },
        { status: 500 }
      );
    }

    // Create business settings
    const { error: settingsError } = await supabase.from('business_settings').insert({
      business_id: business.id,
      ai_brand_context: `${name} is a ${businessType} business. ${tagline || ''}`,
      ai_tone: 'professional',
      meta_title: `${name} | Book Online`,
      meta_description: `Book your appointment at ${name}. ${tagline || ''}`,
    });

    if (settingsError) {
      console.error('Failed to create business settings:', settingsError);
    }

    // Add user as owner of the business
    const { error: memberError } = await supabase.from('business_members').insert({
      business_id: business.id,
      user_id: user.id,
      role: 'owner',
      accepted_at: new Date().toISOString(),
    });

    if (memberError) {
      console.error('Failed to add user as member:', memberError);
    }

    // Update user's profile with business_id
    await supabase
      .from('profiles')
      .update({ business_id: business.id, role: 'owner' })
      .eq('id', user.id);

    // Create default services based on business type
    const defaultServices = getDefaultServices(businessType, business.id);
    if (defaultServices.length > 0) {
      await supabase.from('services').insert(defaultServices);
    }

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        slug: business.slug,
        name: business.name,
      },
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getDefaultServices(businessType: string, businessId: string) {
  const baseServices: Record<string, Array<{ name: string; description: string; base_price: number; duration: number; category: string }>> = {
    salon: [
      { name: 'Haircut', description: 'Professional haircut and style', base_price: 45, duration: 45, category: 'natural' },
      { name: 'Wash & Style', description: 'Shampoo, condition, and style', base_price: 55, duration: 60, category: 'natural' },
      { name: 'Color Service', description: 'Full color or highlights', base_price: 120, duration: 120, category: 'color' },
      { name: 'Deep Conditioning', description: 'Intensive moisture treatment', base_price: 35, duration: 30, category: 'treatments' },
    ],
    barbershop: [
      { name: 'Haircut', description: 'Classic haircut', base_price: 30, duration: 30, category: 'other' },
      { name: 'Haircut & Beard', description: 'Haircut with beard trim and shape', base_price: 45, duration: 45, category: 'other' },
      { name: 'Beard Trim', description: 'Beard shaping and grooming', base_price: 20, duration: 20, category: 'other' },
      { name: 'Hot Towel Shave', description: 'Classic straight razor shave', base_price: 35, duration: 30, category: 'other' },
    ],
    spa: [
      { name: 'Swedish Massage (60 min)', description: 'Relaxation full body massage', base_price: 90, duration: 60, category: 'treatments' },
      { name: 'Deep Tissue Massage', description: 'Therapeutic deep pressure massage', base_price: 110, duration: 60, category: 'treatments' },
      { name: 'Facial', description: 'Cleansing and rejuvenating facial', base_price: 75, duration: 60, category: 'treatments' },
      { name: 'Body Wrap', description: 'Detoxifying body treatment', base_price: 95, duration: 75, category: 'treatments' },
    ],
    nails: [
      { name: 'Manicure', description: 'Classic manicure', base_price: 25, duration: 30, category: 'other' },
      { name: 'Pedicure', description: 'Classic pedicure', base_price: 40, duration: 45, category: 'other' },
      { name: 'Gel Manicure', description: 'Long-lasting gel polish', base_price: 45, duration: 45, category: 'other' },
      { name: 'Acrylic Full Set', description: 'Full set of acrylic nails', base_price: 60, duration: 75, category: 'other' },
    ],
    lashes: [
      { name: 'Classic Lash Extensions', description: 'Natural look lash extensions', base_price: 120, duration: 90, category: 'other' },
      { name: 'Volume Lash Extensions', description: 'Full, dramatic lash look', base_price: 180, duration: 120, category: 'other' },
      { name: 'Lash Fill', description: '2-3 week maintenance fill', base_price: 65, duration: 60, category: 'other' },
      { name: 'Lash Lift & Tint', description: 'Natural lash enhancement', base_price: 85, duration: 60, category: 'other' },
    ],
    other: [
      { name: 'Consultation', description: 'Initial consultation', base_price: 0, duration: 30, category: 'other' },
      { name: 'Service 1', description: 'Description', base_price: 50, duration: 60, category: 'other' },
    ],
  };

  const services = baseServices[businessType] || baseServices.other;

  return services.map((service) => ({
    ...service,
    business_id: businessId,
    is_active: true,
    deposit_required: false,
  }));
}
