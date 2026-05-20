#!/usr/bin/env bash
set -euo pipefail

VM_DIR="${VM_DIR:-/root/merit-launchers}"
BASE_URL="${BASE_URL:-https://meritlaunchers.com}"
API_INTERNAL_URL="${API_INTERNAL_URL:-http://127.0.0.1:8080}"
QA_ENV_FILE="${QA_ENV_FILE:-${VM_DIR}/deploy/vps-qa.env}"
REACHABILITY_FILE="${REACHABILITY_FILE:-${VM_DIR}/deploy/vps-reachability-checks.txt}"
DEFAULT_UA="${DEFAULT_UA:-Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36}"

if [[ -f "$QA_ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$QA_ENV_FILE"
  set +a
fi

assert_http_ok() {
  local path="$1"
  local marker="${2:-}"
  local attempt
  local body=""
  for attempt in 1 2 3 4 5 6 7 8 9 10; do
    if body="$(curl -fsSL --max-time 30 -A "$DEFAULT_UA" "${BASE_URL}${path}")"; then
      if [[ -z "$marker" ]] || [[ "$body" == *"$marker"* ]]; then
        return
      fi
      if [[ "$attempt" -eq 10 ]]; then
        echo "Expected marker '$marker' missing from ${BASE_URL}${path}" >&2
        exit 1
      fi
    elif [[ "$attempt" -eq 10 ]]; then
      exit 1
    fi
    sleep 3
  done
}

assert_api_ready() {
  local url="$1"
  local attempt
  for attempt in 1 2 3 4 5 6 7 8 9 10; do
    if curl -fsSL --max-time 15 -A "$DEFAULT_UA" "$url" >/dev/null; then
      return
    fi
    if [[ "$attempt" -eq 10 ]]; then
      echo "API readiness check failed for $url" >&2
      exit 1
    fi
    sleep 3
  done
}

echo "==> Running VPS public reachability smoke against ${BASE_URL}"
assert_api_ready "${API_INTERNAL_URL}/health"
assert_api_ready "${BASE_URL}/api/health"
while IFS='|' read -r path marker; do
  [[ -z "${path}" ]] && continue
  [[ "${path}" =~ ^# ]] && continue
  assert_http_ok "$path" "$marker"
done < "$REACHABILITY_FILE"

admin_bootstrap="$(curl -fsSL --max-time 30 -A "$DEFAULT_UA" "${BASE_URL}/admin/flutter_bootstrap.js")"
if [[ "$admin_bootstrap" != *"serviceWorkerSettings: null"* ]]; then
  echo "Admin bootstrap still contains serviceWorkerSettings." >&2
  exit 1
fi

portal_bootstrap="$(curl -fsSL --max-time 30 -A "$DEFAULT_UA" "${BASE_URL}/portal/flutter_bootstrap.js")"
if [[ "$portal_bootstrap" != *"serviceWorkerSettings: null"* ]]; then
  echo "Portal bootstrap still contains serviceWorkerSettings." >&2
  exit 1
fi

bootstrap_tmp="$(mktemp)"
curl -fsSL --max-time 30 -A "$DEFAULT_UA" "${BASE_URL}/api/v1/bootstrap" > "$bootstrap_tmp"
python3 - <<'PY' "$bootstrap_tmp"
import json, sys
with open(sys.argv[1], "r", encoding="utf-8") as fh:
    data = json.load(fh)
courses = data.get("courses") or []
if not courses:
    raise SystemExit("Bootstrap did not return any courses.")
PY
rm -f "$bootstrap_tmp"

echo "==> Running container-level API smoke"
docker compose -f "${VM_DIR}/docker-compose.yml" exec -T api sh -lc "QA_BASE_URL='${API_INTERNAL_URL}' node --input-type=module -" <<'NODE'
import jwt from "jsonwebtoken";

const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:8080";
const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error("JWT_SECRET is not available inside the api container.");
}

const stamp = Date.now();
const token = jwt.sign(
  {
    sub: `qa-admin-${stamp}`,
    role: "admin",
    email: `qa-admin-${stamp}@meritlaunchers.test`,
    name: "QA Smoke Admin",
  },
  secret,
  { expiresIn: "10m" },
);

const headers = {
  authorization: `Bearer ${token}`,
  "content-type": "application/json",
};
let subjectId = `clat-qa-smoke-${stamp}`;
const paperId = `qa-smoke-paper-${stamp}`;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed: ${response.status} ${text}`);
  }
  return body;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

try {
  const seed = await request("/v1/bootstrap");
  assert(Array.isArray(seed.courses) && seed.courses.some((course) => course.id === "clat"), "CLAT course missing from bootstrap.");

  const subject = await request("/v1/admin/subjects", {
    method: "POST",
    body: JSON.stringify({
      id: subjectId,
      courseId: "clat",
      title: `QA Smoke Subject ${stamp}`,
      description: "Temporary production smoke subject. Safe to delete.",
      sortOrder: 9999,
      isPublished: true,
    }),
  });
  assert(subject.id === subjectId || subject.courseId === "clat", "Subject create response was malformed.");
  subjectId = subject.id || subjectId;

  const question = {
    id: `qa-smoke-q-${stamp}`,
    section: "QA Smoke",
    prompt: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}",
    promptSegments: [{ type: "math", value: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}", display: true }],
    attachments: [{ url: "/uploads/qa-smoke-placeholder.png", mimeType: "image/png", label: "QA placeholder" }],
    options: ["\\frac{1}{2}", "\\sqrt{x}", "x^{2}", "None"],
    optionSegments: [
      [{ type: "math", value: "\\frac{1}{2}", display: false }],
      [{ type: "math", value: "\\sqrt{x}", display: false }],
      [{ type: "math", value: "x^{2}", display: false }],
      [{ type: "text", value: "None", display: false }],
    ],
    optionAttachments: [[{ url: "/uploads/qa-smoke-option.png", mimeType: "image/png", label: "QA option" }], [], [], []],
    correctIndex: 0,
    explanation: null,
    topic: "QA",
    concepts: ["matrix", "fraction"],
    difficulty: "medium",
    marks: 3,
    negativeMarks: 1,
  };

  await request("/v1/admin/papers", {
    method: "POST",
    body: JSON.stringify({
      paper: {
        id: paperId,
        courseId: "clat",
        subjectId,
        title: `QA Smoke Paper ${stamp}`,
        durationMinutes: 15,
        instructions: ["Temporary smoke paper"],
        isFreePreview: true,
        sourceFileUrl: "/toolkit-files/source/qa-smoke.pdf",
        sourceFileName: "qa-smoke.pdf",
      },
      questions: [question],
    }),
  });

  let paper = await request(`/v1/papers/${encodeURIComponent(paperId)}`);
  assert(paper.id === paperId, "Fetched paper id mismatch.");
  assert(paper.questionCount === 1, "Fetched paper questionCount should be 1.");
  assert(paper.questions?.length === 1, "Fetched paper should include one question.");
  assert(paper.questions[0].promptSegments?.[0]?.type === "math", "Prompt math segment did not persist.");
  assert(paper.questions[0].attachments?.[0]?.url, "Question attachment did not persist.");
  assert(paper.questions[0].optionAttachments?.[0]?.[0]?.url, "Option attachment did not persist.");

  await request(`/v1/admin/papers/${encodeURIComponent(paperId)}`, {
    method: "PUT",
    body: JSON.stringify({
      paper: {
        id: paperId,
        courseId: "clat",
        subjectId,
        title: `QA Smoke Paper Updated ${stamp}`,
        durationMinutes: 20,
        instructions: ["Temporary smoke paper updated"],
        isFreePreview: false,
        sourceFileUrl: "/toolkit-files/source/qa-smoke.pdf",
        sourceFileName: "qa-smoke.pdf",
      },
      questions: [
        question,
        {
          ...question,
          id: `qa-smoke-q2-${stamp}`,
          prompt: "\\Delta = b^2 - 4ac",
          promptSegments: [{ type: "math", value: "\\Delta = b^2 - 4ac", display: false }],
          correctIndex: 2,
        },
      ],
    }),
  });

  paper = await request(`/v1/papers/${encodeURIComponent(paperId)}`);
  assert(paper.title.includes("Updated"), "Paper update title did not persist.");
  assert(paper.questionCount === 2 && paper.questions?.length === 2, "Paper update should persist two questions.");
} finally {
  await fetch(`${baseUrl}/v1/admin/papers/${encodeURIComponent(paperId)}`, { method: "DELETE", headers }).catch(() => {});
  await fetch(`${baseUrl}/v1/admin/subjects/${encodeURIComponent(subjectId)}`, { method: "DELETE", headers }).catch(() => {});
}
NODE

if [[ -n "${MERIT_QA_ADMIN_EMAIL:-}" && -n "${MERIT_QA_ADMIN_PASSWORD:-}" && -n "${MERIT_QA_STUDENT_EMAIL:-}" && -n "${MERIT_QA_STUDENT_PASSWORD:-}" ]]; then
  echo "==> Running VPS auth smoke"
  python3 - <<'PY' "$BASE_URL"
import json, os, sys, urllib.request

base = sys.argv[1].rstrip("/")

def request(path, body=None, token=None):
    headers = {"Accept": "application/json"}
    data = None
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode()
    req = urllib.request.Request(base + path, data=data, headers=headers, method="POST" if body is not None else "GET")
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode())

admin = request("/api/v1/auth/password-login", {
    "email": os.environ["MERIT_QA_ADMIN_EMAIL"],
    "password": os.environ["MERIT_QA_ADMIN_PASSWORD"],
})
if admin.get("user", {}).get("role") != "admin" or not admin.get("token"):
    raise SystemExit("Admin auth smoke failed.")
admin_bootstrap = request("/api/v1/bootstrap", token=admin["token"])
if not admin_bootstrap.get("courses"):
    raise SystemExit("Admin bootstrap did not return courses.")

student = request("/api/v1/auth/password-login", {
    "email": os.environ["MERIT_QA_STUDENT_EMAIL"],
    "password": os.environ["MERIT_QA_STUDENT_PASSWORD"],
    "platform": "web",
})
if student.get("user", {}).get("role") != "student" or not student.get("token"):
    raise SystemExit("Student auth smoke failed.")
student_bootstrap = request("/api/v1/bootstrap", token=student["token"])
if not student_bootstrap.get("currentStudent") or not student_bootstrap.get("courses"):
    raise SystemExit("Student bootstrap did not return workspace data.")

marketing_email = os.environ.get("MERIT_QA_MARKETING_ADMIN_EMAIL")
marketing_password = os.environ.get("MERIT_QA_MARKETING_ADMIN_PASSWORD")
if not marketing_email or not marketing_password:
    raise SystemExit("MERIT_QA_MARKETING_ADMIN_EMAIL and MERIT_QA_MARKETING_ADMIN_PASSWORD must be configured for auth smoke.")
marketing = request("/api/v1/marketing-admin/auth/login", {
    "email": marketing_email,
    "password": marketing_password,
})
if not marketing.get("token"):
    raise SystemExit("Marketing admin auth smoke failed.")
marketing_me = request("/api/v1/marketing-admin/me", token=marketing["token"])
if not marketing_me.get("admin", {}).get("email"):
    raise SystemExit("Marketing admin profile smoke failed.")

partner_email = os.environ.get("MERIT_QA_PARTNER_EMAIL")
partner_password = os.environ.get("MERIT_QA_PARTNER_PASSWORD")
if partner_email and partner_password:
    partner = request("/api/v1/partner/auth/login", {
        "email": partner_email,
        "password": partner_password,
    })
    if not partner.get("token"):
        raise SystemExit("Partner auth smoke failed.")
    partner_me = request("/api/v1/partner/me", token=partner["token"])
    if not partner_me.get("id") or not partner_me.get("login_email"):
        raise SystemExit("Partner profile smoke failed.")
else:
    print("Partner auth smoke skipped; MERIT_QA_PARTNER_EMAIL / MERIT_QA_PARTNER_PASSWORD not configured.")
PY
else
  echo "==> Auth smoke skipped on VPS; QA credentials are not configured in environment."
fi

echo "==> Running VPS authenticated endpoint regression sweep"
if [[ -n "${CMS_ADMIN_EMAIL:-}" && -n "${CMS_ADMIN_PASSWORD:-}" ]]; then
  docker compose -f "${VM_DIR}/docker-compose.yml" exec -T api sh -lc "CMS_ADMIN_EMAIL='${CMS_ADMIN_EMAIL}' CMS_ADMIN_PASSWORD='${CMS_ADMIN_PASSWORD}' SWEEP_BASE_URL='${API_INTERNAL_URL}' node --input-type=module -" < "${VM_DIR}/scripts/prod_authenticated_endpoint_sweep.mjs"
else
  docker compose -f "${VM_DIR}/docker-compose.yml" exec -T api sh -lc "SWEEP_BASE_URL='${API_INTERNAL_URL}' node --input-type=module -" < "${VM_DIR}/scripts/prod_authenticated_endpoint_sweep.mjs"
fi

echo "==> VPS smoke suite passed"
