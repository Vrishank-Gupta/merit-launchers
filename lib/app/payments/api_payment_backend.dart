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
      },
    );
    final purchase = Map<String, dynamic>.from(result['purchase'] as Map<dynamic, dynamic>);
    return Purchase.fromJson(purchase);
  }
}
