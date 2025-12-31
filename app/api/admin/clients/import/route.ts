import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

interface CSVClient {
  email: string | null;
  phone: string | null;
  first_name: string;
  last_name: string;
  country: string;
  zip_code: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { clients } = await request.json();
    const supabase = createAdminClient();

    if (!Array.isArray(clients) || clients.length === 0) {
      return NextResponse.json({ error: 'No clients provided' }, { status: 400 });
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process clients in batches
    for (const client of clients as CSVClient[]) {
      try {
        // Normalize data
        const email = client.email?.toLowerCase()?.trim() || null;
        const phone = normalizePhone(client.phone);
        const firstName = client.first_name?.trim();
        const lastName = client.last_name?.trim();

        // Skip if no name
        if (!firstName || !lastName) {
          results.skipped++;
          continue;
        }

        // Check if client already exists by email or phone
        let existingClient = null;

        if (email) {
          const { data } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();
          existingClient = data;
        }

        if (!existingClient && phone) {
          const { data } = await supabase
            .from('profiles')
            .select('id')
            .eq('phone', phone)
            .single();
          existingClient = data;
        }

        if (existingClient) {
          // Update existing client with any missing data
          const updates: Record<string, any> = {};
          if (client.zip_code) updates.zip_code = client.zip_code;
          if (client.country) updates.country = client.country;

          if (Object.keys(updates).length > 0) {
            await supabase
              .from('profiles')
              .update(updates)
              .eq('id', existingClient.id);
          }
          results.skipped++;
          continue;
        }

        // Insert new client
        const { error } = await supabase.from('profiles').insert({
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          zip_code: client.zip_code || null,
          country: client.country || 'US',
          role: 'client',
          sms_opt_in: true, // Default to opted in since they were in old system
        });

        if (error) {
          results.errors.push(`${firstName} ${lastName}: ${error.message}`);
        } else {
          results.imported++;
        }
      } catch (err) {
        results.errors.push(`Error processing client: ${err}`);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;

  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Handle various formats
  if (cleaned.startsWith('+1')) {
    // Already has country code, format as +1XXXXXXXXXX
    cleaned = cleaned.slice(0, 12);
  } else if (cleaned.startsWith('1') && cleaned.length === 11) {
    // Has 1 prefix but no +
    cleaned = '+' + cleaned;
  } else if (cleaned.length === 10) {
    // Standard 10-digit US number
    cleaned = '+1' + cleaned;
  } else if (cleaned.startsWith('+')) {
    // International number, keep as-is
  }

  return cleaned || null;
}

// GET endpoint to download template or get import status
export async function GET() {
  const template = {
    headers: ['Email', 'Phone', 'First Name', 'Last Name', 'Country', 'Zip'],
    example: [
      'client@email.com',
      '+17135551234',
      'John',
      'Doe',
      'US',
      '77001',
    ],
  };

  return NextResponse.json({ template });
}
