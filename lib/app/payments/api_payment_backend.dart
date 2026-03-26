import 'package:flutter/foundation.dart';

import '../api_client.dart';
import '../backend_config.dart';
import '../models.dart';
import 'payment_models.dart';

class ApiPaymentBackend {
  ApiPaymentBackend(BackendConfig config, this._apiClient);

  final ApiClient _apiClient;

  Future<PaymentOrder> createOrder({
    required Course course,
    required StudentProfile student,
  }) async {
    final result = await _apiClient.postJson(
      '/v1/payments/razorpay/order',
      authenticated: true,
      body: {
        'courseId': course.id,
        'studentName': student.name,
        'studentContact': student.contact.contains('@') ? null : student.contact,
        'studentEmail': student.contact.contains('@') ? student.contact : null,
      },
    );
    return PaymentOrder.fromJson(result);
  }

  Future<Purchase> verifyPayment({
    required Course course,
    required String orderId,
    required String paymentId,
    required String signature,
  }) async {
    final result = await _apiClient.postJson(
      '/v1/payments/razorpay/verify',
      authenticated: true,
      body: {
        'courseId': course.id,
        'orderId': orderId,
        'paymentId': paymentId,
        'signature': signature,
        'platform': kIsWeb ? 'web' : 'android',
      },
    );
    final purchase = Map<String, dynamic>.from(result['purchase'] as Map<dynamic, dynamic>);
    return Purchase.fromJson(purchase);
  }

  Future<PaymentResult?> settleOrder({
    required Course course,
    required String orderId,
  }) async {
    final result = await _apiClient.postJson(
      '/v1/payments/razorpay/settle',
      authenticated: true,
      body: {
        'courseId': course.id,
        'orderId': orderId,
        'platform': kIsWeb ? 'web' : 'android',
      },
    );
    final status = (result['status'] as String? ?? 'pending').toLowerCase();
    switch (status) {
      case 'success':
        final purchase = Map<String, dynamic>.from(
          result['purchase'] as Map<dynamic, dynamic>,
        );
        return PaymentResult(
          status: PaymentResultStatus.success,
          orderId: orderId,
          paymentId: purchase['payment_id'] as String?,
          purchase: Purchase.fromJson(purchase),
          message: 'Payment verified successfully.',
        );
      case 'failed':
        return PaymentResult(
          status: PaymentResultStatus.failed,
          orderId: orderId,
          message: result['message'] as String? ?? 'Payment failed.',
        );
      default:
        return null;
    }
  }
}
