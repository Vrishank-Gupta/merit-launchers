import json
import hashlib
import os
import re
from pathlib import Path

import fitz
from rapidocr_onnxruntime import RapidOCR
import psycopg2
import psycopg2.extras


REPO_ROOT = Path(r"c:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers")
ROOT = Path(r"C:\Users\VRISHANK\Downloads\CUET -20260327T154403Z-3-001\CUET")
COURSE_ID = "cuet"
REPORT_PATH = REPO_ROOT / "docs" / "cuet_import_report.json"
OUTPUT_PATH = REPO_ROOT / "docs" / "cuet_ocr_recovery_report.json"
SKIP_LOG_PATH = REPO_ROOT / "docs" / "cuet_skipped_questions.json"


def load_env():
    env_path = REPO_ROOT / "server.env"
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        if not raw_line or raw_line.strip().startswith("#") or "=" not in raw_line:
            continue
        key, value = raw_line.split("=", 1)
        os.environ.setdefault(key, value)


def db_url():
    value = os.environ.get("DATABASE_URL", "")
    return value.replace("@postgres:5432/", "@localhost:5432/")


def slugify(value: str) -> str:
    value = value.lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value


def short_hash(value: str) -> str:
    return hashlib.md5(value.encode("utf-8")).hexdigest()[:8]


def normalize_key(value: str) -> str:
    value = re.sub(r"\.pdf$", "", value, flags=re.I)
    value = re.sub(r"[().]", " ", value.lower())
    value = value.replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def build_text_cache_overrides():
    overrides = {}
    math_cache_dir = REPO_ROOT / "docs" / "math_easyocr"
    for paper_no in range(1, 10):
        overrides[normalize_key(str(ROOT / "Mathematics" / f"PAPER {paper_no}.pdf"))] = (
            math_cache_dir / f"paper_{paper_no}_easyocr.txt"
        )
    overrides[normalize_key(str(ROOT / "Mathematics" / "PAPER 10.pdf"))] = REPO_ROOT / "docs" / "math10_easyocr.txt"
    return overrides


TEXT_CACHE_OVERRIDES = build_text_cache_overrides()


TARGETED_OCR_PAGES = {
    normalize_key(str(ROOT / "Chemistry" / "PAPER 2.pdf")): {16, 17},
    normalize_key(str(ROOT / "Chemistry" / "PAPER 5.pdf")): {15, 16, 17},
    normalize_key(str(ROOT / "Chemistry" / "PAPER 6.pdf")): {16, 17, 18},
    normalize_key(str(ROOT / "Chemistry" / "PAPER 8.pdf")): {14, 15, 16, 17},
}


def cfg_key(subject: str, paper: str) -> str:
    return normalize_key(f"{subject}/{paper}")


