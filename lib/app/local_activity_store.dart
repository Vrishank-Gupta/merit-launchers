import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'models.dart';

class LocalActivitySnapshot {
  const LocalActivitySnapshot({
    required this.purchases,
    required this.attempts,
    required this.examSessions,
    required this.supportMessages,
  });

  final List<Purchase> purchases;
  final List<ExamAttempt> attempts;
  final List<ExamSession> examSessions;
  final List<SupportMessage> supportMessages;
}

class LocalActivityStore {
  LocalActivityStore._(this._preferences);

  final SharedPreferences _preferences;

  static Future<LocalActivityStore> create() async {
    final preferences = await SharedPreferences.getInstance();
    return LocalActivityStore._(preferences);
  }

  Future<LocalActivitySnapshot> load(String studentId) async {
    return LocalActivitySnapshot(
      purchases: _readList(_purchasesKey(studentId), Purchase.fromJson),
      attempts: _readList(_attemptsKey(studentId), ExamAttempt.fromJson),
      examSessions: _readList(_sessionsKey(studentId), ExamSession.fromJson),
      supportMessages: _readList(_supportKey(studentId), SupportMessage.fromJson),
    );
  }

  Future<void> save({
    required String studentId,
    required List<Purchase> purchases,
    required List<ExamAttempt> attempts,
    required List<ExamSession> examSessions,
    required List<SupportMessage> supportMessages,
  }) async {
    await _preferences.setString(
      _purchasesKey(studentId),
      jsonEncode(purchases.map((item) => item.toJson()).toList()),
    );
    await _preferences.setString(
      _attemptsKey(studentId),
      jsonEncode(attempts.map((item) => item.toJson()).toList()),
    );
    await _preferences.setString(
      _sessionsKey(studentId),
      jsonEncode(examSessions.map((item) => item.toJson()).toList()),
    );
    await _preferences.setString(
      _supportKey(studentId),
      jsonEncode(supportMessages.map((item) => item.toJson()).toList()),
    );
  }

  List<T> _readList<T>(
    String key,
    T Function(Map<String, dynamic> json) fromJson,
  ) {
    final raw = _preferences.getString(key);
    if (raw == null || raw.isEmpty) {
      return const [];
    }

    final decoded = jsonDecode(raw);
    if (decoded is! List) {
      return const [];
    }

    return decoded
        .whereType<Map>()
        .map((item) => fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  String _purchasesKey(String studentId) => 'local_purchases_$studentId';
  String _attemptsKey(String studentId) => 'local_attempts_$studentId';
  String _sessionsKey(String studentId) => 'local_sessions_$studentId';
  String _supportKey(String studentId) => 'local_support_$studentId';
}
