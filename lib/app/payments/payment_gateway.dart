import '../api_client.dart';
import '../api_session_store.dart';
import '../backend_config.dart';
import '../models.dart';
import '../pricing.dart';
import 'api_payment_backend.dart';
import 'payment_models.dart';
import 'payment_launcher.dart';

class PaymentGateway {
  PaymentGateway(this.backendConfig);

  final BackendConfig backendConfig;

  Future<PaymentResult> payForCourse({
    required Course course,
    required StudentProfile student,
    Subject? subject,
  }) async {
    if (backendConfig.useMockPayments) {
      await Future<void>.delayed(const Duration(milliseconds: 900));
      return PaymentResult(
        status: PaymentResultStatus.success,
        orderId: 'mock-order-${DateTime.now().millisecondsSinceEpoch}',
        paymentId: 'mock-payment-${DateTime.now().millisecondsSinceEpoch}',
        signature: 'mock-signature',
        message: 'Mock payment approved.',
        purchase: Purchase(
          id: 'purchase-${DateTime.now().millisecondsSinceEpoch}',
          studentId: student.id,
          courseId: course.id,
          subjectId: subject?.id,
          amount: normalizedCourseTotalPrice(course),
          purchasedAt: DateTime.now(),
          receiptNumber: 'ML-${DateTime.now().millisecondsSinceEpoch}',
          validUntil: DateTime.now().add(Duration(days: course.validityDays)),
        ),
      );
    }

    try {
      final sessionStore = await ApiSessionStore.create();
      final session = await sessionStore.load();
      final apiClient = ApiClient(baseUrl: backendConfig.apiBaseUrl!);
      apiClient.setToken(session?.token);
      final paymentBackend = ApiPaymentBackend(
        backendConfig,
        apiClient,
      );
      final order = await paymentBackend.createOrder(
        course: course,
        student: student,
        subject: subject,
      );

      final checkoutResult = await PaymentLauncher.instance.startCheckout(
        order: order,
        student: student,
        course: course,
        subject: subject,
        onResumeFallback: () => paymentBackend.settleOrder(
          course: course,
          subject: subject,
          orderId: order.orderId,
        ),
      );

      if (checkoutResult.status != PaymentResultStatus.success ||
          checkoutResult.orderId == null ||
          checkoutResult.paymentId == null ||
          checkoutResult.signature == null) {
        return checkoutResult;
      }

      final verifiedPurchase = await paymentBackend.verifyPayment(
        course: course,
        subject: subject,
        orderId: checkoutResult.orderId!,
        paymentId: checkoutResult.paymentId!,
        signature: checkoutResult.signature!,
      );

      return PaymentResult(
        status: PaymentResultStatus.success,
        orderId: checkoutResult.orderId,
        paymentId: checkoutResult.paymentId,
        signature: checkoutResult.signature,
        purchase: verifiedPurchase,
        message: 'Payment verified successfully.',
      );
    } on Exception catch (error) {
      return PaymentResult(
        status: PaymentResultStatus.failed,
        message: 'Payment verification failed. $error',
      );
    }
  }
}
