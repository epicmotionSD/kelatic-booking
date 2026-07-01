import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminBusiness, isGuardErr, slugify } from '@/lib/commerce/guard';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
const BUCKET = 'product-images';

// POST /api/admin/products/upload — upload a product image, return its public URL
export async function POST(request: NextRequest) {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type (PNG, JPG, WEBP, GIF)' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
  }

  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'image';
  const path = `${guard.business.id}/${base}-${Date.now()}.${ext}`;

  const supabase = createAdminClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    console.error('Product image upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
