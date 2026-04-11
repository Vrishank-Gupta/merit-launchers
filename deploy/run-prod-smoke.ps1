param(
  [string]$VmAlias = "myvps",
  [string]$VmDir = "/root/merit-launchers"
)

$ErrorActionPreference = "Stop"

$remoteScript = @'
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
  {expiresIn: "10m"},
);

const headers = {
  "authorization": `Bearer ${token}`,
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
    promptSegments: [{type: "math", value: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}", display: true}],
    attachments: [{url: "/uploads/qa-smoke-placeholder.png", mimeType: "image/png", label: "QA placeholder"}],
    options: ["\\frac{1}{2}", "\\sqrt{x}", "x^{2}", "None"],
    optionSegments: [
      [{type: "math", value: "\\frac{1}{2}", display: false}],
      [{type: "math", value: "\\sqrt{x}", display: false}],
      [{type: "math", value: "x^{2}", display: false}],
      [{type: "text", value: "None", display: false}],
    ],
    optionAttachments: [[{url: "/uploads/qa-smoke-option.png", mimeType: "image/png", label: "QA option"}], [], [], []],
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
          promptSegments: [{type: "math", value: "\\Delta = b^2 - 4ac", display: false}],
          correctIndex: 2,
        },
      ],
    }),
  });

  paper = await request(`/v1/papers/${encodeURIComponent(paperId)}`);
  assert(paper.title.includes("Updated"), "Paper update title did not persist.");
  assert(paper.questionCount === 2 && paper.questions?.length === 2, "Paper update should persist two questions.");

  console.log(JSON.stringify({ok: true, subjectId, paperId, checkedQuestions: paper.questionCount}, null, 2));
} finally {
  await fetch(`${baseUrl}/v1/admin/papers/${encodeURIComponent(paperId)}`, {method: "DELETE", headers}).catch(() => {});
  await fetch(`${baseUrl}/v1/admin/subjects/${encodeURIComponent(subjectId)}`, {method: "DELETE", headers}).catch(() => {});
}
'@

Write-Host "==> Running production API smoke test on $VmAlias..."
$remoteScript | ssh $VmAlias "cd $VmDir && docker compose exec -T api node --input-type=module -"