MANUAL_RECOVERY_CONFIG = {
    cfg_key("Chemistry", "PAPER 8"): {
        "patches": {
            11: {"correctIndex": 1},
            12: {
                "options": [
                    "Methylene Imine",
                    "Methylamine",
                    "Ethylamine",
                    "None of the above",
                ],
                "correctIndex": 0,
            },
            29: {
                "prompt": "Acid-catalysed hydration of alkenes except ethene leads to the formation of",
                "options": [
                    "primary alcohol",
                    "secondary or tertiary alcohol",
                    "mixture of primary and secondary alcohols",
                    "mixture of secondary and tertiary alcohols",
                ],
                "correctIndex": 1,
            },
            35: {
                "prompt": "The standard reduction potentials of elements A, B, C and D are respectively -2.90 V, +1.50 V, -0.74 V and +0.34 V. Among these, the strongest oxidising agent is",
                "options": ["A", "B", "C", "D"],
                "correctIndex": 1,
            },
            36: {"correctIndex": 1},
            37: {
                "prompt": "Among Cu, Ag, Fe and Zn, which metal can displace the rest of the metals from their salt solutions?",
                "options": ["Cu", "Zn", "Ag", "Fe"],
                "correctIndex": 1,
            },
            38: {
                "note": "Recovered from low-quality source image; retained because answer key and OCR agree.",
                "correctIndex": 2,
            },
            39: {"correctIndex": 3},
            41: {"correctIndex": 0},
            44: {
                "options": [
                    "Colourless liquid",
                    "White waxy solid",
                    "Brown gas",
                    "Yellowish gas",
                ],
                "correctIndex": 0,
            },
        },
        "skips": {
            40: "Original question 40 in Chemistry 8 is not recoverable due to very poor source image quality.",
            42: "Formula/notation options are too corrupted to reconstruct safely.",
            46: "Option set is incomplete after OCR and cannot be reconstructed confidently.",
            49: "Prompt/options are incomplete and diagram-like notation is missing.",
        },
    },
    cfg_key("Chemistry", "PAPER 5"): {
        "patches": {
            11: {"correctIndex": 1},
            13: {"correctIndex": 1},
            15: {"correctIndex": 2},
            17: {"correctIndex": 3},
            18: {"correctIndex": 3},
            26: {"correctIndex": 0},
            27: {"correctIndex": 3},
            28: {"correctIndex": 2},
            29: {"correctIndex": 0},
            38: {"correctIndex": 2},
            41: {"correctIndex": 1},
            42: {"correctIndex": 3},
            44: {"correctIndex": 0},
            47: {"correctIndex": 0},
            48: {"correctIndex": 2},
        },
        "skips": {
            25: "Assertion-reason options are malformed in the source and cannot be reconstructed safely.",
            32: "Prompt and option boundaries are corrupted around the dichromate/electrochemistry section.",
            35: "Electrochemistry prompt is too degraded for a trustworthy import.",
            36: "Electrochemistry calculation prompt is truncated across page boundaries.",
            37: "Deposition-time question is too degraded to reconstruct accurately.",
            39: "Assertion-reason block is structurally corrupted in OCR output.",
            40: "Fuel-cell net reaction options are too corrupted to preserve accurately.",
            43: "Boltzmann-factor expression is too malformed in OCR output.",
        },
    },
    cfg_key("General Aptitude Test", "PAPER17"): {
        "patches": {
            20: {
                "options": ["NITI Aayog", "World Economic Forum", "World Bank", "INDIAai"],
                "correctIndex": 3,
            },
            37: {"correctIndex": 2},
            43: {"correctIndex": 1},
            48: {"correctIndex": 3},
            50: {"correctIndex": 3},
            51: {"correctIndex": 3},
            53: {
                "options": ["3", "0", "1", "2"],
                "correctIndex": 0,
            },
            54: {"correctIndex": 2},
            57: {"correctIndex": 1},
            63: {"correctIndex": 1},
            65: {
                "options": ["9", "10", "11", "12"],
                "correctIndex": 3,
            },
            66: {"correctIndex": 2},
            69: {"correctIndex": 3},
        },
        "skips": {
            33: "Number-series prompt is truncated and one option is missing in the source.",
            41: "Mirror-image question depends on a missing figure and should not be imported without the visual.",
            44: "Figure-based question depends on missing diagram content.",
            52: "Coding question answer is not reliably recoverable from the available source pages.",
        },
    },
    cfg_key("Mathematics", "PAPER 10"): {
        "patches": {
            1: {"correctIndex": 2},
            2: {"correctIndex": 2},
            3: {
                "options": ["1", "2", "3", "4"],
                "correctIndex": 3,
            },
            4: {"correctIndex": 2},
            6: {"correctIndex": 2},
            7: {
                "options": ["0.0875", "1/16", "0.1125", "None of these"],
                "correctIndex": 0,
            },
            18: {"correctIndex": 2},
            19: {"correctIndex": 2},
            20: {
                "prompt": "Region represented by x >= 0, y >= 0 is:",
                "options": ["First quadrant", "Second quadrant", "Third quadrant", "Fourth quadrant"],
                "correctIndex": 0,
            },
            21: {"correctIndex": 1},
            27: {"correctIndex": 2},
            35: {"correctIndex": 0},
            36: {"correctIndex": 2},
            37: {"correctIndex": 1},
            38: {"correctIndex": 2},
            39: {"correctIndex": 0},
            43: {"correctIndex": 0},
            44: {"correctIndex": 1},
            45: {"correctIndex": 0},
            46: {"correctIndex": 1},
        },
        "skips": {
            5: "Merged vector-magnitude and parallelogram question block; not trustworthy enough to import automatically.",
            8: "Probability/fraction options are incomplete after OCR and cannot be reconstructed safely.",
            9: "Sock-probability block is merged with the next question.",
            10: "Question text is lost; only orphaned numeric options remain.",
            11: "Ball-probability options are truncated and cannot be preserved accurately.",
            12: "Multiple questions are collapsed into one OCR block around page 6.",
            13: "Integral prompt/options are incomplete.",
            14: "Question block is fragmented across page boundaries.",
            15: "Integral/probability prompt is too corrupted for a trustworthy import.",
            16: "Differential-equation block is merged with the next question.",
            17: "Option structure is corrupted by OCR spillover from the previous block.",
            22: "Inverse-trigonometry question options are incomplete.",
            23: "tan-expression question does not retain the correct option set.",
            24: "cosec/matrix question block is merged with the next problem.",
            25: "Matrix prompt and options are interleaved with the next question.",
            26: "Question stem is too degraded to preserve accurately.",
            28: "Matrix-identity expression is too malformed in OCR output.",
            29: "Derivative question has lost its full formula and options.",
            30: "Two questions are merged into a single OCR block.",
            31: "Prompt is unrecoverable from the available OCR text.",
            32: "Trigonometric-derivative block is incomplete.",
            33: "Formula-heavy question does not preserve its full notation.",
            34: "Natural-number equation prompt is too fragmented to import safely.",
            40: "Question content is almost entirely lost; only residual option fragments remain.",
            41: "Coin-toss question is merged with the following parametric-differentiation problem.",
            42: "Parametric-differentiation block is formula-heavy and OCR corruption is too high.",
        },
    },
    cfg_key("Mathematics", "PAPER 2"): {
        "minQuestions": 10,
        "minCoverage": 0.5,
        "patches": {
            6: {
                "prompt": "In linear programming, the optimal value of the objective function is attained at the:",
                "options": [
                    "points of the feasible region",
                    "intersection of the inequalities with the y-axis only",
                    "intersection of the inequalities with the x-axis only",
                    "None of these",
                ],
                "correctIndex": 0,
            },
            7: {"correctIndex": 1},
            8: {"correctIndex": 1},
            9: {
                "prompt": "Objective function of an LPP is:",
                "options": [
                    "A constraint",
                    "A function to be optimized",
                    "The relation between the variables",
                    "None of these",
                ],
                "correctIndex": 1,
            },
            12: {"correctIndex": 3},
            13: {"correctIndex": 2},
            16: {
                "prompt": "The shortest distances of the point (1, 2, 3) from x-, y- and z-axes respectively are:",
                "options": ["sqrt(13), sqrt(10), sqrt(5)", "sqrt(10), sqrt(13), sqrt(5)", "sqrt(5), sqrt(10), sqrt(13)", "1, 2, 3"],
                "correctIndex": 0,
            },
            19: {
                "prompt": "R = {(x, y) : x + y < 4} is a relation on Z. The domain of R is:",
                "options": ["{0, 1, 2}", "{-2, -1, 0, 1, 2}", "{0, -1, -2}", "{-1, 0, 1}"],
                "correctIndex": 1,
            },
            20: {
                "prompt": "A relation R on A = {1, 2, 3} is defined as {(1,1), (1,2), (2,2), (3,3)}. Which ordered pair must be removed to make it symmetric?",
                "options": ["(1,1)", "(1,2)", "(2,2)", "(3,3)"],
                "correctIndex": 1,
            },
            21: {
                "prompt": "Let R be the relation in N given by R = {(a, b) : a - b = -2, b != 6}. Then:",
                "options": ["(2,4) in R", "(3,8) in R", "(6,8) in R", "(8,7) in R"],
                "correctIndex": 2,
            },
            25: {
                "prompt": "If a matrix A is both symmetric and skew-symmetric, then A is necessarily a:",
                "options": ["diagonal matrix", "zero square matrix", "square matrix", "identity matrix"],
                "correctIndex": 1,
            },
            38: {
                "prompt": "If A is a matrix, then A + A' is:",
                "options": ["Symmetric matrix", "Skew symmetric matrix", "Singular matrix"],
                "correctIndex": 0,
            },
        },
        "skips": {
            1: "Degree/order question is too degraded to preserve safely.",
            2: "Integral block is merged with the next differential-equation prompt.",
            3: "Integral-expression options are badly corrupted.",
            4: "tan-integral prompt retains only fragments.",
            5: "Degree question is too incomplete.",
            10: "Question block is malformed around differential-degree notation.",
            11: "Integral and exponential expression are too corrupted.",
            14: "Box-and-ball probability options are incomplete.",
            15: "Conditional-probability notation is too damaged.",
            17: "Several trigonometric questions are merged into one block.",
            18: "Envelope probability statement is incomplete.",
            22: "Divisibility/probability question is merged with a derivative block.",
            23: "Matrix reconstruction question is too corrupted.",
            24: "Matrix/value options are badly fragmented.",
            26: "Merged calculus block does not preserve a trustworthy option set.",
            27: "Parametric-derivative question is incomplete.",
            28: "Matrix-type question is too fragmented.",
            29: "Singular-matrix prompt is malformed.",
            30: "Matrix and differential-equation block is merged.",
            31: "Differential-equation solution options are incomplete.",
            32: "Local-extrema statement set is too damaged.",
            33: "Plane equation prompt is readable but option notation is not reliable enough.",
            34: "Matrix identity prompt is incomplete.",
            35: "Plane-through-points question is too corrupted.",
            36: "Shortest-distance question is merged with the next statement block.",
            37: "Assertion-reason matrix block is not trustworthy after OCR.",
        },
    },
    cfg_key("Mathematics", "PAPER 3"): {
        "minQuestions": 9,
        "minCoverage": 0.5,
        "patches": {
            10: {"correctIndex": 3},
            11: {"correctIndex": 0},
            12: {"correctIndex": 3},
            13: {"correctIndex": 0},
            15: {"correctIndex": 0},
            18: {"correctIndex": 2},
            19: {"correctIndex": 0},
            22: {
                "prompt": "In linear programming, the optimal value of the objective function is attained at the:",
                "options": [
                    "corner points of the feasible region",
                    "intersection of the inequalities with the y-axis only",
                    "intersection of the inequalities with the axes only",
                    "None of these",
                ],
                "correctIndex": 0,
            },
            29: {"correctIndex": 1},
            30: {"correctIndex": 1},
            31: {"correctIndex": 0},
            32: {"correctIndex": 0},
            33: {"correctIndex": 2},
            34: {"correctIndex": 2},
            38: {"correctIndex": 3},
            39: {"correctIndex": 0},
            41: {"correctIndex": 0},
            44: {"correctIndex": 3},
        },
        "skips": {
            1: "Differential-equation order/degree block is too fragmented.",
            2: "Integration-factor question is too degraded to preserve safely.",
            3: "General-solution block is missing crucial notation.",
            4: "Degree question options are not trustworthy after OCR.",
            5: "Integral result is too corrupted.",
            6: "Integral result is too corrupted.",
            7: "Merged calculus/derivative block; options are not trustworthy.",
            8: "Only fragments remain.",
            9: "Multiple questions are collapsed into one OCR block.",
            11: "Angle-between-vectors options are too damaged.",
            12: "Unit-vector angle block is incomplete.",
            13: "Plane-distance options are likely missing a fraction form.",
            14: "Plane-centroid question is incomplete.",
            15: "Plane intercept equation is too degraded.",
            16: "Optimal-solution statement is merged with a derivative block.",
            17: "Only derivative fragments remain.",
            20: "Dice-colour probability wording is incomplete.",
            21: "Function minimum-value block is too malformed.",
            23: "Simple bag-probability question is too incomplete to trust.",
            24: "Two-bag probability question is incomplete.",
            25: "Independence statement options are corrupted.",
            26: "Trigonometric equation options are too degraded.",
            27: "Trigonometric equation options are too degraded.",
            28: "Only a fragment of the expression survives.",
            35: "Statement/answer layout is truncated after OCR.",
            36: "Statement/answer layout is truncated after OCR.",
            40: "Matrix value reconstruction is still too ambiguous after OCR.",
            43: "Differentiation block remains too corrupted to preserve safely.",
            45: "Trailing calculus block is too fragmented after OCR spillover.",
        },
    },
    cfg_key("Mathematics", "PAPER 8"): {
        "patches": {
            6: {"correctIndex": 0},
            8: {"correctIndex": 0},
            10: {
                "prompt": "The interval in which the function f(x) = x^2 - 4x + 6 is strictly increasing is:",
                "options": ["(-infinity, 2)", "(-infinity, -2)", "(2, infinity)", "(-2, 0)"],
                "correctIndex": 2,
            },
            16: {
                "prompt": "Write the derivative of sin x with respect to cos x.",
                "options": ["-cot x", "cot x", "tan x", "-tan x"],
                "correctIndex": 0,
            },
            17: {"correctIndex": 1},
            18: {"correctIndex": 2},
            19: {"correctIndex": 2},
            20: {
                "prompt": "Feasible region is the set of points which satisfy:",
                "options": [
                    "The objective function",
                    "Some of the given constraints",
                    "All of the given constraints",
                    "None of these",
                ],
                "correctIndex": 2,
            },
            22: {
                "prompt": "What is the principal value of sin^-1(sqrt(3)/2)?",
                "options": ["pi/2", "pi/3", "2pi/3", "None of these"],
                "correctIndex": 1,
            },
            23: {"correctIndex": 0},
            30: {"correctIndex": 2},
            33: {"correctIndex": 1},
            34: {"correctIndex": 1},
            35: {"correctIndex": 1},
            38: {"correctIndex": 0},
            39: {"correctIndex": 2},
            41: {
                "prompt": "The equation of the normal to the curve y = sin x at (0, 0) is:",
                "options": ["x + y = 0", "x = 0", "y = 0", "x - y = 0"],
                "correctIndex": 0,
            },
            43: {"correctIndex": 2},
            44: {
                "options": ["144pi cu m/s", "80pi cu m/s", "64pi cu m/s", "None of these"],
                "correctIndex": 1,
            },
            45: {
                "prompt": "The direction ratios of the normal to the plane 7x + 4y - 2z + 5 = 0 are:",
                "options": ["7, 4, -2", "7, 4, 2", "4, -2, 5", "7, 4, 5"],
                "correctIndex": 0,
            },
        },
        "skips": {
            1: "Differential-equation block is too fragmented across OCR lines.",
            2: "Question stem is lost and only formula fragments remain.",
            3: "Particular-solution options are corrupted beyond safe recovery.",
            4: "Differential-equation solution block is badly merged with surrounding text.",
            5: "Integration-factor/vector-angle question block is merged and not trustworthy.",
            7: "Conditional-dice prompt is incomplete and option set is corrupted.",
            9: "Probability statement is incomplete after OCR.",
            11: "Only numeric fragments remain; question prompt is unrecoverable.",
            12: "Ball-probability options are truncated and cannot be reconstructed safely.",
            13: "Integral/log-expression block is too corrupted.",
            14: "Inverse-trigonometry question loses its full statement and options.",
            15: "Formula-heavy trigonometric block is incomplete.",
            21: "Trigonometric equation retains only partial formula text.",
            24: "Matrix-value question is incomplete after OCR.",
            25: "2x2-matrix value block is merged with the next question.",
            26: "Only orphaned formula fragments remain.",
            27: "Matrix-order question is merged with algebraic spillover.",
            28: "Matrix-equality prompt is too corrupted for a reliable import.",
            29: "Question text is largely missing; only residual options survive.",
            31: "Triangle-area question is merged with the next tangent-slope question.",
            32: "Tangent-slope block is incomplete.",
            36: "Relation/problem block is merged with the next differential question.",
            37: "Question survives only as formula fragments and duplicated options.",
            40: "Coin-toss threshold question is incomplete and answer options are not reliable.",
            42: "Exact-six-heads probability options are corrupted by OCR and missing the correct fraction form.",
        },
    },
    cfg_key("Mathematics", "PAPER 4"): {
        "minQuestions": 14,
        "patches": {
            1: {"correctIndex": 2},
            2: {
                "prompt": "The equation of the curve whose slope is given by dy/dx = y/x, for x > 0, y > 0, and which passes through (1,1), is:",
                "correctIndex": 0,
            },
            4: {"correctIndex": 1},
            8: {"correctIndex": 0},
            15: {"correctIndex": 0},
            19: {"correctIndex": 3},
            20: {"correctIndex": 1},
            23: {"correctIndex": 3},
            24: {"correctIndex": 2},
            25: {"correctIndex": 0},
            29: {"correctIndex": 3},
            30: {"correctIndex": 0},
            31: {"correctIndex": 0},
            43: {"correctIndex": 1},
        },
        "skips": {
            3: "Differential-equation options are truncated and duplicated.",
            5: "Integrating-factor options are too corrupted to preserve accurately.",
            6: "Integral-expression prompt is heavily damaged by OCR.",
            7: "Integral result options do not survive cleanly.",
            9: "Integral statement is incomplete around parameter a.",
            10: "Integral prompt is too degraded for a trustworthy import.",
            11: "Only fragments of the integral and option set remain.",
            12: "Option values are badly corrupted and not reliable.",
            13: "Cosine-of-angle question preserves answer fragments but not a trustworthy option set.",
            14: "Option typography is too corrupted around the vector-magnitude answer.",
            16: "Probability identity question loses key notation in OCR.",
            17: "Independence identity options are corrupted.",
            18: "Replacement-card probability options are incomplete.",
            21: "Conditional-probability identity options are not trustworthy.",
            22: "Question block is merged with a later linear-programming prompt.",
            26: "Inverse-trigonometric expression is too malformed in OCR output.",
            27: "Trigonometric equation retains only fragments of the options.",
            28: "Solution set of the trigonometric equation is incomplete.",
            32: "Matrix-expression options are badly degraded.",
            33: "Assertion-reason determinant statement is not clean enough to keep.",
            34: "Matrix-adjoint assertion block is too corrupted.",
            35: "Determinant question is merged with the next matrix problem.",
            36: "Matrix arithmetic options are incomplete.",
            37: "Matrix equation retains only fragments of the non-zero parameter choices.",
            38: "Matrix-solution question is too degraded.",
            39: "Computation block is incomplete.",
            40: "Matrix-combination prompt is missing too much structure.",
            41: "Probability-distribution question is merged with the next function block.",
            42: "Continuity parameter question options are not preserved cleanly.",
            44: "Derivative expression is missing crucial notation.",
            45: "Inverse-trigonometric derivative question is too corrupted.",
            46: "Trig-derivative expression is incomplete after OCR.",
            47: "Direction-angle statements are fragmented and ambiguous.",
            48: "Direction-angle consequence question is incomplete.",
            49: "Option set is corrupted even though the identity is recognizable.",
        },
    },
    cfg_key("Mathematics", "PAPER 1"): {
        "minQuestions": 10,
        "minCoverage": 0.2,
        "patches": {
            2: {
                "prompt": "If |a| = 3 and |b| = 4, then the value of λ for which a + λb is perpendicular to a - λb is:",
                "options": ["3/4", "4/3", "3", "4"],
                "correctIndex": 0,
            },
            10: {
                "prompt": "The equation of the normal to the curve y = sin x at (0,0) is:",
                "options": ["x = 0", "x + y = 0", "x - y = 0", "y = 0"],
                "correctIndex": 1,
            },
            29: {
                "prompt": "S is a relation over the set R of all real numbers and it is given by aSb iff ab > 0. Then S is:",
                "options": [
                    "Symmetric and transitive only",
                    "Reflexive and transitive only",
                    "An antisymmetric relation",
                    "An equivalence relation",
                ],
                "correctIndex": 0,
            },
            31: {
                "prompt": "What is the smallest equivalence relation on the set A = {1,2,3}?",
                "options": [
                    "{(1,1), (2,2), (3,3)}",
                    "{(1,1), (2,3), (3,3)}",
                    "{(1,2), (2,2), (2,3)}",
                    "None of these",
                ],
                "correctIndex": 0,
            },
            32: {
                "prompt": "The function f(x) = [ln(1+ax) - ln(1-bx)] / x is not defined at x = 0. The value to be assigned to f at x = 0 so that it is continuous is:",
                "options": ["a + b", "a - b", "b - a", "ln a + ln b"],
                "correctIndex": 0,
            },
            33: {
                "prompt": "If x sin(a + y) = sin y, then dy/dx is equal to:",
                "options": [
                    "sin a / sin^2(a + y)",
                    "1 / sin^2(a + y)",
                    "sin^2(a + y) / sin a",
                    "sin a / sin(a + y)",
                ],
                "correctIndex": 2,
            },
            35: {
                "prompt": "The probability distribution of the number of doublets in three throws of a pair of dice is:",
                "options": [
                    "P(X=0,1,2,3) = 125/216, 75/216, 15/216, 1/216",
                    "P(X=0,1,2,3) = 75/216, 125/216, 1/216, 15/216",
                    "P(X=0,1,2,3) = 1/216, 75/216, 15/216, 125/216",
                    "P(X=0,1,2,3) = 15/216, 125/216, 75/216, 1/216",
                ],
                "correctIndex": 0,
            },
            38: {
                "prompt": "Find the equation of the plane through the intersection of the planes 3x - 4y + 5z = 10 and x + 2y - 3z = 4 and parallel to the line x = 2y = 3z.",
                "options": ["x - 20y + 27z = 14", "x - 20y + 26z = 14", "x - 10y + 27z = 13", "None of these"],
                "correctIndex": 0,
            },
            39: {
                "prompt": "The magnitude of the vector 6i + 2j + 3k is equal to:",
                "options": ["7", "5", "12", "49"],
                "correctIndex": 0,
            },
            40: {
                "prompt": "If |a x b| = 4 and |a . b| = 2, then |a|^2 |b|^2 is equal to:",
                "options": ["20", "2", "12", "16"],
                "correctIndex": 0,
            },
        },
        "skips": {
            1: "Vector-midpoint block is too degraded.",
            3: "Merged linear-programming block is not trustworthy.",
            4: "Maximization question is merged with other OCR spillover.",
            5: "Only fragments remain.",
            6: "Differential-equation solution block is too corrupted.",
            7: "Reduction-to-linear-form question is too incomplete.",
            8: "Trigonometric expression block is fragmented.",
            9: "Substitution/calculus block is too degraded.",
            11: "Probability notation is incomplete.",
            12: "Probability notation is incomplete.",
            13: "Odd/even conditional-probability block is incomplete.",
            14: "Monotonicity statement is too truncated.",
            15: "Conditional dice-probability options are not trustworthy.",
            16: "Card-draw probability block is merged with the next question.",
            17: "Only formula fragments remain.",
            18: "Inverse-trigonometric value block is too degraded.",
            19: "Inverse-trigonometric value block is too degraded.",
            20: "Matrix-order prompt is incomplete.",
            21: "Only a numeric fragment survives.",
            22: "Number-of-matrices question is too incomplete.",
            23: "Matrix-polynomial expression is polluted by the next question.",
            24: "Matrix-type question is too corrupted.",
            25: "Determinant-evaluation block is incomplete.",
            26: "Logarithmic derivative fragment only.",
            27: "System-consistency block is too truncated.",
            28: "Trigonometric maximization block is incomplete.",
            30: "Number-of-relations prompt is incomplete.",
            34: "Match-the-following block is not clean enough for safe import.",
            36: "Trailing differential-equation fragment is incomplete.",
            37: "Derivative block is too corrupted.",
            41: "Rate-of-area question is polluted by a probability identity block.",
            42: "Probability identity block is incomplete after OCR spillover.",
        },
    },
    cfg_key("Mathematics", "PAPER 6"): {
        "minQuestions": 10,
        "minCoverage": 0.2,
        "patches": {
            15: {
                "prompt": "A die is thrown and a card is selected at random from a deck of 52 playing cards. The probability of getting an even number on the die and a spade card is:",
                "options": ["1/13", "1/8", "1/4", "3/8"],
                "correctIndex": 1,
            },
            17: {
                "prompt": "The inequalities 3x - y > 3 and 4x + 4y > 4:",
                "options": [
                    "Have solution for positive x and y",
                    "Have no solution for positive x and y",
                    "Have all solutions for all x",
                    "Have all solutions for all y",
                ],
                "correctIndex": 0,
            },
            18: {
                "prompt": "The maximum value of Z = 3x + 4y subject to constraints x + y <= 40, x + 2y <= 60, x >= 0 and y >= 0 is:",
                "options": ["120", "140", "100", "160"],
                "correctIndex": 1,
            },
            26: {
                "prompt": "The line y = x + 1 is a tangent to the curve y^2 = 4x at the point:",
                "options": ["(1,2)", "(2,1)", "(-1,2)", "(1,-2)"],
                "correctIndex": 0,
            },
            32: {
                "prompt": "Let R be a relation on N given by R = {(a,b) : a = b - 2, b != 6}. Then:",
                "options": ["(2,4) ∈ R", "(3,8) ∈ R", "(6,8) ∈ R", "(8,7) ∈ R"],
                "correctIndex": 2,
            },
            33: {
                "prompt": "Which of the following is not an equivalence relation on Z?",
                "options": ["aRb iff a < b", "aRb iff a + b is an even integer", "aRb iff a - b is an even integer", "aRb iff a = b"],
                "correctIndex": 0,
            },
            34: {
                "prompt": "R is a relation on the set Z of integers given by (x,y) ∈ R iff |x - y| < 1. Then R is:",
                "options": ["Reflexive and transitive", "Reflexive and symmetric", "Symmetric and transitive", "An equivalence relation"],
                "correctIndex": 1,
            },
            38: {
                "prompt": "The interval over which the function f(x) = 6x - x^2, x > 0, is increasing is:",
                "options": ["(0,3)", "(3,6)", "(6,9)", "None of these"],
                "correctIndex": 0,
            },
            40: {
                "prompt": "The equation of the plane through the intersection of the planes x + 2y + 3z = 4 and 2x + y - z = -5 and perpendicular to the plane 5x + 3y + 6z + 8 = 0 is:",
                "options": ["7x - 2y + 3z + 81 = 0", "23x + 14y - 9z + 48 = 0", "51x + 15y - 50z + 173 = 0", "None of these"],
                "correctIndex": 2,
            },
            42: {
                "prompt": "The distance of the point (a, b, c) from the x-axis is:",
                "options": ["sqrt(a^2 + c^2)", "sqrt(a^2 + b^2)", "sqrt(b^2 + c^2)", "None of these"],
                "correctIndex": 2,
            },
        },
        "skips": {
            1: "Early differential-equation block is too degraded.",
            2: "Question text is too incomplete.",
            3: "Question text is too incomplete.",
            4: "Question text is too incomplete.",
            5: "Question text is too incomplete.",
            6: "Question text is too incomplete.",
            7: "Question text is too incomplete.",
            8: "Question text is too incomplete.",
            9: "Question text is too incomplete.",
            10: "Geometry area block is too incomplete.",
            11: "Geometry area block is too incomplete.",
            12: "Vector condition block is too incomplete.",
            13: "Vector condition block is too incomplete.",
            14: "Card-and-die probability block is polluted by OCR spillover.",
            16: "LPP maximum-value statement is too ambiguous after OCR.",
            19: "Secondary optimization block is too noisy.",
            20: "Trigonometric evaluation block is incomplete.",
            21: "Trigonometric evaluation block is incomplete.",
            22: "Merged matrix equation block is too fragmented.",
            23: "Matrix-value block is too fragmented.",
            24: "Matrix classification block is not trustworthy enough.",
            25: "Matrix-parameter block is incomplete.",
            27: "Matrix-value block is too fragmented.",
            28: "Singular-matrix block is too fragmented.",
            29: "Determinant block is too fragmented.",
            30: "Linear-system block is too fragmented.",
            31: "Determinant block is too fragmented.",
            35: "Derivative-at-a-point block is too incomplete.",
            36: "Only formula fragments survive.",
            37: "Implicit-differentiation block is too merged to trust.",
            39: "Discrete-distribution parameter block is too incomplete.",
            41: "Orthogonality/axis relation block is too incomplete.",
            43: "Section-point question is too incomplete to trust.",
        },
    },
    cfg_key("Mathematics", "PAPER 7"): {
        "minQuestions": 10,
        "minCoverage": 0.2,
        "patches": {
            15: {
                "prompt": "Of all the points in the feasible region of a linear programming problem, the maximum and minimum values of the objective function occur at the:",
                "options": [
                    "Interior points of the feasible region",
                    "Vertex points of the boundary of the feasible region",
                    "Any point on the boundary line",
                    "None of these",
                ],
                "correctIndex": 1,
            },
            16: {
                "prompt": "The objective function of a linear programming problem is:",
                "options": ["A constraint", "Function to be optimized", "Relation between the variables", "None of these"],
                "correctIndex": 1,
            },
            17: {
                "prompt": "A set of values of decision variables which satisfies the linear constraints and non-negativity conditions of an LPP is called its:",
                "options": ["Unbounded solution", "Optimum solution", "Feasible solution", "None of these"],
                "correctIndex": 2,
            },
            26: {
                "prompt": "If a matrix has 5 elements, then all possible orders it can have are:",
                "options": ["1x5, 5x1", "4x5, 5x4", "1x4, 4x1", "3x5, 5x3"],
                "correctIndex": 0,
            },
            31: {
                "prompt": "Let R be the relation over the set of all straight lines in a plane such that l1 R l2 if l1 is perpendicular to l2. Then R is:",
                "options": ["Symmetric", "Reflexive", "Transitive", "An equivalence relation"],
                "correctIndex": 0,
            },
            32: {
                "prompt": "The relation R on N x N defined by (a,b) R (c,d) iff a + d = b + c is:",
                "options": [
                    "Reflexive but not symmetric",
                    "Reflexive and transitive but not symmetric",
                    "An equivalence relation",
                    "None of these",
                ],
                "correctIndex": 2,
            },
            33: {
                "prompt": "If A = {1,2,3}, B = {1,4,6,9} and R is a relation from A to B defined by xRy iff x > y, then the range of R is:",
                "options": ["{1,4,6,9}", "{4,6,9}", "{1}", "None of these"],
                "correctIndex": 2,
            },
            38: {
                "prompt": "Given f(x) = x^4, which of the following is true?",
                "options": ["f(3) = -f(-3)", "f(5) = f(-4)", "f(3) = f(-3)", "None of these"],
                "correctIndex": 2,
            },
            40: {
                "prompt": "A coin is tossed four times. The probability that at least one head turns up is:",
                "options": ["1/16", "2/16", "14/16", "15/16"],
                "correctIndex": 3,
            },
            41: {
                "prompt": "The differential coefficient of sec(tan^-1 x) is:",
                "options": ["sqrt(1 + x^2)", "x", "1/sqrt(1 + x^2)", "x/sqrt(1 + x^2)"],
                "correctIndex": 3,
            },
        },
        "skips": {
            1: "Early calculus block is too degraded.",
            2: "Parabola-area block is incomplete.",
            3: "Merged parabola/latus-rectum block is too noisy.",
            4: "Differential-equation OCR output is not trustworthy.",
            5: "Only formula fragments remain.",
            6: "Question text is too incomplete.",
            7: "Question text is too incomplete.",
            8: "Question text is too incomplete.",
            9: "Merged differential-equation block is corrupted.",
            10: "Only numeric fragments survive.",
            11: "Only formula fragments survive.",
            12: "Only formula fragments survive.",
            13: "Question text is too incomplete.",
            14: "Question text is too incomplete.",
            18: "Inverse-trigonometric value block is incomplete.",
            19: "Inverse-trigonometric value block is incomplete.",
            20: "Merged matrix block is too noisy.",
            21: "Matrix-value block is incomplete.",
            22: "Matrix-product block is incomplete.",
            23: "Matrix-equation block is incomplete.",
            24: "Matrix-expression block is incomplete.",
            25: "Determinant/value block is incomplete.",
            27: "Trigonometric evaluation block is incomplete.",
            28: "Trigonometric evaluation block is incomplete.",
            29: "Determinant-evaluation block is incomplete.",
            30: "Answer mapping is too weak for a safe import.",
            34: "Derivative block is too fragmented.",
            35: "Function-monotonicity prompt is too ambiguous against the answer page.",
            36: "Vector-relation block is too fragmented.",
            37: "Triple-product block is too incomplete.",
            39: "Derivative-of-composition block is too ambiguous to preserve safely.",
        },
    },
    cfg_key("Mathematics", "PAPER 5"): {
        "minQuestions": 10,
        "minCoverage": 0.2,
        "patches": {
            13: {
                "prompt": "If m is the degree and n is the order of the given differential equation, then:",
                "options": ["m - n = 2", "m + n = 5", "m = 4, n = 3", "Order is 3 but degree is not defined"],
                "correctIndex": 1,
            },
            14: {
                "prompt": "The differential equation representing the family of curves y = m(x - d), where m and d are arbitrary constants, is:",
                "options": ["dy/dx = 0", "d^2y/dx^2 = 0", "y = 0", "x d^2y/dx^2 + y = 0"],
                "correctIndex": 1,
            },
            15: {
                "prompt": "The side of an equilateral triangle is increasing at the rate of 2 cm/s. The rate at which its area increases when the side is 10 cm is:",
                "options": ["10 cm^2/s", "sqrt(3) cm^2/s", "10/sqrt(3) cm^2/s", "10sqrt(3) cm^2/s"],
                "correctIndex": 3,
            },
            16: {
                "prompt": "The absolute maximum value of y = x^2 - 3x + 2 on 0 <= x <= 2 is:",
                "options": ["2", "5", "6", "0"],
                "correctIndex": 0,
            },
            23: {
                "prompt": "The maximum area of a rectangle inscribed in a circle of radius r is:",
                "options": ["4r^2", "3r^2", "2r^2", "r^2"],
                "correctIndex": 2,
            },
            37: {
                "prompt": "Let R be the equivalence relation on the set Z of integers given by aRb iff 2 divides (a - b). Then the equivalence class [0] is:",
                "options": [
                    "{0, ±2, ±4, ±6, ...}",
                    "{1, ±2, ±4, ±6, ...}",
                    "{0, ±1, ±3, ±5, ...}",
                    "None of these",
                ],
                "correctIndex": 0,
            },
            40: {
                "prompt": "The angle between the lines 2x = 3y = -z and 6x = -y = -4z is:",
                "options": ["30°", "45°", "90°", "60°"],
                "correctIndex": 2,
            },
            42: {
                "prompt": "The equation of the plane passing through three non-collinear points with position vectors a, b and c is:",
                "options": [
                    "r·(b × c + c × a + a × b) = 0",
                    "r·(b × c + c × a + a × b) = [abc]",
                    "r·(a × (b + c)) = [abc]",
                    "r·(a + b + c) = 0",
                ],
                "correctIndex": 1,
            },
            43: {
                "prompt": "A plane meets the coordinate axes at A, B, C such that the centroid of triangle ABC is the point (a, b, c). If the equation of the plane is x/a + y/b + z/c = k, then k =",
                "options": ["2", "1", "3", "None of these"],
                "correctIndex": 2,
            },
            44: {
                "prompt": "The distance between the planes 2x + 2y - z + 2 = 0 and 4x + 4y - 2z + 5 = 0 is:",
                "options": ["1/6", "1", "6", "None of these"],
                "correctIndex": 0,
            },
        },
        "skips": {
            1: "Early logarithmic block is too degraded.",
            2: "Merged optimization block is not trustworthy.",
            3: "Merged optimization block is not trustworthy.",
            4: "Trigonometric-expression OCR is too noisy.",
            5: "Trigonometric-expression OCR is too noisy.",
            6: "Differential-equation block is incomplete.",
            7: "Differential-equation reduction block is incomplete.",
            8: "Front calculus block is too fragmented.",
            9: "Question text is incomplete.",
            10: "Question text is incomplete.",
            11: "Question text is incomplete.",
            12: "Question text is incomplete.",
            17: "Integral block is too degraded.",
            18: "Probability block is incomplete.",
            19: "Probability block is incomplete.",
            20: "Only numeric fragments survive.",
            21: "Question is polluted by page chrome and OCR spillover.",
            22: "Question text is incomplete.",
            24: "Statement block is incomplete.",
            25: "Statement block is incomplete.",
            26: "Matrix-expression block is too fragmented.",
            27: "Matrix-expression block is too fragmented.",
            28: "Assertion-reason block is incomplete.",
            29: "Assertion-reason block is incomplete.",
            30: "Numeric/matrix block is too fragmented.",
            31: "Numeric/matrix block is too fragmented.",
            32: "Numeric/matrix block is too fragmented.",
            33: "Only fragmentary coordinates remain.",
            34: "Only fragmentary coordinates remain.",
            35: "Matrix-value question is too degraded.",
            36: "Determinant-evaluation block is too degraded.",
            38: "Continuity/differentiation block is too polluted by OCR spillover.",
            39: "Differentiation block is too ambiguous to preserve safely.",
            41: "Point-to-plane distance prompt is inconsistent with OCR text.",
        },
    },
    cfg_key("Mathematics", "PAPER 9"): {
        "minQuestions": 10,
        "minCoverage": 0.2,
        "patches": {
            14: {
                "prompt": "A set of values of decision variables that satisfies all linear constraints and non-negativity conditions of an LPP is called its:",
                "options": ["Unbounded solution", "Feasible solution", "Optimum solution", "None of these"],
                "correctIndex": 1,
            },
            15: {
                "prompt": "The linear inequalities or equations or restrictions on the variables of a linear programming problem are called:",
                "options": ["Constraints", "Decision variables", "Objective function", "None of the above"],
                "correctIndex": 0,
            },
            17: {
                "prompt": "Which of the following is a type of linear programming problem?",
                "options": ["Manufacturing problem", "Diet problem", "Transportation problem", "All of the above"],
                "correctIndex": 3,
            },
            26: {
                "prompt": "The relation R = {(1,1), (2,2), (3,3)} on the set {1,2,3} is:",
                "options": ["Symmetric only", "An equivalence relation", "Transitive only", "Reflexive only"],
                "correctIndex": 1,
            },
            27: {
                "prompt": "Consider a non-empty set consisting of children in a family and a relation R defined as aRb if a is brother of b. Then R is:",
                "options": [
                    "Symmetric but not transitive",
                    "Transitive but not symmetric",
                    "Neither symmetric nor transitive",
                    "Both symmetric and transitive",
                ],
                "correctIndex": 1,
            },
            29: {
                "prompt": "If l, m, n are the direction cosines of a line, then:",
                "options": [
                    "l^2 + m^2 + n^2 = 1",
                    "2l^2 + m^2 + n^2 = 1",
                    "l^2 + n^2 = 1",
                    "2m^2 + l^2 + n^2 = 1",
                ],
                "correctIndex": 0,
            },
            30: {
                "prompt": "Direction ratios of the line joining (2, 3, 4) and (-1, -2, 1) are:",
                "options": ["-3, -5, -3", "-3, 1, -3", "-1, -5, -3", "-3, -5, 5"],
                "correctIndex": 0,
            },
            31: {
                "prompt": "If a line has direction ratios 2, -1, -2, then its direction cosines are:",
                "options": ["2/3, -1/3, -2/3", "2/3, 1/3, -2/3", "2/3, -2/3, -1/3", "None of the above"],
                "correctIndex": 0,
            },
            32: {
                "prompt": "The equation of the normal to the curve y^2 = 8x which is parallel to the line x + 3y = 8 is:",
                "options": ["3x - y = 8", "3x + y + 8 = 0", "x + 3y + 8 = 0", "x + 3y = 0"],
                "correctIndex": 2,
            },
            34: {
                "prompt": "The least number of times a fair coin must be tossed so that the probability of getting at least one head is at least 0.8 is:",
                "options": ["3", "4", "5", "6"],
                "correctIndex": 0,
            },
        },
        "skips": {
            1: "Differential-equation integrating-factor block is too degraded.",
            2: "Differential-equation solution block is too corrupted.",
            3: "Merged calculus block is not trustworthy after OCR.",
            4: "Vector-product question is too incomplete.",
            5: "Collinear-vector statement is fragmented.",
            6: "Rhombus-diagonal vector sum block is too degraded.",
            7: "Battery probability options are malformed.",
            8: "Set-probability expression is incomplete.",
            9: "Bag-probability question is merged with the next block.",
            10: "Curve-rate question is merged with a probability block.",
            11: "Integral block is incomplete.",
            12: "Fragment-only calculus block.",
            13: "Integral-result question is too degraded.",
            16: "LPP minimum-value options are not trustworthy.",
            18: "Principal-value trigonometric block is incomplete.",
            19: "Multiple matrix questions are collapsed into one OCR block.",
            20: "Matrix-expression block is too fragmented.",
            21: "Merged trigonometric and matrix block is not trustworthy.",
            22: "Matrix-operation block is too fragmented.",
            23: "Mixed derivative block is incomplete.",
            24: "Determinant question is too malformed after OCR.",
            25: "Linear-equation determinant block is not trustworthy enough.",
            28: "Maximum-number question is incomplete and answer page is missing.",
            33: "Resolved option set is too polluted by the next question.",
            35: "Coin-toss question is polluted by the following function block.",
            36: "Trailing trigonometric/root-location block is too fragmented.",
        },
    },
}


