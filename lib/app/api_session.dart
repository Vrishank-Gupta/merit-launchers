class ApiSessionUser {
  const ApiSessionUser({
    required this.id,
    required this.role,
    required this.name,
    this.email,
    this.phone,
    this.city,
    this.referralCode,
    this.hasCmsAdminAccess = false,
  });

  final String id;
  final String role;
  final String name;
  final String? email;
  final String? phone;
  final String? city;
  final String? referralCode;
  final bool hasCmsAdminAccess;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'role': role,
      'name': name,
      'email': email,
      'phone': phone,
      'city': city,
      'referralCode': referralCode,
      'hasCmsAdminAccess': hasCmsAdminAccess,
    };
  }

  factory ApiSessionUser.fromJson(Map<String, dynamic> json) {
    return ApiSessionUser(
      id: json['id'] as String? ?? '',
      role: json['role'] as String? ?? 'student',
      name: json['name'] as String? ?? '',
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      city: json['city'] as String?,
      referralCode: json['referralCode'] as String?,
      hasCmsAdminAccess: json['hasCmsAdminAccess'] as bool? ?? false,
    );
  }
}

class ApiSession {
  const ApiSession({
    required this.token,
    required this.user,
  });

  final String token;
  final ApiSessionUser user;

  Map<String, dynamic> toJson() {
    return {
      'token': token,
      'user': user.toJson(),
    };
  }

  factory ApiSession.fromJson(Map<String, dynamic> json) {
    return ApiSession(
      token: json['token'] as String? ?? '',
      user: ApiSessionUser.fromJson(Map<String, dynamic>.from(json['user'] as Map? ?? const {})),
    );
  }
}
