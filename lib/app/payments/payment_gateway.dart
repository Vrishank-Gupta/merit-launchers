import 'package:supabase_flutter/supabase_flutter.dart';

import '../backend_config.dart';
import '../models.dart';
import 'payment_models.dart';
import 'payment_launcher.dart';

class PaymentGateway {
  PaymentGateway(this.backendConfig);

  final BackendConfig backendConfig;

  Future<PaymentResult> payForCourse({
    required Course course,
    required StudentProfile student,
  }) async {
    if (backendConfig.isDemo) {
      await Future<void>.delayed(const Duration(milliseconds: 900));
      return const PaymentResult(
        status: PaymentResultStatus.success,
        orderId: 'demo-order-001',
        paymentId: 'demo-payment-001',
        signature: 'demo-signature',
        message: 'Demo payment approved.',
      );
    }

    if (!backendConfig.hasRazorpay) {
      return const PaymentResult(
        status: PaymentResultStatus.unsupported,
        message: 'Razorpay key is not configured for this environment.',
      );
    }

    final createOrderResponse = await Supabase.instance.client.functions.invoke(
      'create-razorpay-order',
      body: {
        'courseId': course.id,
        'courseTitle': course.title,
        'amount': (course.price * 100).round(),
        'studentId': student.id,
        'studentName': student.name,
        'studentEmail': student.contact.contains('@') ? student.contact : '',
        'studentContact': student.contact.contains('@') ? '' : student.contact,
        'razorpayKeyId': backendConfig.razorpayKeyId,
      },
    );

    if (createOrderResponse.status != 200 && createOrderResponse.status != 201) {
      return PaymentResult(
        status: PaymentResultStatus.failed,
        message: createOrderResponse.data is Map<String, dynamic>
            ? (createOrderResponse.data['error'] as String? ?? 'Unable to create order.')
            : 'Unable to create order.',
      );
    }

    final data = createOrderResponse.data;
    if (data is! Map<String, dynamic>) {
      return const PaymentResult(
        status: PaymentResultStatus.failed,
        message: 'Invalid order response received.',
      );
    }

    final order = PaymentOrder.fromJson(data);
    final paymentResult = await PaymentLauncher.instance.startCheckout(
      order: order,
      student: student,
      course: course,
    );

    if (paymentResult.status != PaymentResultStatus.success) {
      return paymentResult;
    }

    final verifyResponse = await Supabase.instance.client.functions.invoke(
      'verify-razorpay-payment',
      body: {
        'razorpay_order_id': paymentResult.orderId,
        'razorpay_payment_id': paymentResult.paymentId,
        'razorpay_signature': paymentResult.signature,
        'courseId': course.id,
        'studentId': student.id,
      },
    );

    if (verifyResponse.status != 200 && verifyResponse.status != 201) {
      return PaymentResult(
        status: PaymentResultStatus.failed,
        message: verifyResponse.data is Map<String, dynamic>
            ? (verifyResponse.data['error'] as String? ?? 'Payment verification failed.')
            : 'Payment verification failed.',
      );
    }

    final verifyData = verifyResponse.data;
    if (verifyData is! Map<String, dynamic>) {
      return const PaymentResult(
        status: PaymentResultStatus.failed,
        message: 'Invalid payment verification response received.',
      );
    }

    final purchaseData = verifyData['purchase'];
    return PaymentResult(
      status: PaymentResultStatus.success,
      orderId: paymentResult.orderId,
      paymentId: paymentResult.paymentId,
      signature: paymentResult.signature,
      message: verifyData['message'] as String?,
      purchase: purchaseData is Map<String, dynamic>
          ? Purchase(
              id: purchaseData['id'] as String,
              studentId: purchaseData['student_id'] as String,
              courseId: purchaseData['course_id'] as String,
              amount: (purchaseData['amount'] as num).toDouble(),
              purchasedAt: DateTime.parse(purchaseData['purchased_at'] as String),
              receiptNumber: purchaseData['receipt_number'] as String,
              paymentProvider:
                  purchaseData['payment_provider'] as String? ?? 'razorpay',
              paymentId: purchaseData['payment_id'] as String?,
              paymentOrderId: purchaseData['payment_order_id'] as String?,
              paymentSignature: purchaseData['payment_signature'] as String?,
              verifiedAt: purchaseData['verified_at'] == null
                  ? null
                  : DateTime.parse(purchaseData['verified_at'] as String),
            )
          : null,
    );
  }
}
