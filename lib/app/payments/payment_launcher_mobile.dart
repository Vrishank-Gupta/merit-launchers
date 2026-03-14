import 'dart:async';

import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../models.dart';
import 'payment_models.dart';

class PaymentLauncher {
  PaymentLauncher._();

  static final PaymentLauncher instance = PaymentLauncher._();

  Future<PaymentResult> startCheckout({
    required PaymentOrder order,
    required StudentProfile student,
    required Course course,
  }) {
    final razorpay = Razorpay();
    final completer = Completer<PaymentResult>();

    void resolve(PaymentResult result) {
      if (!completer.isCompleted) {
        completer.complete(result);
      }
      razorpay.clear();
    }

    razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, (dynamic response) {
      final success = response as PaymentSuccessResponse;
      resolve(
        PaymentResult(
          status: PaymentResultStatus.success,
          orderId: success.orderId,
          paymentId: success.paymentId,
          signature: success.signature,
        ),
      );
    });

    razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, (dynamic response) {
      final error = response as PaymentFailureResponse;
      resolve(
        PaymentResult(
          status: PaymentResultStatus.failed,
          message: error.message ?? 'Payment failed.',
        ),
      );
    });

    razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, (dynamic response) {
      resolve(
        PaymentResult(
          status: PaymentResultStatus.cancelled,
          message: 'External wallet selected. Complete the payment and return to the app.',
        ),
      );
    });

    razorpay.open({
      'key': order.keyId,
      'amount': order.amount,
      'currency': order.currency,
      'name': 'Merit Launchers',
      'description': '${course.title} paper access',
      'order_id': order.orderId,
      'prefill': {
        'name': student.name,
        'contact': order.contact,
        'email': order.email,
      },
      'theme': {
        'color': '#21B6E5',
      },
      'retry': {'enabled': true, 'max_count': 1},
    });

    return completer.future;
  }
}