def build_file_index():
    index = {}
    for pdf in ROOT.rglob("*.pdf"):
        subject = pdf.parent.name
        paper = pdf.stem
        index[f"{normalize_key(subject)}__{normalize_key(paper)}"] = pdf
    return index


def clean_line(line: str) -> str:
    line = line.replace("\x00", " ")
    line = line.replace("", "→").replace("", "Δ").replace("", "-").replace("·", " ")
    line = line.replace("–", "-").replace("—", "-").replace("“", '"').replace("”", '"').replace("’", "'")
    return re.sub(r"\s+", " ", line).strip()


def should_drop_line(line: str, subject_name: str) -> bool:
    if not line:
        return True
    line_lower = line.lower()
    subject_lower = subject_name.lower()
    patterns = [
        r"^page \d+ of \d+$",
        r"^\d+ of \d+$",
        r"^correct\s*:?\s*\+\d+",
        r"^incorrect\s*:?\s*-\s*\d+",
        r"^test$",
        r"^questions$",
        r"^answers$",
        r"^solutions$",
        r"^mcq$",
        r"^sections$",
        r"^section \d+\s*:",
        r"^\d+\.\s*mcq\s*-\s*\d+\s*questions$",
        r"^.*paper\s*\d*.*mcq.*questions$",
        r"^.*paper\s*\d*.*mcq.*solutions$",
    ]
    for pattern in patterns:
        if re.match(pattern, line_lower):
            return True
    if subject_lower in line_lower and "paper" in line_lower:
        return True
    if line in {"O", "0", "○"}:
        return True
    return False


