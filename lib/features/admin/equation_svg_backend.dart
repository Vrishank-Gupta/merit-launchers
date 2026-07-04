import '../../app/api_client.dart';
import '../../app/backend_config.dart';
import '../../math/math_content.dart';

class EquationSvgBackend {
  EquationSvgBackend({required this.backend, required this.token});

  final BackendConfig backend;
  final String? token;

  Future<EquationSvgBatchResult> renderEquations(
    List<EquationSvgRequest> equations,
  ) async {
    if (!backend.hasApi || backend.apiBaseUrl == null) {
      throw const ApiException(
        'Equation SVG creation is unavailable because the API is not configured.',
      );
    }

    if (equations.isEmpty) {
      return const EquationSvgBatchResult(
        summary: EquationSvgSummary(total: 0),
        segments: {},
      );
    }

    final client = ApiClient(baseUrl: backend.apiBaseUrl!);
    client.setToken(token);
    final rendered = <String, MathContentSegment>{};
    var summary = const EquationSvgSummary(total: 0);

    for (var start = 0; start < equations.length; start += 80) {
      final chunk = equations.skip(start).take(80).toList(growable: false);
      final json = await client.postJson(
        '/v1/admin/equation-svgs',
        authenticated: true,
        body: {'equations': chunk.map((item) => item.toJson()).toList()},
      );
      final chunkSummary = EquationSvgSummary.fromJson(
        Map<String, dynamic>.from(json['summary'] as Map? ?? const {}),
      );
      summary = summary + chunkSummary;

      for (final item in json['equations'] as List<dynamic>? ?? const []) {
        final map = Map<String, dynamic>.from(item as Map);
        final id = map['id']?.toString() ?? '';
        if (id.isEmpty) {
          continue;
        }
        final source = chunk.firstWhere(
          (request) => request.id == id,
          orElse:
              () => EquationSvgRequest(
                id: id,
                original: map['original']?.toString() ?? '',
                display: map['display'] == 'block',
              ),
        );
        rendered[id] = MathContentSegment(
          type: 'math',
          value: source.original,
          display: map['display'] == 'block',
          svg: map['svg'] as String?,
          original: map['original'] as String?,
          latex: map['latex'] as String?,
          svgPath: map['svgPath'] as String?,
          renderStatus: map['status'] as String?,
          error: map['error'] as String?,
        );
      }
    }

    return EquationSvgBatchResult(summary: summary, segments: rendered);
  }
}

class EquationSvgRequest {
  const EquationSvgRequest({
    required this.id,
    required this.original,
    required this.display,
  });

  final String id;
  final String original;
  final bool display;

  Map<String, dynamic> toJson() => {
    'id': id,
    'original': original,
    'display': display,
  };
}

class EquationSvgBatchResult {
  const EquationSvgBatchResult({required this.summary, required this.segments});

  final EquationSvgSummary summary;
  final Map<String, MathContentSegment> segments;
}

class EquationSvgSummary {
  const EquationSvgSummary({
    required this.total,
    this.created = 0,
    this.reused = 0,
    this.failed = 0,
  });

  final int total;
  final int created;
  final int reused;
  final int failed;

  factory EquationSvgSummary.fromJson(Map<String, dynamic> json) {
    return EquationSvgSummary(
      total: (json['total'] as num?)?.toInt() ?? 0,
      created: (json['created'] as num?)?.toInt() ?? 0,
      reused: (json['reused'] as num?)?.toInt() ?? 0,
      failed: (json['failed'] as num?)?.toInt() ?? 0,
    );
  }

  EquationSvgSummary operator +(EquationSvgSummary other) {
    return EquationSvgSummary(
      total: total + other.total,
      created: created + other.created,
      reused: reused + other.reused,
      failed: failed + other.failed,
    );
  }
}
