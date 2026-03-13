import { createClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';

async function sign(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload),
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!razorpayKeyId || !razorpayKeySecret) {
      return Response.json(
        { error: 'Razorpay secrets are missing in Edge Function environment.' },
        { status: 500, headers: corsHeaders },
      );
    }

    const body = await request.json();
    const payload = `${body.razorpay_order_id}|${body.razorpay_payment_id}`;
    const expectedSignature = await sign(payload, razorpayKeySecret);

    if (expectedSignature !== body.razorpay_signature) {
      return Response.json(
        { error: 'Payment signature verification failed.' },
        { status: 400, headers: corsHeaders },
      );
    }

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const paymentResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${body.razorpay_payment_id}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      },
    );
    const payment = await paymentResponse.json();

    if (!paymentResponse.ok) {
      return Response.json(
        { error: payment.error?.description ?? 'Unable to fetch payment details from Razorpay.' },
        { status: paymentResponse.status, headers: corsHeaders },
      );
    }

    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return Response.json(
        { error: `Payment is not complete. Current Razorpay status: ${payment.status}.` },
        { status: 400, headers: corsHeaders },
      );
    }

    let purchase: Record<string, unknown> | null = null;
    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });

      const existingPurchaseResponse = await supabase
        .from('purchases')
        .select('*')
        .eq('payment_id', body.razorpay_payment_id)
        .maybeSingle();

      if (existingPurchaseResponse.error) {
        return Response.json(
          { error: existingPurchaseResponse.error.message },
          { status: 500, headers: corsHeaders },
        );
      }

      if (existingPurchaseResponse.data) {
        purchase = existingPurchaseResponse.data as Record<string, unknown>;
      } else {
        const purchasePayload = {
          id: `purchase-${body.razorpay_payment_id}`,
          student_id: body.studentId,
          course_id: body.courseId,
          amount: Number(payment.amount) / 100,
          receipt_number: payment.order_id ?? `ML-${Date.now()}`,
          payment_provider: 'razorpay',
          payment_id: body.razorpay_payment_id,
          payment_order_id: body.razorpay_order_id,
          payment_signature: body.razorpay_signature,
          purchased_at: new Date().toISOString(),
          verified_at: new Date().toISOString(),
        };

        const insertResponse = await supabase
          .from('purchases')
          .insert(purchasePayload)
          .select('*')
          .single();

        if (insertResponse.error) {
          return Response.json(
            { error: insertResponse.error.message },
            { status: 500, headers: corsHeaders },
          );
        }

        purchase = insertResponse.data as Record<string, unknown>;
      }
    }

    return Response.json(
      {
        verified: true,
        orderId: body.razorpay_order_id,
        paymentId: body.razorpay_payment_id,
        courseId: body.courseId,
        studentId: body.studentId,
        message: 'Payment verified successfully.',
        purchase,
      },
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unexpected error.' },
      { status: 500, headers: corsHeaders },
    );
  }
});