def extract_expected_count(text: str):
    match = re.search(r"mcq\s*-\s*(\d+)\s*questions", text, flags=re.I)
    return int(match.group(1)) if match else None


def split_sections(text: str):
    raw_lines = [clean_line(x) for x in text.splitlines()]
    question_lines = []
    answer_lines = []
    solution_lines = []
    mode = "questions"

    def is_answer_header(line: str) -> bool:
        lowered = line.lower()
        return lowered == "answers" or ("mcq" in lowered and "answers" in lowered)

    def is_solution_header(line: str) -> bool:
        lowered = line.lower()
        return lowered == "solutions" or ("mcq" in lowered and "solutions" in lowered)

    for line in raw_lines:
        if is_answer_header(line):
            mode = "answers"
            continue
        if is_solution_header(line):
            mode = "solutions"
            continue
        if mode == "questions":
            question_lines.append(line)
        elif mode == "answers":
            answer_lines.append(line)
        else:
            solution_lines.append(line)

    return question_lines, answer_lines, solution_lines


def rebuild_section_text(question_lines, answer_lines, solution_lines):
    sections = []
    if question_lines:
        sections.extend(question_lines)
    if answer_lines:
        sections.append("ANSWERS")
        sections.extend(answer_lines)
    if solution_lines:
        sections.append("SOLUTIONS")
        sections.extend(solution_lines)
    return "\n".join(sections)


