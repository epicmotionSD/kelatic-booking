import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { appointmentId, amount, tipAmount } = await request.json();

    if (!appointmentId || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Record the cash payment
    const { data, error } = await supabase
      .from('payments')
      .insert({
        appointment_id: appointmentId,
        amount: amount / 100, // Convert cents to dollars
        tip_amount: (tipAmount || 0) / 100,
        total_amount: (amount + (tipAmount || 0)) / 100,
        status: 'paid',
        method: 'cash',
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording cash payment:', error);
      return NextResponse.json(
        { error: 'Failed to record payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: data,
    });
  } catch (error) {
    console.error('Record cash error:', error);
    return NextResponse.json(
      { error: 'Failed to record cash payment' },
      { status: 500 }
    );
  }
}
