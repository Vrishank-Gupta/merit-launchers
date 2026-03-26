import 'dart:async';

import 'package:flutter/widgets.dart';
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
    Future<PaymentResult?> Function()? onResumeFallback,
  }) {
    final razorpay = Razorpay();
    final completer = Completer<PaymentResult>();
    final lifecycleObserver = _CheckoutLifecycleObserver();
    Timer? overallTimeout;
    Timer? fallbackPoller;
    var sawBackground = false;
    var fallbackInFlight = false;

    void resolve(PaymentResult result) {
      if (!completer.isCompleted) {
        completer.complete(result);
      }
      overallTimeout?.cancel();
      fallbackPoller?.cancel();
      WidgetsBinding.instance.removeObserver(lifecycleObserver);
      razorpay.clear();
    }

    Future<void> checkFallbackStatus() async {
      if (onResumeFallback == null ||
          completer.isCompleted ||
          fallbackInFlight) {
        return;
      }
      fallbackInFlight = true;
      try {
        final result = await onResumeFallback();
        if (result != null) {
          resolve(result);
        }
      } finally {
        fallbackInFlight = false;
      }
    }

    lifecycleObserver.onStateChanged = (state) {
      if (state == AppLifecycleState.paused ||
          state == AppLifecycleState.inactive) {
        sawBackground = true;
      }
      if (state == AppLifecycleState.resumed && sawBackground) {
        fallbackPoller?.cancel();
        fallbackPoller = Timer.periodic(const Duration(seconds: 2), (timer) {
          if (completer.isCompleted) {
            timer.cancel();
            return;
          }
          checkFallbackStatus();
        });
        checkFallbackStatus();
      }
    };
    WidgetsBinding.instance.addObserver(lifecycleObserver);

    overallTimeout = Timer(const Duration(minutes: 2), () async {
      await checkFallbackStatus();
      if (!completer.isCompleted) {
        resolve(
          const PaymentResult(
            status: PaymentResultStatus.failed,
            message:
                'Payment confirmation did not return to the app. Please refresh your purchases and try again.',
          ),
        );
      }
    });

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
      // Selecting an external wallet is not the final payment result.
    });

    unawaited(() async {
      try {
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
          'upi_link': true,
          'retry': {'enabled': true, 'max_count': 1},
        });
      } catch (error) {
        resolve(
          PaymentResult(
            status: PaymentResultStatus.failed,
            orderId: order.orderId,
            message: 'Unable to launch payment. $error',
          ),
        );
      }
    }());

    return completer.future;
  }
}

class _CheckoutLifecycleObserver with WidgetsBindingObserver {
  void Function(AppLifecycleState state)? onStateChanged;

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    onStateChanged?.call(state);
  }
}