def sanitize_question_part(text: str, subject_name: str):
    lines, _, _ = split_sections(text)
    return [line for line in lines if not should_drop_line(line, subject_name)]


def sanitize_answer_part(text: str, subject_name: str):
    _, lines, _ = split_sections(text)
    return [line for line in lines if not should_drop_line(line, subject_name)]


def sanitize_solution_part(text: str, subject_name: str):
    _, _, lines = split_sections(text)
    return [line for line in lines if not should_drop_line(line, subject_name)]


def parse_solutions(lines):
    result = {}
    i = 0
    while i < len(lines):
        if re.fullmatch(r"\d+", lines[i]):
            q_no = int(lines[i])
            if i + 1 < len(lines):
                m = re.fullmatch(r"([A-Da-d])", lines[i + 1])
                if m:
                    result[q_no] = m.group(1).upper()
                    i += 2
                    continue
        i += 1
    return result


def parse_text_answers(lines, max_question=None):
    result = {}
    current_no = None
    buffer = []

    def flush():
        nonlocal current_no, buffer
        if current_no is None:
            return
        value = clean_line(" ".join(buffer))
        if value:
            result[current_no] = value
        current_no = None
        buffer = []

    for line in lines:
        if re.fullmatch(r"\d+", line):
            number = int(line)
            looks_like_question_label = (
                (max_question is None or 1 <= number <= max_question)
                and (current_no is None or current_no < number <= current_no + 3)
            )
            if not looks_like_question_label:
                if current_no is not None:
                    buffer.append(line)
                continue
            flush()
            current_no = number
            continue
        match = re.match(r"^(\d+)\s+(.*)$", line)
        if match:
            number = int(match.group(1))
            remainder = match.group(2)
            looks_like_question_label = (
                (max_question is None or 1 <= number <= max_question)
                and (current_no is None or current_no < number <= current_no + 3)
                and not re.match(r"^[./-]?\d", remainder)
                and not re.match(r"^\.\d", line)
                and not re.match(r"^\d+\.\d", line)
                and not re.match(r"^\d+/\d", line)
            )
            if not looks_like_question_label:
                if current_no is not None:
                    buffer.append(line)
                continue
            flush()
            current_no = number
            buffer.append(remainder)
            continue
        if current_no is not None:
            buffer.append(line)
    flush()
    return result


