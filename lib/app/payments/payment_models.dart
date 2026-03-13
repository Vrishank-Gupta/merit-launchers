import '../models.dart';

class PaymentOrder {
  const PaymentOrder({
    required this.orderId,
    required this.amount,
    required this.currency,
    required this.keyId,
    required this.name,
    required this.description,
    required this.contact,
    required this.email,
  });

  final String orderId;
  final int amount;
  final String currency;
  final String keyId;
  final String name;
  final String description;
  final String contact;
  final String email;

  factory PaymentOrder.fromJson(Map<String, dynamic> json) {
    return PaymentOrder(
      orderId: json['orderId'] as String,
      amount: json['amount'] as int,
      currency: json['currency'] as String,
      keyId: json['keyId'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      contact: json['contact'] as String? ?? '',
      email: json['email'] as String? ?? '',
    );
  }
}

enum PaymentResultStatus { success, cancelled, failed, unsupported }

class PaymentResult {
  const PaymentResult({
    required this.status,
    this.paymentId,
    this.signature,
    this.orderId,
    this.message,
    this.purchase,
  });

  final PaymentResultStatus status;
  final String? paymentId;
  final String? signature;
  final String? orderId;
  final String? message;
  final Purchase? purchase;
}
