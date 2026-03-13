import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      return Response.json(
        { error: 'Razorpay secrets are missing in Edge Function environment.' },
        { status: 500, headers: corsHeaders },
      );
    }

    const body = await request.json();
    const amount = Number(body.amount);

    if (!amount || amount < 100) {
      return Response.json(
        { error: 'Amount must be at least 100 paise.' },
        { status: 400, headers: corsHeaders },
      );
    }

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const receipt = `ml-${body.courseId}-${Date.now()}`;

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt,
        notes: {
          courseId: body.courseId,
          courseTitle: body.courseTitle,
          studentId: body.studentId,
        },
      }),
    });

    const order = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      return Response.json(
        { error: order.error?.description ?? 'Unable to create Razorpay order.' },
        { status: razorpayResponse.status, headers: corsHeaders },
      );
    }

    return Response.json(
      {
        keyId: razorpayKeyId,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        name: 'Merit Launchers',
        description: `${body.courseTitle} mock paper access`,
        email: body.studentEmail ?? '',
        contact: body.studentContact ?? '',
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
