import 'package:flutter/material.dart';

class MathAwareText extends StatelessWidget {
  const MathAwareText(
    this.value, {
    super.key,
    this.padding = const EdgeInsets.symmetric(vertical: 2),
    this.style,
  });

  final String value;
  final EdgeInsets padding;
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    final resolved = MathFormatter.format(value);
    if (resolved.isEmpty) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: padding,
      child: SelectableText(
        resolved,
        style: style ?? Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.45),
      ),
    );
  }
}

class MathFormatter {
  static String format(String input) {
    var output = input.trim();
    if (output.isEmpty) {
      return '';
    }

    output = output.replaceAll(r'$$', '');
    output = output.replaceAll(r'$', '');
    output = output.replaceAll(r'\,', ' ');
    output = output.replaceAll(r'\quad', ' ');
    output = output.replaceAll(r'\qquad', ' ');
    output = output.replaceAll(r'\left', '');
    output = output.replaceAll(r'\right', '');
    output = output.replaceAll(r'\displaystyle', '');
    output = output.replaceAll(r'\(', '');
    output = output.replaceAll(r'\)', '');
    output = output.replaceAll(r'\[', '');
    output = output.replaceAll(r'\]', '');

    output = _replaceNamedWrappers(output);
    output = _replaceFractions(output);
    output = _replaceMatrices(output);
    output = _replaceLim(output);
    output = _replaceSummations(output);
    output = _replaceProducts(output);
    output = _replaceSqrt(output);
    output = _replaceIntegrals(output);
    output = _replaceInlineCommands(output);
    output = _replaceSuperscripts(output);
    output = _replaceSubscripts(output);

    output = output.replaceAll(r'\to', _u(0x2192));
    output = output.replaceAll(r'\pm', _u(0x00B1));
    output = output.replaceAll(r'\times', _u(0x00D7));
    output = output.replaceAll(r'\cdot', _u(0x00B7));
    output = output.replaceAll(r'\div', _u(0x00F7));
    output = output.replaceAll(r'\mp', _u(0x2213));
    output = output.replaceAll(r'\ge', _u(0x2265));
    output = output.replaceAll(r'\geq', _u(0x2265));
    output = output.replaceAll(r'\le', _u(0x2264));
    output = output.replaceAll(r'\leq', _u(0x2264));
    output = output.replaceAll(r'\neq', _u(0x2260));
    output = output.replaceAll(r'\ne', _u(0x2260));
    output = output.replaceAll(r'\approx', _u(0x2248));
    output = output.replaceAll(r'\equiv', _u(0x2261));
    output = output.replaceAll(r'\sim', _u(0x223C));
    output = output.replaceAll(r'\propto', _u(0x221D));
    output = output.replaceAll(r'\partial', _u(0x2202));
    output = output.replaceAll(r'\nabla', _u(0x2207));
    output = output.replaceAll(r'\in', _u(0x2208));
    output = output.replaceAll(r'\notin', _u(0x2209));
    output = output.replaceAll(r'\subset', _u(0x2282));
    output = output.replaceAll(r'\subseteq', _u(0x2286));
    output = output.replaceAll(r'\supset', _u(0x2283));
    output = output.replaceAll(r'\supseteq', _u(0x2287));
    output = output.replaceAll(r'\cup', _u(0x222A));
    output = output.replaceAll(r'\cap', _u(0x2229));
    output = output.replaceAll(r'\forall', _u(0x2200));
    output = output.replaceAll(r'\exists', _u(0x2203));
    output = output.replaceAll(r'\therefore', _u(0x2234));
    output = output.replaceAll(r'\because', _u(0x2235));
    output = output.replaceAll(r'\rightarrow', _u(0x2192));
    output = output.replaceAll(r'\leftarrow', _u(0x2190));
    output = output.replaceAll(r'\Rightarrow', _u(0x21D2));
    output = output.replaceAll(r'\Leftarrow', _u(0x21D0));
    output = output.replaceAll(r'\leftrightarrow', _u(0x2194));
    output = output.replaceAll(r'\mapsto', _u(0x21A6));
    output = output.replaceAll(r'\implies', _u(0x21D2));
    output = output.replaceAll(r'\iff', _u(0x21D4));
    output = output.replaceAll(r'\intop', _u(0x222B));
    output = output.replaceAll(r'\oint', _u(0x222E));
    output = output.replaceAll(r'\degree', _u(0x00B0));
    output = output.replaceAll(r'\infty', _u(0x221E));
    output = output.replaceAll(r'\Re', _u(0x211C));
    output = output.replaceAll(r'\Im', _u(0x2111));
    output = output.replaceAll(r'\emptyset', _u(0x2205));
    output = output.replaceAll(r'\varnothing', _u(0x2205));
    output = output.replaceAll(r'\angle', _u(0x2220));
    output = output.replaceAll(r'\perp', _u(0x22A5));
    output = output.replaceAll(r'\parallel', _u(0x2225));
    output = output.replaceAll(r'\prime', _u(0x2032));
    output = output.replaceAll(r'\{', '');
    output = output.replaceAll(r'\}', '');
    output = output.replaceAll('{', '');
    output = output.replaceAll('}', '');
    output = output.replaceAllMapped(
      RegExp(r'(?<![A-Za-z])d([A-Za-z])(?![A-Za-z])'),
      (match) => 'd${match.group(1)}',
    );

    output = output.replaceAllMapped(RegExp(r'\\[a-zA-Z]+'), (match) {
      final command = match.group(0)!;
      return _commandMap[command] ?? command.replaceFirst(r'\', '');
    });

    return output
        .replaceAll(RegExp(r'[ ]{2,}'), ' ')
        .replaceAll(RegExp(r'\n{3,}'), '\n\n')
        .trim();
  }

  static String _replaceFractions(String input) {
    var output = input;
    final pattern = RegExp(r'\\frac\{([^{}]+)\}\{([^{}]+)\}');
    while (pattern.hasMatch(output)) {
      output = output.replaceAllMapped(pattern, (match) {
        final numerator = format(match.group(1)!);
        final denominator = format(match.group(2)!);
        return '($numerator/$denominator)';
      });
    }
    return output;
  }

  static String _replaceNamedWrappers(String input) {
    var output = input;
    final wrappers = [
      RegExp(r'\\text\{([^{}]+)\}'),
      RegExp(r'\\mathrm\{([^{}]+)\}'),
      RegExp(r'\\operatorname\{([^{}]+)\}'),
      RegExp(r'\\mathbf\{([^{}]+)\}'),
    ];

    for (final pattern in wrappers) {
      while (pattern.hasMatch(output)) {
        output = output.replaceAllMapped(
          pattern,
          (match) => format(match.group(1)!),
        );
      }
    }
    return output;
  }

  static String _replaceMatrices(String input) {
    var output = input;
    final matrixPattern = RegExp(
      r'\\begin\{(bmatrix|pmatrix)\}(.+?)\\end\{\1\}',
      dotAll: true,
    );
    while (matrixPattern.hasMatch(output)) {
      output = output.replaceAllMapped(matrixPattern, (match) {
        final body = match.group(2) ?? '';
        final rows = body
            .split(r'\\')
            .map(
              (row) => row
                  .split('&')
                  .map((cell) => format(cell))
                  .where((cell) => cell.isNotEmpty)
                  .join('   ')
                  .trim(),
            )
            .where((row) => row.isNotEmpty)
            .toList();

        if (rows.isEmpty) {
          return '[]';
        }

        if (rows.length == 1) {
          return '[ ${rows.first} ]';
        }

        final top = '${_u(0x250C)}  ${rows.first}  ${_u(0x2510)}';
        final middle = rows
            .sublist(1, rows.length - 1)
            .map((row) => '${_u(0x2502)}  $row  ${_u(0x2502)}')
            .join('\n');
        final bottom = '${_u(0x2514)}  ${rows.last}  ${_u(0x2518)}';

        return middle.isEmpty ? '$top\n$bottom' : '$top\n$middle\n$bottom';
      });
    }
    return output;
  }

  static String _replaceLim(String input) {
    var output = input;
    final patterns = [
      RegExp(r'\\lim_\{([^{}]+)\}'),
      RegExp(r'\\lim_([^\s]+)'),
    ];
    for (final pattern in patterns) {
      while (pattern.hasMatch(output)) {
        output = output.replaceAllMapped(
          pattern,
          (match) => 'lim[${format(match.group(1)!)}] ',
        );
      }
    }
    return output;
  }

  static String _replaceSqrt(String input) {
    return input.replaceAllMapped(
      RegExp(r'\\sqrt\{([^{}]+)\}'),
      (match) => '${_u(0x221A)}(${format(match.group(1)!)} )',
    );
  }

  static String _replaceIntegrals(String input) {
    var output = input;
    final patterns = [
      RegExp(r'\\int_\{([^{}]+)\}\^\{([^{}]+)\}'),
      RegExp(r'\\int_([^\^\s]+)\^\{([^{}]+)\}'),
      RegExp(r'\\int_\{([^{}]+)\}\^([^\s]+)'),
      RegExp(r'\\int_([^\^\s]+)\^([^\s]+)'),
    ];
    for (final pattern in patterns) {
      while (pattern.hasMatch(output)) {
        output = output.replaceAllMapped(
          pattern,
          (match) => '${_u(0x222B)}[${format(match.group(1)!)}${_u(0x2192)}${format(match.group(2)!)}]',
        );
      }
    }
    output = output.replaceAll(r'\int', _u(0x222B));
    return output;
  }

  static String _replaceSummations(String input) {
    var output = input;
    final patterns = [
      RegExp(r'\\sum_\{([^{}]+)\}\^\{([^{}]+)\}'),
      RegExp(r'\\sum_([^\^\s]+)\^\{([^{}]+)\}'),
      RegExp(r'\\sum_\{([^{}]+)\}\^([^\s]+)'),
      RegExp(r'\\sum_([^\^\s]+)\^([^\s]+)'),
    ];
    for (final pattern in patterns) {
      while (pattern.hasMatch(output)) {
        output = output.replaceAllMapped(
          pattern,
          (match) => '${_u(0x03A3)}[${format(match.group(1)!)}${_u(0x2192)}${format(match.group(2)!)}]',
        );
      }
    }
    return output;
  }

  static String _replaceProducts(String input) {
    var output = input;
    final patterns = [
      RegExp(r'\\prod_\{([^{}]+)\}\^\{([^{}]+)\}'),
      RegExp(r'\\prod_([^\^\s]+)\^\{([^{}]+)\}'),
      RegExp(r'\\prod_\{([^{}]+)\}\^([^\s]+)'),
      RegExp(r'\\prod_([^\^\s]+)\^([^\s]+)'),
    ];
    for (final pattern in patterns) {
      while (pattern.hasMatch(output)) {
        output = output.replaceAllMapped(
          pattern,
          (match) => '${_u(0x03A0)}[${format(match.group(1)!)}${_u(0x2192)}${format(match.group(2)!)}]',
        );
      }
    }
    return output;
  }

  static String _replaceInlineCommands(String input) {
    return input
        .replaceAll(r'\sin', 'sin')
        .replaceAll(r'\cos', 'cos')
        .replaceAll(r'\tan', 'tan')
        .replaceAll(r'\sec', 'sec')
        .replaceAll(r'\arcsec', 'arcsec')
        .replaceAll(r'\arcsin', 'arcsin')
        .replaceAll(r'\arccos', 'arccos')
        .replaceAll(r'\arctan', 'arctan')
        .replaceAll(r'\csc', 'csc')
        .replaceAll(r'\cot', 'cot')
        .replaceAll(r'\sinh', 'sinh')
        .replaceAll(r'\cosh', 'cosh')
        .replaceAll(r'\tanh', 'tanh')
        .replaceAll(r'\limsup', 'lim sup')
        .replaceAll(r'\liminf', 'lim inf')
        .replaceAll(r'\exp', 'exp')
        .replaceAll(r'\log', 'log')
        .replaceAll(r'\ln', 'ln')
        .replaceAll(r'\max', 'max')
        .replaceAll(r'\min', 'min')
        .replaceAll(r'\sup', 'sup')
        .replaceAll(r'\inf', 'inf')
        .replaceAll(r'\sum', _u(0x03A3))
        .replaceAll(r'\prod', _u(0x03A0))
        .replaceAll(r'\det', 'det');
  }

  static String _replaceSuperscripts(String input) {
    return input.replaceAllMapped(
      RegExp(r'\^(\{([^{}]+)\}|([A-Za-z0-9+\-=()]+))'),
      (match) {
        final raw = match.group(2) ?? match.group(3) ?? '';
        return _toSuperscript(raw);
      },
    );
  }

  static String _replaceSubscripts(String input) {
    return input.replaceAllMapped(
      RegExp(r'_(\{([^{}]+)\}|([A-Za-z0-9+\-=()]+))'),
      (match) {
        final raw = match.group(2) ?? match.group(3) ?? '';
        return _toSubscript(raw);
      },
    );
  }

  static String _toSuperscript(String input) {
    return input.split('').map((char) => _superscriptMap[char] ?? char).join();
  }

  static String _toSubscript(String input) {
    return input.split('').map((char) => _subscriptMap[char] ?? char).join();
  }

  static String _u(int codePoint) => String.fromCharCode(codePoint);

  static final Map<String, String> _commandMap = {
    r'\alpha': _u(0x03B1),
    r'\beta': _u(0x03B2),
    r'\gamma': _u(0x03B3),
    r'\delta': _u(0x03B4),
    r'\epsilon': _u(0x03B5),
    r'\varepsilon': _u(0x03B5),
    r'\zeta': _u(0x03B6),
    r'\eta': _u(0x03B7),
    r'\theta': _u(0x03B8),
    r'\vartheta': _u(0x03D1),
    r'\iota': _u(0x03B9),
    r'\kappa': _u(0x03BA),
    r'\nu': _u(0x03BD),
    r'\xi': _u(0x03BE),
    r'\omicron': 'o',
    r'\pi': _u(0x03C0),
    r'\rho': _u(0x03C1),
    r'\varrho': _u(0x03F1),
    r'\tau': _u(0x03C4),
    r'\upsilon': _u(0x03C5),
    r'\phi': _u(0x03C6),
    r'\varphi': _u(0x03D5),
    r'\chi': _u(0x03C7),
    r'\psi': _u(0x03C8),
    r'\omega': _u(0x03C9),
    r'\lambda': _u(0x03BB),
    r'\mu': _u(0x03BC),
    r'\sigma': _u(0x03C3),
    r'\varsigma': _u(0x03C2),
    r'\hbar': _u(0x210F),
    r'\ell': _u(0x2113),
    r'\Gamma': _u(0x0393),
    r'\Delta': _u(0x0394),
    r'\Theta': _u(0x0398),
    r'\Lambda': _u(0x039B),
    r'\Xi': _u(0x039E),
    r'\Pi': _u(0x03A0),
    r'\Sigma': _u(0x03A3),
    r'\Upsilon': _u(0x03A5),
    r'\Phi': _u(0x03A6),
    r'\Psi': _u(0x03A8),
    r'\Omega': _u(0x03A9),
    r'\aleph': _u(0x2135),
  };

  static final Map<String, String> _superscriptMap = {
    '0': _u(0x2070),
    '1': _u(0x00B9),
    '2': _u(0x00B2),
    '3': _u(0x00B3),
    '4': _u(0x2074),
    '5': _u(0x2075),
    '6': _u(0x2076),
    '7': _u(0x2077),
    '8': _u(0x2078),
    '9': _u(0x2079),
    '+': _u(0x207A),
    '-': _u(0x207B),
    '=': _u(0x207C),
    '(': _u(0x207D),
    ')': _u(0x207E),
    'n': _u(0x207F),
    'i': _u(0x2071),
  };

  static final Map<String, String> _subscriptMap = {
    '0': _u(0x2080),
    '1': _u(0x2081),
    '2': _u(0x2082),
    '3': _u(0x2083),
    '4': _u(0x2084),
    '5': _u(0x2085),
    '6': _u(0x2086),
    '7': _u(0x2087),
    '8': _u(0x2088),
    '9': _u(0x2089),
    '+': _u(0x208A),
    '-': _u(0x208B),
    '=': _u(0x208C),
    '(': _u(0x208D),
    ')': _u(0x208E),
    'a': _u(0x2090),
    'e': _u(0x2091),
    'h': _u(0x2095),
    'i': _u(0x1D62),
    'j': _u(0x2C7C),
    'k': _u(0x2096),
    'l': _u(0x2097),
    'm': _u(0x2098),
    'n': _u(0x2099),
    'o': _u(0x2092),
    'p': _u(0x209A),
    'r': _u(0x1D63),
    's': _u(0x209B),
    't': _u(0x209C),
    'u': _u(0x1D64),
    'v': _u(0x1D65),
    'x': _u(0x2093),
  };
}
