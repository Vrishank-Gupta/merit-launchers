import 'package:flutter_test/flutter_test.dart';
import 'package:merit_launchers/math/math_content.dart';

void main() {
  test('preserves generated SVG metadata on math segments', () {
    const segment = MathContentSegment(
      type: 'math',
      value: r'\int \frac{xdx}{a^{4} + x^{4}}.',
      display: true,
      original: r'\int \frac{xdx}{a^{4} + x^{4}}.',
      latex: r'\int \frac{x\,\mathrm{d}x}{a^{4} + x^{4}}',
      svgPath: '/toolkit-files/equations/hash.svg',
      svg: '<svg viewBox="0 0 10 10"></svg>',
      renderStatus: 'rendered',
    );

    final restored = MathContentSegment.fromJson(segment.toJson());

    expect(restored.isMath, isTrue);
    expect(restored.value, r'\int \frac{xdx}{a^{4} + x^{4}}.');
    expect(restored.latex, r'\int \frac{x\,\mathrm{d}x}{a^{4} + x^{4}}');
    expect(restored.svgPath, '/toolkit-files/equations/hash.svg');
    expect(restored.svg, contains('<svg'));
    expect(restored.renderStatus, 'rendered');
  });
}
