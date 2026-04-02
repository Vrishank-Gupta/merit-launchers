import json
import re
from pathlib import Path


REPO_ROOT = Path(r"c:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers")
REPORT_PATH = REPO_ROOT / "tmp" / "math_source_direct_repair_report.json"
OUTPUT_PATH = REPO_ROOT / "tmp" / "cuet_math_curated_repairs.json"
MAPPED_OUTPUT_PATH = REPO_ROOT / "tmp" / "cuet_math_curated_mapped_repairs.json"


SELECTED_SORT_ORDERS = {
    "PAPER 1": "all",
    "PAPER 2": "all",
    "PAPER 3": {21, 32, 33},
    "PAPER 4": {19, 23, 29},
    "PAPER 5": {12, 13, 14, 15, 22, 36, 39, 41, 42},
    "PAPER 6": {14, 25, 31, 32, 33, 37, 39, 41},
    "PAPER 7": {14, 15, 16, 25, 30, 31, 32, 37, 39, 40},
    "PAPER 8": {9, 15, 19, 21, 22, 37, 40, 44},
    "PAPER 9": {14, 16, 26, 30, 31, 33, 42},
    "PAPER 10": {19, 48},
}


MANUAL_OVERRIDES = {
    ("PAPER 3", 33): {
        "prompt": "Let A = {1,2,3}, B = {4,5,6,7} and let f = {(1,4),(2,5),(3,6)} be a function from A to B. Based on the given information, f is best defined as",
        "options": [
            "Surjective function",
            "Injective function",
            "Bijective function",
            "Function",
        ],
    },
    ("PAPER 4", 19): {
        "prompt": "A coin is tossed three times. If events A and B are defined as A = exactly two heads and B = last toss is head, then A and B are",
        "options": [
            "Independent",
            "Dependent",
            "Both",
            "Mutually exclusive",
        ],
    },
    ("PAPER 4", 29): {
        "prompt": "The function f : R -> R defined by f(x) = x^3 is:",
        "options": [
            "one-one but not onto",
            "not one-one but onto",
            "neither one-one nor onto",
            "one-one and onto",
        ],
    },
    ("PAPER 5", 41): {
        "prompt": "The equation of the plane passing through three non-collinear points with position vectors a, b and c is:",
        "options": [
            "r·(b × c + c × a + a × b) = 0",
            "r·(b × c + c × a + a × b) = [abc]",
            "r·(a × (b + c)) = [abc]",
            "r·(a + b + c) = 0",
        ],
    },
    ("PAPER 5", 42): {
        "prompt": "A plane meets the coordinate axes at A, B, C such that the centroid of triangle ABC is the point (a, b, c). If the equation of the plane is x/a + y/b + z/c = k, then k =",
        "options": [
            "2",
            "1",
            "3",
            "None of these",
        ],
    },
    ("PAPER 6", 31): {
        "prompt": "Let R be a relation on N given by R = {(a,b) : a = b - 2, b ≠ 6}. Then:",
        "options": [
            "(2,4) ∈ R",
            "(3,8) ∈ R",
            "(6,8) ∈ R",
            "(8,7) ∈ R",
        ],
    },
    ("PAPER 7", 25): {
        "prompt": "If a matrix has 5 elements, then all possible orders it can have are:",
        "options": [
            "1×5, 5×1",
            "4×5, 5×4",
            "1×4, 4×1",
            "3×5, 5×3",
        ],
    },
    ("PAPER 8", 21): {
        "prompt": "What is the principal value of sin^-1(√3/2)?",
        "options": [
            "π/2",
            "π/3",
            "2π/3",
            "None of these",
        ],
    },
    ("PAPER 8", 22): {
        "prompt": "The point which does not lie in the half-plane 2x + 3y - 12 < 0 is:",
        "options": [
            "(2,1)",
            "(1,2)",
            "(-2,3)",
            "(2,3)",
        ],
    },
    ("PAPER 8", 44): {
        "prompt": "The direction ratios of the normal to the plane 7x + 4y - 2z + 5 = 0 are:",
        "options": [
            "7, 4, -2",
            "7, 4, 2",
            "4, -2, 5",
            "7, 4, 5",
        ],
    },
    ("PAPER 9", 26): {
        "prompt": "Consider a non-empty set consisting of children in a family and a relation R defined as aRb if a is brother of b. Then R is:",
        "options": [
            "Symmetric but not transitive",
            "Transitive but not symmetric",
            "Neither symmetric nor transitive",
            "Both symmetric and transitive",
        ],
    },
    ("PAPER 9", 30): {
        "prompt": "If a line has direction ratios 2, -1, -2, then its direction cosines are:",
        "options": [
            "2/3, -1/3, -2/3",
            "2/3, 1/3, -2/3",
            "2/3, -2/3, -1/3",
            "None of the above",
        ],
    },
    ("PAPER 9", 31): {
        "prompt": "The equation of the normal to the curve y^2 = 8x which is parallel to the line x + 3y = 8 is:",
        "options": [
            "3x - y = 8",
            "3x + y + 8 = 0",
            "x + 3y + 8 = 0",
            "x + 3y = 0",
        ],
    },
    ("PAPER 10", 19): {
        "prompt": "Region represented by x >= 0, y >= 0 is:",
        "options": [
            "First quadrant",
            "Second quadrant",
            "Third quadrant",
            "Fourth quadrant",
        ],
    },
    ("PAPER 10", 48): {
        "prompt": "The value of c in Rolle's theorem for the function f(x) = sin 2x in [0, π/2] is",
        "options": [
            "π/4",
            "π/6",
            "π/2",
            "π/3",
        ],
    },
}