def parse_solution_paragraphs(lines, max_question=None):
    result = {}
    current_no = None
    buffer = []

    def flush():
        nonlocal current_no, buffer
        if current_no is None:
            return
        value = clean_line(" ".join(buffer))
        if value:
            result[current_no] = value
        current_no = None
        buffer = []

    for line in lines:
        number_only = re.fullmatch(r"(\d+)", line)
        number_with_text = re.match(r"^(\d+)\s+(.*)$", line)
        if number_only:
            number = int(number_only.group(1))
            looks_like_question_label = (
                (max_question is None or 1 <= number <= max_question)
                and (current_no is None or current_no < number <= current_no + 3)
            )
            if not looks_like_question_label:
                if current_no is not None:
                    buffer.append(line)
                continue
            flush()
            current_no = number
            continue
        if number_with_text and len(number_with_text.group(2)) > 0:
            number = int(number_with_text.group(1))
            remainder = number_with_text.group(2)
            looks_like_question_label = (
                (max_question is None or 1 <= number <= max_question)
                and (current_no is None or current_no < number <= current_no + 3)
                and not re.match(r"^\.\d", line)
                and not re.match(r"^\d+\.\d", line)
                and not re.match(r"^\d+/\d", line)
            )
            if not looks_like_question_label:
                if current_no is not None:
                    buffer.append(line)
                continue
            flush()
            current_no = number
            buffer.append(remainder)
            continue
        if current_no is not None:
            buffer.append(line)
    flush()
    return result


