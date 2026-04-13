import 'package:flutter/material.dart';

class AdminMathCategory {
  const AdminMathCategory({
    required this.id,
    required this.label,
    required this.icon,
    required this.groups,
  });

  final String id;
  final String label;
  final IconData icon;
  final List<AdminMathGroup> groups;
}

class AdminMathGroup {
  const AdminMathGroup({required this.label, required this.templates});

  final String label;
  final List<AdminMathTemplate> templates;
}

class AdminMathTemplate {
  const AdminMathTemplate({
    required this.label,
    required this.preview,
    required this.latex,
  });

  final String label;
  final String preview;
  final String latex;
}

const String _p = r'\placeholder{}';

const adminMathPalette = <AdminMathCategory>[
  AdminMathCategory(
    id: 'general',
    label: 'General',
    icon: Icons.functions_rounded,
    groups: [
      AdminMathGroup(
        label: 'Fractions and roots',
        templates: [
          AdminMathTemplate(
            label: 'Fraction',
            preview: 'a/b',
            latex: r'\frac{' + _p + '}{' + _p + '}',
          ),
          AdminMathTemplate(
            label: 'Bevelled fraction',
            preview: 'a/b',
            latex: _p + '/' + _p,
          ),
          AdminMathTemplate(
            label: 'Square root',
            preview: 'sqrt(x)',
            latex: r'\sqrt{' + _p + '}',
          ),
          AdminMathTemplate(
            label: 'Nth root',
            preview: 'root(n,x)',
            latex: r'\sqrt[' + _p + ']{' + _p + '}',
          ),
        ],
      ),
      AdminMathGroup(
        label: 'Scripts',
        templates: [
          AdminMathTemplate(
            label: 'Superscript',
            preview: 'x^2',
            latex: _p + '^{' + _p + '}',
          ),
          AdminMathTemplate(
            label: 'Subscript',
            preview: 'x_1',
            latex: _p + '_{' + _p + '}',
          ),
          AdminMathTemplate(
            label: 'Superscript + subscript',
            preview: 'x_1^2',
            latex: _p + '_{' + _p + '}^{' + _p + '}',
          ),
          AdminMathTemplate(
            label: 'Left superscript',
            preview: '^2x',
            latex: '{}^{' + _p + '}\\!' + _p,
          ),
          AdminMathTemplate(
            label: 'Left subscript',
            preview: '_1x',
            latex: '{}_{' + _p + '}\\!' + _p,
          ),
        ],
      ),
      AdminMathGroup(
        label: 'Brackets',
        templates: [
          AdminMathTemplate(
            label: 'Parentheses',
            preview: '(x)',
            latex: r'\left(' + _p + r'\right)',
          ),
          AdminMathTemplate(
            label: 'Square brackets',
            preview: '[x]',
            latex: r'\left[' + _p + r'\right]',
          ),
          AdminMathTemplate(
            label: 'Curly brackets',
            preview: '{x}',
            latex: r'\left\{' + _p + r'\right\}',
          ),
          AdminMathTemplate(
            label: 'Absolute value',
            preview: '|x|',
            latex: r'\left|' + _p + r'\right|',
          ),
        ],
      ),
    ],
  ),
  AdminMathCategory(
    id: 'symbols',
    label: 'Symbols',
    icon: Icons.all_inclusive_rounded,
    groups: [
      AdminMathGroup(
        label: 'Arithmetic',
        templates: [
          AdminMathTemplate(label: 'Plus', preview: '+', latex: '+'),
          AdminMathTemplate(label: 'Minus', preview: '-', latex: '-'),
          AdminMathTemplate(label: 'Plus-minus', preview: '±', latex: r'\pm'),
          AdminMathTemplate(label: 'Multiply', preview: '×', latex: r'\times'),
          AdminMathTemplate(label: 'Divide', preview: '÷', latex: r'\div'),
          AdminMathTemplate(label: 'Dot', preview: '·', latex: r'\cdot'),
          AdminMathTemplate(label: 'Slash', preview: '/', latex: '/'),
        ],
      ),
      AdminMathGroup(
        label: 'Relations',
        templates: [
          AdminMathTemplate(label: 'Equals', preview: '=', latex: '='),
          AdminMathTemplate(label: 'Not equal', preview: '≠', latex: r'\ne'),
          AdminMathTemplate(
            label: 'Approximately equal',
            preview: '≈',
            latex: r'\approx',
          ),
          AdminMathTemplate(
            label: 'Equivalent',
            preview: '≡',
            latex: r'\equiv',
          ),
          AdminMathTemplate(label: 'Greater than', preview: '>', latex: '>'),
          AdminMathTemplate(label: 'Less than', preview: '<', latex: '<'),
          AdminMathTemplate(
            label: 'Greater or equal',
            preview: '≥',
            latex: r'\geq',
          ),
          AdminMathTemplate(
            label: 'Less or equal',
            preview: '≤',
            latex: r'\leq',
          ),
        ],
      ),
      AdminMathGroup(
        label: 'Sets and constants',
        templates: [
          AdminMathTemplate(label: 'Element of', preview: '∈', latex: r'\in'),
          AdminMathTemplate(label: 'Not in', preview: '∉', latex: r'\notin'),
          AdminMathTemplate(label: 'Subset', preview: '⊂', latex: r'\subset'),
          AdminMathTemplate(
            label: 'Subset or equal',
            preview: '⊆',
            latex: r'\subseteq',
          ),
          AdminMathTemplate(label: 'Union', preview: '∪', latex: r'\cup'),
          AdminMathTemplate(
            label: 'Intersection',
            preview: '∩',
            latex: r'\cap',
          ),
          AdminMathTemplate(
            label: 'Empty set',
            preview: '∅',
            latex: r'\varnothing',
          ),
          AdminMathTemplate(label: 'Infinity', preview: '∞', latex: r'\infty'),
          AdminMathTemplate(label: 'Pi', preview: 'π', latex: r'\pi'),
          AdminMathTemplate(label: 'Degree', preview: '°', latex: r'^{\circ}'),
        ],
      ),
    ],
  ),
  AdminMathCategory(
    id: 'arrows',
    label: 'Arrows',
    icon: Icons.trending_flat_rounded,
    groups: [
      AdminMathGroup(
        label: 'Simple arrows',
        templates: [
          AdminMathTemplate(
            label: 'Right arrow',
            preview: '→',
            latex: r'\rightarrow',
          ),
          AdminMathTemplate(
            label: 'Left arrow',
            preview: '←',
            latex: r'\leftarrow',
          ),
          AdminMathTemplate(
            label: 'Left-right arrow',
            preview: '↔',
            latex: r'\leftrightarrow',
          ),
          AdminMathTemplate(
            label: 'Implies',
            preview: '⇒',
            latex: r'\Rightarrow',
          ),
          AdminMathTemplate(
            label: 'If and only if',
            preview: '⇔',
            latex: r'\Leftrightarrow',
          ),
          AdminMathTemplate(label: 'Maps to', preview: '↦', latex: r'\mapsto'),
        ],
      ),
      AdminMathGroup(
        label: 'Annotated arrows',
        templates: [
          AdminMathTemplate(
            label: 'Arrow with top text',
            preview: 'x ->',
            latex: r'\xrightarrow{' + _p + '}',
          ),
          AdminMathTemplate(
            label: 'Arrow with left text',
            preview: '<- x',
            latex: r'\xleftarrow{' + _p + '}',
          ),
          AdminMathTemplate(
            label: 'Equilibrium',
            preview: '⇌',
            latex: r'\rightleftharpoons',
          ),
          AdminMathTemplate(
            label: 'Reaction both ways',
            preview: '⇄',
            latex: r'\rightleftarrows',
          ),
        ],
      ),
    ],
  ),
  AdminMathCategory(
    id: 'greek',
    label: 'Greek',
    icon: Icons.sort_by_alpha_rounded,
    groups: [
      AdminMathGroup(
        label: 'Lowercase',
        templates: [
          AdminMathTemplate(label: 'alpha', preview: 'α', latex: r'\alpha'),
          AdminMathTemplate(label: 'beta', preview: 'β', latex: r'\beta'),
          AdminMathTemplate(label: 'gamma', preview: 'γ', latex: r'\gamma'),
          AdminMathTemplate(label: 'delta', preview: 'δ', latex: r'\delta'),
          AdminMathTemplate(label: 'theta', preview: 'θ', latex: r'\theta'),
          AdminMathTemplate(label: 'lambda', preview: 'λ', latex: r'\lambda'),
          AdminMathTemplate(label: 'mu', preview: 'μ', latex: r'\mu'),
          AdminMathTemplate(label: 'sigma', preview: 'σ', latex: r'\sigma'),
          AdminMathTemplate(label: 'omega', preview: 'ω', latex: r'\omega'),
        ],
      ),
      AdminMathGroup(
        label: 'Uppercase and sets',
        templates: [
          AdminMathTemplate(label: 'Delta', preview: 'Δ', latex: r'\Delta'),
          AdminMathTemplate(label: 'Gamma', preview: 'Γ', latex: r'\Gamma'),
          AdminMathTemplate(label: 'Theta', preview: 'Θ', latex: r'\Theta'),
          AdminMathTemplate(label: 'Lambda', preview: 'Λ', latex: r'\Lambda'),
          AdminMathTemplate(label: 'Sigma', preview: 'Σ', latex: r'\Sigma'),
          AdminMathTemplate(label: 'Omega', preview: 'Ω', latex: r'\Omega'),
          AdminMathTemplate(
            label: 'Naturals',
            preview: 'N',
            latex: r'\mathbb{N}',
          ),
          AdminMathTemplate(
            label: 'Integers',
            preview: 'Z',
            latex: r'\mathbb{Z}',
          ),
          AdminMathTemplate(
            label: 'Rationals',
            preview: 'Q',
            latex: r'\mathbb{Q}',
          ),
          AdminMathTemplate(label: 'Reals', preview: 'R', latex: r'\mathbb{R}'),
          AdminMathTemplate(
            label: 'Complex',
            preview: 'C',
            latex: r'\mathbb{C}',
          ),
        ],
      ),
    ],
  ),
  AdminMathCategory(
    id: 'matrices',
    label: 'Matrices',
    icon: Icons.grid_view_rounded,
    groups: [
      AdminMathGroup(
        label: 'Matrices',
        templates: [
          AdminMathTemplate(
            label: '2 x 2 matrix',
            preview: '[a b; c d]',
            latex:
                r'\begin{bmatrix} ' +
                _p +
                ' & ' +
                _p +
                r' \\ ' +
                _p +
                ' & ' +
                _p +
                r' \end{bmatrix}',
          ),
          AdminMathTemplate(
            label: '3 x 3 matrix',
            preview: '[a b c; d e f; g h i]',
            latex:
                r'\begin{bmatrix} ' +
                _p +
                ' & ' +
                _p +
                ' & ' +
                _p +
                r' \\ ' +
                _p +
                ' & ' +
                _p +
                ' & ' +
                _p +
                r' \\ ' +
                _p +
                ' & ' +
                _p +
                ' & ' +
                _p +
                r' \end{bmatrix}',
          ),
          AdminMathTemplate(
            label: 'Column vector',
            preview: '[x; y; z]',
            latex:
                r'\begin{bmatrix} ' +
                _p +
                r' \\ ' +
                _p +
                r' \\ ' +
                _p +
                r' \end{bmatrix}',
          ),
          AdminMathTemplate(
            label: 'Row vector',
            preview: '[x y z]',
            latex:
                r'\begin{bmatrix} ' +
                _p +
                ' & ' +
                _p +
                ' & ' +
                _p +
                r' \end{bmatrix}',
          ),
          AdminMathTemplate(
            label: 'Parenthesized matrix',
            preview: '(a b; c d)',
            latex:
                r'\begin{pmatrix} ' +
                _p +
                ' & ' +
                _p +
                r' \\ ' +
                _p +
                ' & ' +
                _p +
                r' \end{pmatrix}',
          ),
        ],
      ),
      AdminMathGroup(
        label: 'Determinants and cases',
        templates: [
          AdminMathTemplate(
            label: '2 x 2 determinant',
            preview: '|a b; c d|',
            latex:
                r'\begin{vmatrix} ' +
                _p +
                ' & ' +
                _p +
                r' \\ ' +
                _p +
                ' & ' +
                _p +
                r' \end{vmatrix}',
          ),
          AdminMathTemplate(
            label: '3 x 3 determinant',
            preview: '|a b c; d e f; g h i|',
            latex:
                r'\begin{vmatrix} ' +
                _p +
                ' & ' +
                _p +
                ' & ' +
                _p +
                r' \\ ' +
                _p +
                ' & ' +
                _p +
                ' & ' +
                _p +
                r' \\ ' +
                _p +
                ' & ' +
                _p +
                ' & ' +
                _p +
                r' \end{vmatrix}',
          ),
          AdminMathTemplate(
            label: 'Cases',
            preview: '{ x^2, x>0 }',
            latex:
                r'\begin{cases} ' +
                _p +
                ', & ' +
                _p +
                r' \\ ' +
                _p +
                ', & ' +
                _p +
                r' \end{cases}',
          ),
          AdminMathTemplate(
            label: 'Binomial',
            preview: '(n over k)',
            latex: r'\binom{' + _p + '}{' + _p + '}',
          ),
        ],
      ),
    ],
  ),
  AdminMathCategory(
    id: 'layout',
    label: 'Scripts/Layout',
    icon: Icons.dashboard_customize_rounded,
    groups: [
      AdminMathGroup(
        label: 'Accents',
        templates: [
          AdminMathTemplate(
            label: 'Bar',
            preview: 'x-bar',
            latex: r'\bar{' + _p + '}',
          ),
          AdminMathTemplate(
            label: 'Hat',
            preview: 'x-hat',
            latex: r'\hat{' + _p + '}',
          ),
          AdminMathTemplate(
            label: 'Vector',
            preview: 'vec(x)',
            latex: r'\vec{' + _p + '}',
          ),
          AdminMathTemplate(
            label: 'Dot',
            preview: 'dot(x)',
            latex: r'\dot{' + _p + '}',
          ),
          AdminMathTemplate(
            label: 'Double dot',
            preview: 'ddot(x)',
            latex: r'\ddot{' + _p + '}',
          ),
          AdminMathTemplate(
            label: 'Overline',
            preview: 'overline(x)',
            latex: r'\overline{' + _p + '}',
          ),
        ],
      ),
      AdminMathGroup(
        label: 'Text and emphasis',
        templates: [
          AdminMathTemplate(
            label: 'Text',
            preview: 'text',
            latex: r'\text{' + _p + '}',
          ),
          AdminMathTemplate(
            label: 'Roman',
            preview: 'ABC',
            latex: r'\mathrm{' + _p + '}',
          ),
          AdminMathTemplate(
            label: 'Bold',
            preview: 'bold',
            latex: r'\mathbf{' + _p + '}',
          ),
          AdminMathTemplate(
            label: 'Color box',
            preview: 'highlight',
            latex: r'\boxed{' + _p + '}',
          ),
        ],
      ),
    ],
  ),
  AdminMathCategory(
    id: 'brackets',
    label: 'Brackets',
    icon: Icons.data_object_rounded,
    groups: [
      AdminMathGroup(
        label: 'Common brackets',
        templates: [
          AdminMathTemplate(
            label: 'Round',
            preview: '(x)',
            latex: r'\left(' + _p + r'\right)',
          ),
          AdminMathTemplate(
            label: 'Square',
            preview: '[x]',
            latex: r'\left[' + _p + r'\right]',
          ),
          AdminMathTemplate(
            label: 'Curly',
            preview: '{x}',
            latex: r'\left\{' + _p + r'\right\}',
          ),
          AdminMathTemplate(
            label: 'Angle',
            preview: '<x>',
            latex: r'\left\langle ' + _p + r' \right\rangle',
          ),
        ],
      ),
      AdminMathGroup(
        label: 'Size-aware bars',
        templates: [
          AdminMathTemplate(
            label: 'Single bar',
            preview: '|x|',
            latex: r'\left|' + _p + r'\right|',
          ),
          AdminMathTemplate(
            label: 'Double bar',
            preview: '||x||',
            latex: r'\left\|' + _p + r'\right\|',
          ),
          AdminMathTemplate(
            label: 'Floor',
            preview: 'floor(x)',
            latex: r'\left\lfloor ' + _p + r' \right\rfloor',
          ),
          AdminMathTemplate(
            label: 'Ceiling',
            preview: 'ceil(x)',
            latex: r'\left\lceil ' + _p + r' \right\rceil',
          ),
        ],
      ),
    ],
  ),
  AdminMathCategory(
    id: 'bigops',
    label: 'Big operators',
    icon: Icons.calculate_rounded,
    groups: [
      AdminMathGroup(
        label: 'Large operators',
        templates: [
          AdminMathTemplate(
            label: 'Summation',
            preview: 'sum',
            latex: r'\sum_{' + _p + '}^{' + _p + '} ' + _p,
          ),
          AdminMathTemplate(
            label: 'Product',
            preview: 'prod',
            latex: r'\prod_{' + _p + '}^{' + _p + '} ' + _p,
          ),
          AdminMathTemplate(
            label: 'Coproduct',
            preview: 'coprod',
            latex: r'\coprod_{' + _p + '}^{' + _p + '} ' + _p,
          ),
          AdminMathTemplate(
            label: 'Big union',
            preview: 'U',
            latex: r'\bigcup_{' + _p + '}^{' + _p + '} ' + _p,
          ),
          AdminMathTemplate(
            label: 'Big intersection',
            preview: 'cap',
            latex: r'\bigcap_{' + _p + '}^{' + _p + '} ' + _p,
          ),
        ],
      ),
      AdminMathGroup(
        label: 'Integrals',
        templates: [
          AdminMathTemplate(
            label: 'Integral',
            preview: 'int',
            latex: r'\int ' + _p + r'\, d' + _p,
          ),
          AdminMathTemplate(
            label: 'Double integral',
            preview: 'iint',
            latex: r'\iint ' + _p + r'\, d' + _p,
          ),
          AdminMathTemplate(
            label: 'Triple integral',
            preview: 'iiint',
            latex: r'\iiint ' + _p + r'\, d' + _p,
          ),
          AdminMathTemplate(
            label: 'Contour integral',
            preview: 'oint',
            latex: r'\oint ' + _p + r'\, d' + _p,
          ),
        ],
      ),
    ],
  ),
  AdminMathCategory(
    id: 'calculus',
    label: 'Calculus',
    icon: Icons.timeline_rounded,
    groups: [
      AdminMathGroup(
        label: 'Limits and derivatives',
        templates: [
          AdminMathTemplate(
            label: 'Limit',
            preview: 'lim',
            latex: r'\lim_{' + _p + r'\to ' + _p + '} ' + _p,
          ),
          AdminMathTemplate(
            label: 'Limit to infinity',
            preview: 'x->inf',
            latex: r'\lim_{' + _p + r'\to \infty} ' + _p,
          ),
          AdminMathTemplate(
            label: 'Derivative',
            preview: 'd/dx',
            latex: r'\frac{d}{d' + _p + '} ' + _p,
          ),
          AdminMathTemplate(
            label: 'Partial derivative',
            preview: 'partial',
            latex: r'\frac{\partial}{\partial ' + _p + '} ' + _p,
          ),
          AdminMathTemplate(
            label: 'Nabla',
            preview: 'nabla',
            latex: r'\nabla ' + _p,
          ),
        ],
      ),
      AdminMathGroup(
        label: 'Functions',
        templates: [
          AdminMathTemplate(
            label: 'sin',
            preview: 'sin(x)',
            latex: r'\sin\left(' + _p + r'\right)',
          ),
          AdminMathTemplate(
            label: 'cos',
            preview: 'cos(x)',
            latex: r'\cos\left(' + _p + r'\right)',
          ),
          AdminMathTemplate(
            label: 'tan',
            preview: 'tan(x)',
            latex: r'\tan\left(' + _p + r'\right)',
          ),
          AdminMathTemplate(
            label: 'log',
            preview: 'log(x)',
            latex: r'\log\left(' + _p + r'\right)',
          ),
          AdminMathTemplate(
            label: 'log base',
            preview: 'log_a(x)',
            latex: r'\log_{' + _p + r'}\left(' + _p + r'\right)',
          ),
          AdminMathTemplate(
            label: 'ln',
            preview: 'ln(x)',
            latex: r'\ln\left(' + _p + r'\right)',
          ),
        ],
      ),
    ],
  ),
  AdminMathCategory(
    id: 'chemistry',
    label: 'Chemistry',
    icon: Icons.science_rounded,
    groups: [
      AdminMathGroup(
        label: 'Elements and units',
        templates: [
          AdminMathTemplate(label: 'H', preview: 'H', latex: r'\mathrm{H}'),
          AdminMathTemplate(label: 'C', preview: 'C', latex: r'\mathrm{C}'),
          AdminMathTemplate(label: 'N', preview: 'N', latex: r'\mathrm{N}'),
          AdminMathTemplate(label: 'O', preview: 'O', latex: r'\mathrm{O}'),
          AdminMathTemplate(label: 'F', preview: 'F', latex: r'\mathrm{F}'),
          AdminMathTemplate(label: 'S', preview: 'S', latex: r'\mathrm{S}'),
          AdminMathTemplate(
            label: 'H2O',
            preview: 'H2O',
            latex: r'\mathrm{H_2O}',
          ),
          AdminMathTemplate(
            label: 'CO2',
            preview: 'CO2',
            latex: r'\mathrm{CO_2}',
          ),
          AdminMathTemplate(
            label: 'mol',
            preview: 'mol',
            latex: r'\mathrm{mol}',
          ),
        ],
      ),
      AdminMathGroup(
        label: 'Reactions',
        templates: [
          AdminMathTemplate(
            label: 'Forward reaction',
            preview: 'A->B',
            latex: r'\rightarrow',
          ),
          AdminMathTemplate(
            label: 'Equilibrium',
            preview: 'A<=>B',
            latex: r'\rightleftharpoons',
          ),
          AdminMathTemplate(
            label: 'Both directions',
            preview: 'A<->B',
            latex: r'\rightleftarrows',
          ),
          AdminMathTemplate(
            label: 'Arrow with condition',
            preview: 'A-[x]->B',
            latex: r'\xrightarrow{' + _p + '}',
          ),
          AdminMathTemplate(
            label: 'Left arrow with condition',
            preview: 'A<-[x]-B',
            latex: r'\xleftarrow{' + _p + '}',
          ),
          AdminMathTemplate(label: 'Delta', preview: 'Delta', latex: r'\Delta'),
        ],
      ),
    ],
  ),
];
