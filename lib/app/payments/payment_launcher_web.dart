// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:async';
import 'dart:html' as html;
import 'dart:js' as js;

import '../models.dart';
import 'payment_models.dart';

class PaymentLauncher {
  PaymentLauncher._();

  static final PaymentLauncher instance = PaymentLauncher._();
  static Future<void>? _scriptLoader;

  Future<PaymentResult> startCheckout({
    required PaymentOrder order,
    required StudentProfile student,
    required Course course,
  }) async {
    try {
      await _ensureScriptLoaded();
    } catch (error) {
      return PaymentResult(
        status: PaymentResultStatus.failed,
        message: 'Unable to load Razorpay checkout. $error',
      );
    }

    if (!js.context.hasProperty('Razorpay')) {
      return const PaymentResult(
        status: PaymentResultStatus.failed,
        message: 'Razorpay checkout script did not initialize.',
      );
    }

    final completer = Completer<PaymentResult>();
    bool resolved = false;

    void resolve(PaymentResult result) {
      if (!resolved && !completer.isCompleted) {
        resolved = true;
        completer.complete(result);
      }
    }

    String stringify(dynamic value) {
      if (value == null) {
        return '';
      }
      if (value is js.JsObject) {
        return value.toString();
      }
      return value.toString();
    }

    dynamic read(dynamic source, String key) {
      if (source is js.JsObject && source.hasProperty(key)) {
        return source[key];
      }
      return null;
    }

    final options = js.JsObject.jsify({
      'key': order.keyId,
      'amount': order.amount,
      'currency': order.currency,
      'name': order.name,
      'description': order.description,
      'order_id': order.orderId,
      'prefill': {
        'name': student.name,
        'contact': order.contact,
        'email': order.email,
      },
      'theme': {
        'color': '#11A4CF',
      },
      'retry': {
        'enabled': true,
        'max_count': 1,
      },
      'modal': {
        'ondismiss': js.allowInterop(() {
          resolve(
            const PaymentResult(
              status: PaymentResultStatus.cancelled,
              message: 'Checkout was dismissed before payment completion.',
            ),
          );
        }),
      },
      'handler': js.allowInterop((dynamic response) {
        resolve(
          PaymentResult(
            status: PaymentResultStatus.success,
            orderId: stringify(read(response, 'razorpay_order_id')),
            paymentId: stringify(read(response, 'razorpay_payment_id')),
            signature: stringify(read(response, 'razorpay_signature')),
          ),
        );
      }),
    });

    final razorpay = js.JsObject(js.context['Razorpay'] as js.JsFunction, [options]);
    razorpay.callMethod('on', [
      'payment.failed',
      js.allowInterop((dynamic response) {
        final error = read(response, 'error');
        resolve(
          PaymentResult(
            status: PaymentResultStatus.failed,
            message: stringify(read(error, 'description')).isNotEmpty
                ? stringify(read(error, 'description'))
                : 'Payment failed.',
          ),
        );
      }),
    ]);

    razorpay.callMethod('open');
    return completer.future;
  }

  Future<void> _ensureScriptLoaded() {
    final existingLoader = _scriptLoader;
    if (existingLoader != null) {
      return existingLoader;
    }

    if (js.context.hasProperty('Razorpay')) {
      return _scriptLoader = Future<void>.value();
    }

    final completer = Completer<void>();
    final script = html.ScriptElement()
      ..src = 'https://checkout.razorpay.com/v1/checkout.js'
      ..type = 'text/javascript'
      ..async = true;

    script.onLoad.first.then((_) {
      completer.complete();
    });
    script.onError.first.then((_) {
      completer.completeError('Script load failed.');
    });

    html.document.head?.append(script);
    return _scriptLoader = completer.future;
  }
}