def normalize_comparable(value: str) -> str:
    value = value.lower()
    value = value.replace("°", " degree ")
    value = value.replace("∆", " delta ").replace("Δ", " delta ")
    value = re.sub(r'["\'`]', "", value)
    value = re.sub(r"[^a-z0-9\u0900-\u097f()+/=.,:%\s-]", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def compact_formula(value: str) -> str:
    value = normalize_comparable(value)
    return re.sub(r"[^a-z0-9\u0900-\u097f]+", "", value)


def comparable_tokens(value: str):
    stopwords = {
        "the",
        "is",
        "are",
        "of",
        "and",
        "or",
        "a",
        "an",
        "to",
        "in",
        "with",
        "for",
        "on",
        "by",
        "be",
        "it",
        "this",
        "that",
        "than",
        "does",
        "not",
        "none",
        "above",
        "option",
        "statement",
        "both",
        "correct",
        "incorrect",
    }
    tokens = [token for token in re.split(r"\s+", normalize_comparable(value)) if token and token not in stopwords]
    return tokens


def match_answer_text_to_option(answer_text, options):
    answer_norm = normalize_comparable(answer_text or "")
    if not answer_norm:
        return -1
    answer_compact = compact_formula(answer_text or "")
    answer_tokens = comparable_tokens(answer_text or "")
    best_idx = -1
    best_score = 0
    for idx, option in enumerate(options):
        option_norm = normalize_comparable(option)
        if not option_norm:
            continue
        if option_norm == answer_norm or option_norm in answer_norm or answer_norm in option_norm:
            return idx
        option_compact = compact_formula(option)
        if option_compact and answer_compact and (
            option_compact in answer_compact or answer_compact in option_compact
        ):
            return idx
        option_tokens = comparable_tokens(option)
        if not option_tokens:
            continue
        overlap = len(set(option_tokens) & set(answer_tokens))
        if overlap <= 0:
            continue
        score = overlap * 10 + sum(len(token) for token in set(option_tokens) & set(answer_tokens))
        if score > best_score:
            best_score = score
            best_idx = idx
    if best_score >= 12:
        return best_idx
    return -1


def normalize_question_remainder(number: int, remainder: str) -> str:
    remainder = (remainder or "").strip()
    if not remainder:
        return ""
    repeated_number = re.match(rf"^{number}\b[\s:.\-]*(.*)$", remainder)
    if repeated_number:
        remainder = repeated_number.group(1).strip()
    return remainder


def parse_question_label(line: str, expected_count=None):
    line = clean_line(line)
    match = re.match(r"^(\d+)(?:\s*(.*))?$", line)
    if not match:
        return None
    raw_number = match.group(1)
    remainder = match.group(2) or ""
    number = int(raw_number)
    if expected_count and number > expected_count and len(raw_number) % 2 == 0:
        half = len(raw_number) // 2
        left = raw_number[:half]
        right = raw_number[half:]
        if left == right:
            candidate = int(left)
            if 1 <= candidate <= expected_count:
                number = candidate
    remainder = normalize_question_remainder(number, remainder)
    return number, remainder


def looks_like_prompt_start(text: str) -> bool:
    text = (text or "").strip()
    if not text:
        return False
    return (
        len(text) >= 18
        or text.lower().startswith("q.")
        or text.endswith("?")
        or text.endswith(":")
    )


def parse_question_blocks(lines, expected_count=None):
    blocks = []
    current = None
    expected_no = 1
    for line in lines:
        parsed_label = parse_question_label(line, expected_count)
        if parsed_label:
            number, remainder = parsed_label
            remainder_looks_prompt = not remainder or looks_like_prompt_start(remainder)
            remainder_looks_numeric = bool(
                remainder
                and (
                    re.match(r"^[./-]?\d", remainder)
                    or re.match(r"^\d+\.\d", remainder)
                    or re.match(r"^\d+/\d", remainder)
                )
            )
            looks_like_question = False
            if current is None:
                looks_like_question = 1 <= number <= (expected_count or 999) and remainder_looks_prompt and not remainder_looks_numeric
            elif number == expected_no:
                current_line_count = len([item for item in current["lines"] if item.strip()])
                looks_like_question = (
                    current_line_count >= 5
                    or (current_line_count >= 2 and remainder_looks_prompt)
                    or (current_line_count >= 4 and remainder_looks_prompt)
                ) and not remainder_looks_numeric
            elif (
                expected_count
                and current is not None
                and number <= expected_count
                and expected_no <= number <= expected_no + 3
            ):
                current_line_count = len([item for item in current["lines"] if item.strip()])
                looks_like_question = (
                    current_line_count >= 5
                    or (current_line_count >= 2 and remainder_looks_prompt)
                ) and not remainder_looks_numeric
            elif expected_count and number <= expected_count and number == current["number"] + 1:
                looks_like_question = remainder_looks_prompt and not remainder_looks_numeric
            if looks_like_question:
                if current and current["lines"]:
                    blocks.append(current)
                current = {"number": number, "lines": [remainder] if remainder else []}
                expected_no = number + 1
                continue
        if current is None:
            continue
        if line.lower().startswith("page "):
            continue
        if re.match(r"^correct\s*:?\s*\+\d+", line, flags=re.I):
            continue
        if re.match(r"^.*paper\s*\d*.*mcq.*questions$", line, flags=re.I):
            continue
        if re.match(r"^section\s*\d+\s*:\s*mcq", line, flags=re.I):
            continue
        if line in {"TEST", "QUESTIONS", "SECTIONS", "ANSWERS", "SOLUTIONS"}:
            continue
        current["lines"].append(line)
    if current and current["lines"]:
        blocks.append(current)
    return refine_blocks(blocks, expected_count)


def refine_blocks(blocks, expected_count=None):
    refined = []
    for block in blocks:
        split_blocks = split_nested_block(block, expected_count)
        refined.extend(split_blocks)
    return refined


def split_nested_block(block, expected_count=None):
    lines = list(block["lines"])
    if not lines:
        return [block]

    current_number = block["number"]
    start_index = 0
    for idx, line in enumerate(lines):
        parsed_label = parse_question_label(line, expected_count)
        if not parsed_label:
            continue
        number, remainder = parsed_label
        next_line = lines[idx + 1] if idx + 1 < len(lines) else ""
        if (
            number >= block["number"]
            and
            (expected_count is None or number <= expected_count)
            and (
                looks_like_prompt_start(remainder)
                or (not remainder and looks_like_prompt_start(next_line))
            )
        ):
            current_number = number
            start_index = idx
            break

    result = []
    current_lines = []
    for idx, line in enumerate(lines):
        if idx < start_index:
            continue
        parsed_label = parse_question_label(line, expected_count)
        if parsed_label:
            number, remainder = parsed_label
            next_line = lines[idx + 1] if idx + 1 < len(lines) else ""
            if (
                number > current_number
                and (expected_count is None or number <= expected_count)
                and (
                    looks_like_prompt_start(remainder)
                    or (not remainder and looks_like_prompt_start(next_line))
                )
                and len([item for item in current_lines if item.strip()]) >= 4
            ):
                result.append({"number": current_number, "lines": current_lines})
                current_number = number
                current_lines = [remainder] if remainder else []
                continue
        current_lines.append(line)

    if current_lines:
        result.append({"number": current_number, "lines": current_lines})
    return result


def split_prompt_and_options(lines):
    cleaned = [clean_line(x) for x in lines if clean_line(x)]
    if len(cleaned) < 4:
        return None
    option_count = 4 if len(cleaned) >= 5 else 3
    options = cleaned[-option_count:]
    prompt_lines = cleaned[:-option_count]
    prompt = " ".join(prompt_lines).strip()
    if not prompt:
        return None
    return {"prompt": prompt, "options": options}


def letter_to_index(letter):
    return {"A": 0, "B": 1, "C": 2, "D": 3}.get(letter)


def question_confidence(question):
    score = 0
    if len(question["prompt"]) >= 25:
        score += 2
    elif len(question["prompt"]) >= 10:
        score += 1
    if len(question["options"]) == 4:
        score += 2
    if all(len(item) >= 1 for item in question["options"]):
        score += 1
    if not re.match(r"^(mcq|questions|page|\d+)$", question["prompt"], flags=re.I):
        score += 1
    if 0 <= question["correctIndex"] <= 3:
        score += 2
    if any(len(item) > 8 for item in question["options"]):
        score += 1
    return score


def apply_manual_recovery(item):
    config = MANUAL_RECOVERY_CONFIG.get(cfg_key(item["subjectName"], item["paperTitle"]))
    if not config:
        item["skippedQuestions"] = []
        return item

    patches = config.get("patches", {})
    skips = config.get("skips", {})
    skipped_questions = []
    filtered_questions = []

    for idx, question in enumerate(item["questions"], start=1):
        if idx in skips:
            skipped_questions.append(
                {
                    "questionIndex": idx,
                    "prompt": question["prompt"],
                    "reason": skips[idx],
                }
            )
            continue

        patch = patches.get(idx)
        if patch:
            question = {**question}
            for field in ("prompt", "options", "correctIndex", "explanation", "topic", "difficulty"):
                if field in patch:
                    question[field] = patch[field]
            if "note" in patch:
                question["explanation"] = patch["note"]
        filtered_questions.append(question)

    item = {**item}
    item["questions"] = filtered_questions
    item["skippedQuestions"] = skipped_questions
    return item


def parse_paper(text, subject_name, paper_title, file_path):
    relative_path = str(file_path.relative_to(ROOT))
    path_hash = short_hash(relative_path)
    expected_count = extract_expected_count(text)
    question_lines = sanitize_question_part(text, subject_name)
    answer_lines = sanitize_answer_part(text, subject_name)
    solution_lines = sanitize_solution_part(text, subject_name)
    solutions = parse_solutions(solution_lines)
    text_answers = parse_text_answers(answer_lines, expected_count)
    solution_texts = parse_text_answers(solution_lines, expected_count)
    solution_paragraphs = parse_solution_paragraphs(solution_lines, expected_count)
    blocks = parse_question_blocks(question_lines, expected_count)
    questions = []
    low_prompt_count = 0

    for block_index, block in enumerate(blocks):
        split = split_prompt_and_options(block["lines"])
        if not split:
            continue
        letter = solutions.get(block["number"])
        correct_index = letter_to_index(letter) if letter else -1
        if correct_index is None or correct_index < 0:
            text_answer = text_answers.get(block["number"], "") or solution_texts.get(block["number"], "")
            correct_index = match_answer_text_to_option(text_answer, split["options"])
        if correct_index is None or correct_index < 0:
            correct_index = match_answer_text_to_option(solution_paragraphs.get(block["number"], ""), split["options"])
        if len(split["prompt"]) < 8:
            low_prompt_count += 1
        questions.append(
            {
                "id": f"{slugify(relative_path)}-{path_hash}-q{block_index + 1}",
                "section": subject_name,
                "prompt": split["prompt"],
                "options": split["options"],
                "correctIndex": correct_index if correct_index is not None else -1,
                "explanation": None,
                "topic": subject_name,
                "concepts": [],
                "difficulty": "medium",
                "marks": 5,
                "negativeMarks": 1,
            }
        )

    item = {
        "filePath": str(file_path),
        "relativePath": relative_path,
        "paperTitle": paper_title,
        "subjectName": subject_name,
        "expectedCount": expected_count,
        "questions": questions,
    }
    item = apply_manual_recovery(item)
    config = MANUAL_RECOVERY_CONFIG.get(cfg_key(subject_name, paper_title), {})
    questions = item["questions"]
    skipped_questions = item["skippedQuestions"]
    adjusted_expected_count = max((expected_count or len(questions)) - len(skipped_questions), len(questions), 1)
    min_questions_required = config.get("minQuestions", 20)
    min_coverage_required = config.get("minCoverage", 0.75)

    resolved_count = sum(1 for q in questions if q["correctIndex"] >= 0)
    avg_confidence = sum(question_confidence(q) for q in questions) / len(questions) if questions else 0
    adequate_count = (len(questions) / adjusted_expected_count) if adjusted_expected_count else 0
    prompt_integrity = 1 - (low_prompt_count / max(len(questions) + len(skipped_questions), 1)) if questions or skipped_questions else 0
    resolved_ratio = resolved_count / max(len(questions), 1)
    strict_import = (
        len(questions) >= min_questions_required
        and adequate_count >= min_coverage_required
        and resolved_ratio >= 0.95
        and avg_confidence >= 5
        and prompt_integrity >= 0.7
    )
    relaxed_import = (
        len(questions) >= 20
        and adequate_count >= 0.84
        and adequate_count <= 1.08
        and resolved_ratio >= 0.8
        and avg_confidence >= 8.2
        and prompt_integrity >= 0.9
    ) if expected_count else (
        len(questions) >= 40
        and resolved_ratio >= 0.9
        and avg_confidence >= 8.4
        and prompt_integrity >= 0.95
    )

    return {
        "filePath": str(file_path),
        "relativePath": relative_path,
        "paperTitle": paper_title,
        "subjectName": subject_name,
        "expectedCount": expected_count,
        "adjustedExpectedCount": adjusted_expected_count,
        "parsedCount": len(questions),
        "resolvedCount": resolved_count,
        "avgConfidence": avg_confidence,
        "promptIntegrity": prompt_integrity,
        "status": "import" if strict_import or relaxed_import else "skip",
        "questions": questions,
        "skippedQuestions": skipped_questions,
    }


def extract_raw_text(pdf_path: Path):
    doc = fitz.open(pdf_path)
    pages = []
    for page in doc:
        pages.append(page.get_text("text"))
    return "\n".join(pages)


def ocr_pdf(pdf_path: Path, dpi_scale=3.0):
    ocr = RapidOCR()
    doc = fitz.open(pdf_path)
    pages = []
    for page in doc:
        pix = page.get_pixmap(matrix=fitz.Matrix(dpi_scale, dpi_scale), alpha=False)
        img_bytes = pix.tobytes("png")
        result, _ = ocr(img_bytes)
        if not result:
            pages.append("")
            continue
        result = sorted(result, key=lambda item: (min(pt[1] for pt in item[0]), min(pt[0] for pt in item[0])))
        lines = [clean_line(item[1]) for item in result if clean_line(item[1])]
        pages.append("\n".join(lines))
    return "\n".join(pages)


def extract_targeted_hybrid_text(pdf_path: Path, dpi_scale=3.0):
    override_path = TEXT_CACHE_OVERRIDES.get(normalize_key(str(pdf_path)))
    if override_path and override_path.exists():
        override_text = override_path.read_text(encoding="utf-8", errors="ignore")
        raw_text = extract_raw_text(pdf_path)
        override_question_lines, override_answer_lines, override_solution_lines = split_sections(override_text)
        raw_question_lines, raw_answer_lines, raw_solution_lines = split_sections(raw_text)
        answer_lines = raw_answer_lines or override_answer_lines
        solution_lines = raw_solution_lines or override_solution_lines
        return rebuild_section_text(override_question_lines or raw_question_lines, answer_lines, solution_lines)
    ocr_pages = TARGETED_OCR_PAGES.get(normalize_key(str(pdf_path)))
    if not ocr_pages:
        return extract_raw_text(pdf_path)
    ocr = RapidOCR()
    doc = fitz.open(pdf_path)
    pages = []
    for index, page in enumerate(doc):
        if index not in ocr_pages:
            pages.append(page.get_text("text"))
            continue
        pix = page.get_pixmap(matrix=fitz.Matrix(dpi_scale, dpi_scale), alpha=False)
        img_bytes = pix.tobytes("png")
        result, _ = ocr(img_bytes)
        if not result:
            pages.append(page.get_text("text"))
            continue
        result = sorted(result, key=lambda item: (min(pt[1] for pt in item[0]), min(pt[0] for pt in item[0])))
        lines = [clean_line(item[1]) for item in result if clean_line(item[1])]
        pages.append("\n".join(lines))
    return "\n".join(pages)


def choose_better_parse(raw_parse, ocr_parse):
    candidates = [raw_parse, ocr_parse]

    def score(item):
        return (
            item["parsedCount"],
            item["resolvedCount"],
            item["promptIntegrity"],
            item["avgConfidence"],
        )

    candidates.sort(key=score, reverse=True)
    return candidates[0]


def ensure_subject(cur, subject_name, sort_order=0):
    subject_id = f"{COURSE_ID}-{slugify(subject_name)}"
    cur.execute(
        """
        insert into subjects (id, course_id, title, description, sort_order, is_published, created_at, updated_at)
        values (%s, %s, %s, %s, %s, true, now(), now())
        on conflict (id) do update set title = excluded.title, updated_at = now()
        """,
        (
            subject_id,
            COURSE_ID,
            subject_name,
            f"{subject_name} papers imported from the CUET bundle.",
            sort_order,
        ),
    )
    return subject_id


def insert_paper(cur, item):
    subject_id = ensure_subject(cur, item["subjectName"], 0)
    paper_id = f"{subject_id}-{slugify(item['relativePath'])}-{short_hash(item['relativePath'])}"
    cur.execute("delete from papers where id = %s", (paper_id,))
    cur.execute(
        """
        insert into papers (id, course_id, subject_id, title, duration_minutes, instructions, is_free_preview, created_at, updated_at)
        values (%s, %s, %s, %s, %s, %s::jsonb, false, now(), now())
        """,
        (
            paper_id,
            COURSE_ID,
            subject_id,
            item["paperTitle"],
            60,
            json.dumps([
                "Read every question carefully before answering.",
                "Correct answer: +5. Incorrect answer: -1.",
                "Submit before the timer ends.",
            ]),
        ),
    )
    for index, question in enumerate(item["questions"]):
        cur.execute(
            """
            insert into questions
              (id, paper_id, section, prompt, options, correct_index, explanation, topic, concepts, difficulty, marks, negative_marks, sort_order, created_at)
            values
              (%s, %s, %s, %s, %s::jsonb, %s, %s, %s, %s::jsonb, %s, %s, %s, %s, now())
            """,
            (
                f"{paper_id}-q{str(index + 1).zfill(3)}",
                paper_id,
                question["section"],
                question["prompt"],
                json.dumps(question["options"]),
                question["correctIndex"] if question["correctIndex"] >= 0 else 0,
                question["explanation"],
                question["topic"],
                json.dumps(question["concepts"]),
                question["difficulty"],
                question["marks"],
                question["negativeMarks"],
                index,
            ),
        )
    return paper_id


def main():
    load_env()
    report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    skipped = report.get("skipped", [])
    filter_subject = normalize_key(os.environ.get("FILTER_SUBJECT", ""))
    filter_paper = normalize_key(os.environ.get("FILTER_PAPER", ""))
    limit = int(os.environ.get("LIMIT", "0") or "0")
    if filter_subject:
        skipped = [item for item in skipped if normalize_key(item["subject"]) == filter_subject]
    if filter_paper:
        skipped = [item for item in skipped if normalize_key(item["paper"]) == filter_paper]
    if limit > 0:
        skipped = skipped[:limit]

    file_index = build_file_index()
    results = []
    skip_log_entries = []
    dry_run = os.environ.get("DRY_RUN", "").strip().lower() in {"1", "true", "yes"}
    skip_ocr = os.environ.get("SKIP_OCR", "").strip().lower() in {"1", "true", "yes"}

    conn = None if dry_run else psycopg2.connect(db_url())
    if conn is not None:
        conn.autocommit = False
    try:
        cur = conn.cursor() if conn is not None else None
        for item in skipped:
            lookup_key = f"{normalize_key(item['subject'])}__{normalize_key(item['paper'])}"
            file_path = file_index.get(lookup_key)
            if not file_path:
                results.append({**item, "status": "missing-file"})
                print(f"[missing] {item['subject']} / {item['paper']}")
                continue
            print(f"[ocr] {item['subject']} / {item['paper']}")
            raw_text = extract_raw_text(file_path)
            raw_parsed = parse_paper(raw_text, item["subject"], item["paper"], file_path)
            targeted_text = extract_targeted_hybrid_text(file_path)
            targeted_parsed = (
                parse_paper(targeted_text, item["subject"], item["paper"], file_path)
                if targeted_text
                else None
            )
            if skip_ocr:
                parsed = targeted_parsed or raw_parsed
                selected_source = "targeted-ocr" if targeted_parsed is not None else "raw"
            else:
                ocr_text = ocr_pdf(file_path)
                ocr_parsed = parse_paper(ocr_text, item["subject"], item["paper"], file_path)
                candidates = [("raw", raw_parsed), ("ocr", ocr_parsed)]
                if targeted_parsed is not None:
                    candidates.append(("targeted-ocr", targeted_parsed))
                candidates.sort(
                    key=lambda item_tuple: (
                        1 if item_tuple[1]["status"] == "import" else 0,
                        item_tuple[1]["parsedCount"],
                        item_tuple[1]["resolvedCount"],
                        item_tuple[1]["promptIntegrity"],
                        item_tuple[1]["avgConfidence"],
                    ),
                    reverse=True,
                )
                selected_source, parsed = candidates[0]
            if parsed["status"] == "import":
                paper_id = None
                if not dry_run:
                    paper_id = insert_paper(cur, parsed)
                    conn.commit()
                skip_log_entries.extend(
                    [
                        {
                            "subject": item["subject"],
                            "paper": item["paper"],
                            **entry,
                        }
                        for entry in parsed.get("skippedQuestions", [])
                    ]
                )
                results.append(
                    {
                        "subject": item["subject"],
                        "paper": item["paper"],
                        "status": "importable" if dry_run else "imported",
                        "paperId": paper_id,
                        "parsedCount": parsed["parsedCount"],
                        "resolvedCount": parsed["resolvedCount"],
                        "expectedCount": parsed["expectedCount"],
                        "adjustedExpectedCount": parsed["adjustedExpectedCount"],
                        "avgConfidence": parsed["avgConfidence"],
                        "promptIntegrity": parsed["promptIntegrity"],
                        "source": selected_source,
                        "skippedQuestionCount": len(parsed.get("skippedQuestions", [])),
                    }
                )
                print(f"  -> {'importable' if dry_run else 'imported'} via {selected_source}; parsed {parsed['parsedCount']}/{parsed['expectedCount']}")
            else:
                if conn is not None:
                    conn.rollback()
                skip_log_entries.extend(
                    [
                        {
                            "subject": item["subject"],
                            "paper": item["paper"],
                            **entry,
                        }
                        for entry in parsed.get("skippedQuestions", [])
                    ]
                )
                results.append(
                    {
                        "subject": item["subject"],
                        "paper": item["paper"],
                        "status": "failed",
                        "parsedCount": parsed["parsedCount"],
                        "resolvedCount": parsed["resolvedCount"],
                        "expectedCount": parsed["expectedCount"],
                        "adjustedExpectedCount": parsed["adjustedExpectedCount"],
                        "avgConfidence": parsed["avgConfidence"],
                        "promptIntegrity": parsed["promptIntegrity"],
                        "source": selected_source,
                        "skippedQuestionCount": len(parsed.get("skippedQuestions", [])),
                    }
                )
                print(f"  -> failed via {selected_source}; parsed {parsed['parsedCount']}/{parsed['expectedCount']}")
    finally:
        if conn is not None and cur is not None:
            cur.close()
        if conn is not None:
            conn.close()

    summary = {
        "createdAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "totalInput": len(skipped),
        "imported": sum(1 for x in results if x["status"] == "imported"),
        "importable": sum(1 for x in results if x["status"] == "importable"),
        "failed": sum(1 for x in results if x["status"] == "failed"),
        "missingFile": sum(1 for x in results if x["status"] == "missing-file"),
        "results": results,
    }
    OUTPUT_PATH.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    SKIP_LOG_PATH.write_text(json.dumps({"createdAt": summary["createdAt"], "items": skip_log_entries}, indent=2), encoding="utf-8")
    print(f"Wrote OCR recovery report to {OUTPUT_PATH}")
    print(f"Wrote skipped-question log to {SKIP_LOG_PATH}")


if __name__ == "__main__":
    main()