def load_updates():
    data = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    deduped = {}
    for item in data["updates"]:
        deduped[(item["paperTitle"], item["sortOrder"])] = item
    return deduped


def build_repairs():
    updates = load_updates()
    selected = []
    for paper_title, selector in SELECTED_SORT_ORDERS.items():
        for (candidate_paper, sort_order), item in updates.items():
            if candidate_paper != paper_title:
                continue
            if selector != "all" and sort_order not in selector:
                continue
            payload = dict(item)
            override = MANUAL_OVERRIDES.get((paper_title, sort_order))
            if override:
                payload.update(override)
            selected.append(payload)
    selected.sort(key=lambda item: (item["paperTitle"], item["sortOrder"]))
    return selected


def main():
    repairs = build_repairs()
    OUTPUT_PATH.write_text(
        json.dumps(repairs, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"wrote {len(repairs)} curated repairs to {OUTPUT_PATH}")


def normalize_text(value: str) -> str:
    result = (value or "").lower().replace("\n", " ")
    replacements = {
        "√": "sqrt",
        "π": "pi",
        "θ": "theta",
        "×": "x",
        "∩": " intersection ",
        "≤": " <= ",
        "≥": " >= ",
        "≠": " != ",
        "∞": " infinity ",
    }
    for source, target in replacements.items():
        result = result.replace(source, target)
    result = re.sub(r"[^a-z0-9]+", " ", result)
    return re.sub(r"\s+", " ", result).strip()


def map_repairs_to_live_rows():
    import difflib

    live_rows = json.loads(
        (REPO_ROOT / "tmp" / "math_prod_live_safe.json").read_text(encoding="utf-8")
    )
    repairs = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
    by_paper = {}
    for row in live_rows:
        by_paper.setdefault(row["paperTitle"], []).append(row)

    manual_targets = {
        ("PAPER 7", 15): 21,
        ("PAPER 8", 22): 26,
    }

    used = set()
    mapped = []
    for item in repairs:
        manual_target = manual_targets.get((item["paperTitle"], item.get("questionNumber")))
        if manual_target is not None:
            target_row = next(
                row
                for row in by_paper[item["paperTitle"]]
                if row["sortOrder"] == manual_target
            )
            mapped.append(
                {
                    **item,
                    "targetSortOrder": target_row["sortOrder"],
                    "mappingScore": 1.0,
                    "mappingMode": "manual",
                }
            )
            used.add((item["paperTitle"], target_row["sortOrder"]))
            continue

        best = None
        for row in by_paper[item["paperTitle"]]:
            key = (item["paperTitle"], row["sortOrder"])
            if key in used:
                continue
            prompt_score = difflib.SequenceMatcher(
                None,
                normalize_text(item["prompt"]),
                normalize_text(row["prompt"]),
            ).ratio()
            option_score = difflib.SequenceMatcher(
                None,
                normalize_text(" || ".join(item["options"])),
                normalize_text(" || ".join(row["options"])),
            ).ratio()
            score = prompt_score * 0.85 + option_score * 0.15
            if best is None or score > best["score"]:
                best = {
                    "score": score,
                    "row": row,
                }

        if best is None or best["score"] < 0.86:
            continue

        mapped.append(
            {
                **item,
                "targetSortOrder": best["row"]["sortOrder"],
                "mappingScore": round(best["score"], 3),
                "mappingMode": "auto",
            }
        )
        used.add((item["paperTitle"], best["row"]["sortOrder"]))

    MAPPED_OUTPUT_PATH.write_text(
        json.dumps(mapped, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"wrote {len(mapped)} mapped repairs to {MAPPED_OUTPUT_PATH}")


if __name__ == "__main__":
    main()
    map_repairs_to_live_rows()
