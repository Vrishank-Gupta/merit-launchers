import '../../app/api_client.dart';
import '../../app/backend_config.dart';

class CoursePromoCodeDto {
  const CoursePromoCodeDto({
    required this.id,
    required this.courseId,
    required this.code,
    required this.discountType,
    required this.discountValue,
    required this.maxRedemptions,
    required this.redemptionCount,
    required this.isActive,
    this.validFrom,
    this.validUntil,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String courseId;
  final String code;
  final String discountType;
  final double discountValue;
  final int? maxRedemptions;
  final int redemptionCount;
  final bool isActive;
  final DateTime? validFrom;
  final DateTime? validUntil;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  factory CoursePromoCodeDto.fromJson(Map<String, dynamic> json) {
    return CoursePromoCodeDto(
      id: (json['id'] as String?) ?? '',
      courseId: (json['courseId'] as String?) ?? '',
      code: (json['code'] as String?) ?? '',
      discountType: (json['discountType'] as String?) ?? 'flat',
      discountValue: (json['discountValue'] as num?)?.toDouble() ?? 0,
      maxRedemptions: (json['maxRedemptions'] as num?)?.toInt(),
      redemptionCount: (json['redemptionCount'] as num?)?.toInt() ?? 0,
      isActive: json['isActive'] as bool? ?? true,
      validFrom: DateTime.tryParse((json['validFrom'] as String?) ?? ''),
      validUntil: DateTime.tryParse((json['validUntil'] as String?) ?? ''),
      createdAt: DateTime.tryParse((json['createdAt'] as String?) ?? ''),
      updatedAt: DateTime.tryParse((json['updatedAt'] as String?) ?? ''),
    );
  }
}

class CoursePromoCodesBackend {
  CoursePromoCodesBackend({
    required this.backend,
    required this.token,
  });

  final BackendConfig backend;
  final String? token;

  ApiClient _client() {
    if (!backend.hasApi || backend.apiBaseUrl == null) {
      throw const ApiException('Promo codes are unavailable because the API is not configured.');
    }
    final client = ApiClient(baseUrl: backend.apiBaseUrl!);
    client.setToken(token);
    return client;
  }

  Future<List<CoursePromoCodeDto>> listForCourse(String courseId) async {
    final json = await _client().getJson(
      '/v1/admin/courses/${Uri.encodeComponent(courseId)}/promo-codes',
      authenticated: true,
    );
    final rows = (json['promoCodes'] as List<dynamic>? ?? const []);
    return rows
        .map((item) => CoursePromoCodeDto.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
  }

  Future<CoursePromoCodeDto> createForCourse(String courseId, Map<String, dynamic> payload) async {
    final json = await _client().postJson(
      '/v1/admin/courses/${Uri.encodeComponent(courseId)}/promo-codes',
      authenticated: true,
      body: payload,
    );
    return CoursePromoCodeDto.fromJson(Map<String, dynamic>.from(json as Map));
  }

  Future<CoursePromoCodeDto> update(String promoCodeId, Map<String, dynamic> payload) async {
    final json = await _client().putJson(
      '/v1/admin/promo-codes/${Uri.encodeComponent(promoCodeId)}',
      authenticated: true,
      body: payload,
    );
    return CoursePromoCodeDto.fromJson(Map<String, dynamic>.from(json as Map));
  }
}
