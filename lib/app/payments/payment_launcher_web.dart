import '../models.dart';
import 'payment_models.dart';

class PaymentLauncher {
  PaymentLauncher._();

  static final PaymentLauncher instance = PaymentLauncher._();

  Future<PaymentResult> startCheckout({
    required PaymentOrder order,
    required StudentProfile student,
    required Course course,
  }) async {
    return const PaymentResult(
      status: PaymentResultStatus.unsupported,
      message: 'Razorpay in-app checkout is currently configured for mobile builds only.',
    );
  }
}
