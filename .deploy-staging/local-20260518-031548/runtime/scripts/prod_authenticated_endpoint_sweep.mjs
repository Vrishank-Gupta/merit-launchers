import crypto from "node:crypto";
import fs from "node:fs/promises";
import jwt from "jsonwebtoken";
import pg from "pg";

const BASE_URL = process.env.SWEEP_BASE_URL || "http://127.0.0.1:8080";
const JWT_SECRET = process.env.JWT_SECRET;
const CMS_ADMIN_EMAIL = process.env.CMS_ADMIN_EMAIL || "";
const CMS_ADMIN_PASSWORD = process.env.CMS_ADMIN_PASSWORD || "";
const HAS_CMS_CREDENTIALS = Boolean(CMS_ADMIN_EMAIL && CMS_ADMIN_PASSWORD);

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required for the authenticated endpoint sweep.");
}

const {Pool} = pg;
const pool = new Pool({connectionString: process.env.DATABASE_URL});

const stamp = Date.now();
const prefix = `qa-auth-sweep-${stamp}`;
const studentEmail = `${prefix}-student@meritlaunchers.test`;
const studentPassword = "Student#123";
const marketingAdminEmail = `${prefix}-ma@meritlaunchers.test`;
const marketingAdminPassword = "Marketing#123";
const nestedMarketingAdminEmail = `${prefix}-ma-nested@meritlaunchers.test`;
const adminManagedEmail = `${prefix}-admin@meritlaunchers.test`;
const partnerEmail = `${prefix}-partner@meritlaunchers.test`;
const partnerPassword = "Partner#123";
const partnerPassword2 = "Partner#456";
const pendingParentEmail = `${prefix}-pending-parent@meritlaunchers.test`;
const pendingChildEmail = `${prefix}-pending-child@meritlaunchers.test`;
const oldAffiliateCode = `QA${String(stamp).slice(-8)}`.toUpperCase();
const allowlistId = `${prefix}@allowlist.test`;
const payoutMonth = "2030-01";

const state = {
  adminToken: null,
  cmsToken: null,
  marketingAdminToken: null,
  studentToken: null,
  partnerToken: null,
  courseId: `${prefix}-course`,
  subjectId: `${prefix}-subject`,
  paperId: `${prefix}-paper`,
  secondPaperId: `${prefix}-paper-2`,
  studentId: null,
  marketingAdminAccountId: null,
  nestedMarketingAdminAccountId: null,
  managedAdminAccountId: null,
  partnerId: null,
  partnerCode: null,
  deletablePartnerId: null,
  deletablePartnerCode: null,
  deletedPartnerId: null,
  pendingParentId: null,
  pendingChildId: null,
  blogId: null,
  blogUploadUrl: null,
  questionImageUrl: null,
  cmsUploadUrl: null,
  paperSourceUrl: null,
  toolkitFileId: null,
  payoutId: null,
  payoutBulkId: null,
  leadId: null,
  supportMessageId: `${prefix}-support-msg`,
  examSessionId: `${prefix}-exam-session`,
  attemptId: `${prefix}-attempt`,
};

const results = [];

function adminJwt(email = `qa-admin-${stamp}@meritlaunchers.test`) {
  return jwt.sign(
    {
      jti: crypto.randomUUID(),
      sub: `qa-admin-${stamp}`,
      role: "admin",
      email,
      name: "QA Sweep Admin",
    },
    JWT_SECRET,
    {expiresIn: "30m"},
  );
}

function issueActionToken(payload, expiresIn = "24h") {
  return jwt.sign({jti: crypto.randomUUID(), ...payload}, JWT_SECRET, {expiresIn});
}

function uniqueAadhaar(seed) {
  return `9${String(seed).padStart(11, "0").slice(-11)}`;
}

function uniquePan(seed) {
  const suffix = String(seed).padStart(4, "0").slice(-4);
  return `ABCDE${suffix}F`;
}

function partnerPayload({name, email, referredById = null}) {
  const numericSeed = Number(String(Date.now() + Math.floor(Math.random() * 1000)).slice(-8));
  return {
    name,
    associate_id: `ASSOC-${numericSeed}`,
    partner_type: "Education Associate",
    login_email: email,
    admin_notes: "QA sweep temporary record",
    aadhaar_number: uniqueAadhaar(numericSeed),
    pan_number: uniquePan(numericSeed),
    referred_by_affiliate_id: referredById,
    phone: "9876543210",
    address_line_1: "QA Street 1",
    address_line_2: "Suite 2",
    locality: "QA Locality",
    district: "QA District",
    state: "Delhi",
    pincode: "110001",
    profession: "Academician",
    work_experience_years: 5,
    bank_account_holder_name: "QA HOLDER",
    bank_ifsc_code: "SBIN0001234",
    bank_account_number: `1234567890${numericSeed}`,
    profile_image_url: null,
  };
}

function joinPayload({name, email, referrerCode}) {
  const numericSeed = Number(String(Date.now() + Math.floor(Math.random() * 1000)).slice(-8));
  return {
    name,
    email,
    password: partnerPassword,
    partner_type: "Education Associate",
    referrer_code: referrerCode,
    aadhaar_number: uniqueAadhaar(numericSeed),
    pan_number: uniquePan(numericSeed),
    phone: "9876543210",
    address_line_1: "QA Join Street",
    address_line_2: "Block A",
    locality: "QA Join Locality",
    district: "QA Join District",
    state: "Delhi",
    pincode: "110001",
    profession: "Academician",
    work_experience_years: 4,
    bank_account_holder_name: "QA JOIN HOLDER",
    bank_ifsc_code: "SBIN0001234",
    bank_account_number: `9988776655${numericSeed}`,
    profile_image_url: null,
  };
}

async function request(method, path, {token, body, isJson = true, expectedStatus = 200, headers = {}, raw = false} = {}) {
  const finalHeaders = new Headers(headers);
  if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  let payload = body;
  if (body !== undefined && !(body instanceof FormData) && isJson) {
    finalHeaders.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: payload,
  });
  const text = await response.text();
  let parsed = text;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }
  const okStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  if (!okStatuses.includes(response.status)) {
    throw new Error(`${method} ${path} -> ${response.status}: ${text}`);
  }
  return raw ? {response, text, parsed} : parsed;
}

function record(name, detail = "") {
  results.push({name, status: "passed", detail});
}

async function step(name, fn) {
  try {
    const detail = await fn();
    record(name, detail || "");
  } catch (error) {
    results.push({name, status: "failed", detail: error.message || String(error)});
    throw error;
  }
}

async function queryOne(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows[0] || null;
}

async function cleanup() {
  const unlinkIfPresent = async (url, baseDir) => {
    if (!url) return;
    const fileName = url.split("/").pop();
    if (!fileName) return;
    try {
      await fs.unlink(`${baseDir}/${fileName}`);
    } catch {}
  };

  try {
    const qaAffiliateRows = await pool.query(
      `select id, code
         from affiliates
        where login_email like $1
           or login_email in ($2, $3, $4, $5, $6)`,
      [
        `%@meritlaunchers.test`,
        partnerEmail,
        pendingParentEmail,
        pendingChildEmail,
        `${prefix}-old-affiliate@meritlaunchers.test`,
        `${prefix}-deletable@meritlaunchers.test`,
      ],
    );
    const qaAffiliateIds = qaAffiliateRows.rows.map((row) => row.id).filter(Boolean);
    const qaAffiliateCodes = qaAffiliateRows.rows.map((row) => row.code).filter(Boolean);

    await unlinkIfPresent(state.questionImageUrl, "/app/blog-images");
    await unlinkIfPresent(state.cmsUploadUrl, "/app/blog-images");
    await unlinkIfPresent(state.paperSourceUrl, "/app/paper-sources");

    if (state.toolkitFileId) {
      const toolkitRow = await queryOne("select file_url from partner_toolkit_files where id = $1", [state.toolkitFileId]);
      if (toolkitRow?.file_url) {
        await unlinkIfPresent(toolkitRow.file_url, "/app/toolkit-files");
      }
      await pool.query("delete from partner_toolkit_files where id = $1", [state.toolkitFileId]);
    }

    if (state.blogId) {
      await pool.query("delete from blogs where id = $1", [state.blogId]);
    }

    if (state.payoutId || state.payoutBulkId || qaAffiliateIds.length > 0) {
      await pool.query(
        "delete from commission_payouts where id = any($1::text[]) or affiliate_id = any($2::text[])",
        [
          [state.payoutId, state.payoutBulkId].filter(Boolean),
          qaAffiliateIds,
        ],
      );
    }

    if (state.leadId || qaAffiliateIds.length > 0) {
      await pool.query(
        "delete from partner_leads where id = $1 or affiliate_id = any($2::text[])",
        [state.leadId, qaAffiliateIds],
      );
    }

    if (qaAffiliateIds.length > 0) {
      await pool.query(
        "delete from partner_checklist_progress where affiliate_id = any($1::text[])",
        [qaAffiliateIds],
      );
      await pool.query(
        "delete from commission_slab_history where affiliate_id = any($1::text[])",
        [qaAffiliateIds],
      );
      await pool.query(
        "delete from referral_clicks where affiliate_code = any($1::text[])",
        [qaAffiliateCodes],
      );
      await pool.query(
        `update affiliates
            set referred_by_affiliate_id = null
          where id = any($1::text[])
             or referred_by_affiliate_id = any($1::text[])`,
        [qaAffiliateIds],
      );
    }

    await pool.query("delete from support_messages where id = $1", [state.supportMessageId]);
    await pool.query("delete from exam_sessions where id = $1", [state.examSessionId]);
    await pool.query("delete from attempts where id = $1", [state.attemptId]);

    if (state.paperId || state.secondPaperId) {
      await pool.query("delete from questions where paper_id = any($1::text[])", [[state.paperId, state.secondPaperId].filter(Boolean)]);
      await pool.query("delete from papers where id = any($1::text[])", [[state.paperId, state.secondPaperId].filter(Boolean)]);
    }

    if (state.subjectId) {
      await pool.query("delete from subjects where id = $1", [state.subjectId]);
    }
    if (state.courseId) {
      await pool.query("delete from courses where id = $1", [state.courseId]);
    }

    await pool.query("delete from referral_clicks where affiliate_code like $1", [`${prefix}%`]);
    await pool.query("delete from affiliates where code = $1", [oldAffiliateCode]);
    if (qaAffiliateIds.length > 0) {
      await pool.query("delete from affiliates where id = any($1::text[])", [qaAffiliateIds]);
    }
    await pool.query("delete from admin_allowlist where id = $1 or email = $1", [allowlistId]);
    await pool.query(
      "delete from admin_accounts where email like $1 or email in ($2, $3, $4)",
      [
        `%@meritlaunchers.test`,
        marketingAdminEmail,
        nestedMarketingAdminEmail,
        adminManagedEmail,
      ],
    );
    await pool.query("delete from users where email = $1", [studentEmail]);
  } finally {
    await pool.end();
  }
}

const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlH0d8AAAAASUVORK5CYII=",
  "base64",
);

const samplePdfBytes = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n");

async function evictPriorQaOrphans() {
  const rows = await pool.query(
    "select id, code from affiliates where login_email like $1",
    ["%@meritlaunchers.test"],
  );
  const ids = rows.rows.map((r) => r.id).filter(Boolean);
  const codes = rows.rows.map((r) => r.code).filter(Boolean);
  if (ids.length > 0) {
    await pool.query("delete from commission_payouts where affiliate_id = any($1::text[])", [ids]);
    await pool.query("delete from partner_leads where affiliate_id = any($1::text[])", [ids]);
    await pool.query("delete from partner_checklist_progress where affiliate_id = any($1::text[])", [ids]);
    await pool.query("delete from commission_slab_history where affiliate_id = any($1::text[])", [ids]);
    if (codes.length > 0) {
      await pool.query("delete from referral_clicks where affiliate_code = any($1::text[])", [codes]);
    }
    await pool.query(
      "update affiliates set referred_by_affiliate_id = null where referred_by_affiliate_id = any($1::text[])",
      [ids],
    );
    await pool.query("delete from affiliates where id = any($1::text[])", [ids]);
  }
  await pool.query("delete from admin_accounts where email like $1", ["%@meritlaunchers.test"]);
  await pool.query("delete from users where email like $1", ["%@meritlaunchers.test"]);
}

async function main() {
  await evictPriorQaOrphans();

  state.adminToken = adminJwt();

  try {
    await step("admin course create", async () => {
      const course = await request("POST", "/v1/admin/courses", {
        token: state.adminToken,
        body: {
          id: state.courseId,
          title: "QA Sweep Course",
          subtitle: "Temp",
          description: "Temporary production test course",
          validityDays: 30,
          highlights: ["qa"],
          heroLabel: "QA",
        },
        expectedStatus: 201,
      });
      return course.id || state.courseId;
    });

    await step("admin course video update", async () => {
      const updated = await request("PUT", `/v1/admin/courses/${encodeURIComponent(state.courseId)}/video`, {
        token: state.adminToken,
        body: {videoUrl: "https://example.com/video"},
      });
      return updated?.intro_video_url || "updated";
    });

    await step("admin subject create", async () => {
      const subject = await request("POST", "/v1/admin/subjects", {
        token: state.adminToken,
        body: {
          id: state.subjectId,
          courseId: state.courseId,
          title: "QA Sweep Subject",
          description: "Temp subject",
          sortOrder: 1,
          isPublished: true,
        },
        expectedStatus: 201,
      });
      return subject.id || state.subjectId;
    });

    await step("admin subject update", async () => {
      const updated = await request("PUT", `/v1/admin/subjects/${encodeURIComponent(state.subjectId)}`, {
        token: state.adminToken,
        body: {
          courseId: state.courseId,
          title: "QA Sweep Subject Updated",
          description: "Temp subject updated",
          sortOrder: 2,
          isPublished: true,
        },
      });
      return updated.title;
    });

    await step("admin import-paper", async () => {
      const parsed = await request("POST", "/v1/admin/import-paper", {
        token: state.adminToken,
        body: {
          fileName: "qa-import.txt",
          rawText: "1. What is 2+2?\n(A) 1\n(B) 2\n(C) 4\n(D) 5\nAnswer: C",
          importMode: "auto",
        },
      });
      return parsed?.paper?.title || parsed?.metadata?.mode || "parsed";
    });

    await step("admin paper create", async () => {
      await request("POST", "/v1/admin/papers", {
        token: state.adminToken,
        expectedStatus: 201,
        body: {
          paper: {
            id: state.paperId,
            courseId: state.courseId,
            subjectId: state.subjectId,
            title: "QA Sweep Paper",
            durationMinutes: 15,
            instructions: ["QA"],
            isFreePreview: true,
            isActive: true,
          },
          questions: [
            {
              id: `${state.paperId}-q1`,
              section: "General",
              prompt: "What is 2 + 2?",
              options: ["1", "2", "4", "5"],
              correctIndex: 2,
              marks: 3,
              negativeMarks: 1,
              attachments: [],
              optionAttachments: [[], [], [], []],
            },
          ],
        },
      });
      return state.paperId;
    });

    await step("admin paper update", async () => {
      await request("PUT", `/v1/admin/papers/${encodeURIComponent(state.paperId)}`, {
        token: state.adminToken,
        body: {
          paper: {
            id: state.paperId,
            courseId: state.courseId,
            subjectId: state.subjectId,
            title: "QA Sweep Paper Updated",
            durationMinutes: 20,
            instructions: ["QA", "Updated"],
            isFreePreview: true,
            isActive: true,
          },
          questions: [
            {
              id: `${state.paperId}-q1`,
              section: "General",
              prompt: "What is 2 + 2?",
              options: ["1", "2", "4", "5"],
              correctIndex: 2,
              marks: 3,
              negativeMarks: 1,
              attachments: [],
              optionAttachments: [[], [], [], []],
            },
            {
              id: `${state.paperId}-q2`,
              section: "General",
              prompt: "What is 3 + 3?",
              options: ["4", "5", "6", "7"],
              correctIndex: 2,
              marks: 3,
              negativeMarks: 1,
              attachments: [],
              optionAttachments: [[], [], [], []],
            },
          ],
        },
      });
      return "updated";
    });

    await step("admin affiliate create", async () => {
      const affiliate = await request("POST", "/v1/admin/affiliates", {
        token: state.adminToken,
        body: {name: "QA Sweep Legacy Affiliate", code: oldAffiliateCode, channel: "qa"},
        expectedStatus: 201,
      });
      return affiliate.code;
    });

    await step("admin allowlist get", async () => {
      const result = await request("GET", "/v1/admin/allowlist", {token: state.adminToken});
      return `${result.accounts?.length || 0} entries`;
    });

    await step("admin allowlist create", async () => {
      const result = await request("POST", "/v1/admin/allowlist", {
        token: state.adminToken,
        body: {label: prefix, email: allowlistId},
        expectedStatus: 201,
      });
      return result.id;
    });

    await step("admin allowlist delete", async () => {
      await request("DELETE", `/v1/admin/allowlist/${encodeURIComponent(allowlistId)}`, {
        token: state.adminToken,
      });
      return "deleted";
    });

    await step("admin admin-users get", async () => {
      const result = await request("GET", "/v1/admin/admin-users", {token: state.adminToken});
      return `${result.accounts?.length || 0} accounts`;
    });

    await step("admin admin-users create", async () => {
      const result = await request("POST", "/v1/admin/admin-users", {
        token: state.adminToken,
        body: {name: "QA Sweep Admin", email: adminManagedEmail, roleType: "admin"},
        expectedStatus: 201,
      });
      state.managedAdminAccountId = result.account.id;
      return state.managedAdminAccountId;
    });

    await step("admin admin-users delete", async () => {
      await request("DELETE", `/v1/admin/admin-users/${encodeURIComponent(state.managedAdminAccountId)}`, {
        token: state.adminToken,
      });
      return "disabled";
    });

    await step("admin question-images upload", async () => {
      const form = new FormData();
      form.append("file", new Blob([tinyPng], {type: "image/png"}), "qa.png");
      const result = await request("POST", "/v1/admin/question-images", {
        token: state.adminToken,
        body: form,
        isJson: false,
      });
      state.questionImageUrl = result.url;
      return result.url;
    });

    await step("admin paper-sources upload", async () => {
      const form = new FormData();
      form.append("file", new Blob([samplePdfBytes], {type: "application/pdf"}), "qa.pdf");
      const result = await request("POST", "/v1/admin/paper-sources", {
        token: state.adminToken,
        body: form,
        isJson: false,
      });
      state.paperSourceUrl = result.url;
      return result.url;
    });

    await step("student signup", async () => {
      const result = await request("POST", "/v1/auth/student/signup", {
        body: {
          email: studentEmail,
          password: studentPassword,
          platform: "web",
        },
      });
      const user = await queryOne("select id from users where email = $1", [studentEmail]);
      state.studentId = user.id;
      return result.ok ? "created" : "unexpected";
    });

    await step("student verify email", async () => {
      const token = issueActionToken({
        purpose: "student_verify_email",
        userId: state.studentId,
        email: studentEmail,
      }, "48h");
      await request("GET", `/v1/auth/verify-email?token=${encodeURIComponent(token)}`, {
        expectedStatus: [200, 302],
        raw: true,
      });
      return "verified";
    });

    await step("student password login", async () => {
      const result = await request("POST", "/v1/auth/password-login", {
        body: {email: studentEmail, password: studentPassword, platform: "web"},
      });
      state.studentToken = result.token;
      return result.user.id;
    });

    await step("student me phone", async () => {
      const result = await request("PUT", "/v1/me/phone", {
        token: state.studentToken,
        body: {phone: "9876501234"},
      });
      state.studentToken = result.token;
      return result.user.phone;
    });

    await step("student me email", async () => {
      const result = await request("PUT", "/v1/me/email", {
        token: state.studentToken,
        body: {email: studentEmail},
      });
      state.studentToken = result.token;
      return result.user.email;
    });

    await step("student me profile", async () => {
      const result = await request("PUT", "/v1/me/profile", {
        token: state.studentToken,
        body: {name: "QA Student", city: "Delhi", referralCode: null, signupSource: "web"},
      });
      return result.name;
    });

    await step("student paper get", async () => {
      const result = await request("GET", `/v1/papers/${encodeURIComponent(state.paperId)}`, {
        token: state.studentToken,
      });
      return `${result.id}:${result.questionCount}`;
    });

    await step("student attempts create", async () => {
      await request("POST", "/v1/attempts", {
        token: state.studentToken,
        body: {
          id: state.attemptId,
          courseId: state.courseId,
          paperId: state.paperId,
          answers: {q1: 2},
          sectionScores: {General: 3},
          score: 3,
          maxScore: 3,
          submittedAt: new Date().toISOString(),
        },
        expectedStatus: 201,
      });
      return state.attemptId;
    });

    await step("student exam-session create", async () => {
      await request("POST", "/v1/exam-sessions", {
        token: state.studentToken,
        body: {
          id: state.examSessionId,
          courseId: state.courseId,
          paperId: state.paperId,
          answers: {q1: 2},
          remainingSeconds: 600,
          currentQuestionIndex: 0,
          startedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        expectedStatus: 201,
      });
      return state.examSessionId;
    });

    await step("student exam-session delete", async () => {
      await request("DELETE", `/v1/exam-sessions/${encodeURIComponent(state.examSessionId)}`, {
        token: state.studentToken,
      });
      return "deleted";
    });

    await step("student support-message create", async () => {
      await request("POST", "/v1/support-messages", {
        token: state.studentToken,
        body: {
          id: state.supportMessageId,
          message: "QA support message",
          sentAt: new Date().toISOString(),
        },
        expectedStatus: 201,
      });
      return state.supportMessageId;
    });

    await step("student payments order", async () => {
      const result = await request("POST", "/v1/payments/razorpay/order", {
        token: state.studentToken,
        body: {courseId: state.courseId},
      });
      state.orderId = result.orderId;
      return result.orderId;
    });

    await step("student payments settle", async () => {
      const result = await request("POST", "/v1/payments/razorpay/settle", {
        token: state.studentToken,
        body: {courseId: state.courseId, orderId: state.orderId, platform: "web"},
      });
      return result.status || "ok";
    });

    await step("student payments verify invalid signature", async () => {
      const result = await request("POST", "/v1/payments/razorpay/verify", {
        token: state.studentToken,
        body: {
          courseId: state.courseId,
          orderId: state.orderId,
          paymentId: "pay_fake",
          signature: "bad-signature",
          platform: "web",
        },
        expectedStatus: 403,
      });
      return result.message;
    });

    if (HAS_CMS_CREDENTIALS) {
      await step("cms auth login", async () => {
        const result = await request("POST", "/v1/cms/auth/login", {
          body: {email: CMS_ADMIN_EMAIL, password: CMS_ADMIN_PASSWORD},
        });
        state.cmsToken = result.token;
        return "cms-token";
      });

      await step("cms blogs list", async () => {
        const result = await request("GET", "/v1/cms/admin/blogs", {token: state.cmsToken});
        return `${result.length || 0} blogs`;
      });

      await step("cms upload", async () => {
        const result = await request("POST", "/v1/cms/admin/upload", {
          token: state.cmsToken,
          body: {data: tinyPng.toString("base64"), ext: "png"},
        });
        state.cmsUploadUrl = result.url;
        return result.url;
      });

      await step("cms blog create", async () => {
        const result = await request("POST", "/v1/cms/admin/blogs", {
          token: state.cmsToken,
          body: {
            title: "QA Sweep Blog",
            slug: `${prefix}-blog`,
            content: "<p>qa</p>",
            featured_image: state.cmsUploadUrl,
            author: "QA",
            category: "QA",
            tags: ["qa"],
            seo_title: "QA Sweep Blog | Merit Launchers",
            h1_title: "QA Sweep Blog",
            meta_description: "QA description",
            meta_keywords: "qa, sweep",
            status: "published",
            publish_date: new Date().toISOString(),
          },
          expectedStatus: 201,
        });
        state.blogId = result.id;
        return result.id;
      });

      await step("cms blog update", async () => {
        const result = await request("PUT", `/v1/cms/admin/blogs/${encodeURIComponent(state.blogId)}`, {
          token: state.cmsToken,
          body: {
            title: "QA Sweep Blog Updated",
            slug: `${prefix}-blog`,
            content: "<p>qa updated</p>",
            featured_image: state.cmsUploadUrl,
            author: "QA",
            category: "QA",
            tags: ["qa", "updated"],
            seo_title: "QA Sweep Blog Updated | Merit Launchers",
            h1_title: "QA Sweep Blog Updated",
            meta_description: "QA description updated",
            meta_keywords: "qa, sweep, updated",
            status: "published",
            publish_date: new Date().toISOString(),
          },
        });
        return result.title;
      });
    } else {
      record("cms auth login", "skipped: CMS_ADMIN_EMAIL / CMS_ADMIN_PASSWORD not configured");
      record("cms blogs list", "skipped: CMS_ADMIN_EMAIL / CMS_ADMIN_PASSWORD not configured");
      record("cms upload", "skipped: CMS_ADMIN_EMAIL / CMS_ADMIN_PASSWORD not configured");
      record("cms blog create", "skipped: CMS_ADMIN_EMAIL / CMS_ADMIN_PASSWORD not configured");
      record("cms blog update", "skipped: CMS_ADMIN_EMAIL / CMS_ADMIN_PASSWORD not configured");
    }

    await step("marketing-admin account create via admin", async () => {
      const result = await request("POST", "/v1/admin/admin-users", {
        token: state.adminToken,
        body: {name: "QA Sweep Marketing Admin", email: marketingAdminEmail, roleType: "marketing_admin"},
        expectedStatus: 201,
      });
      state.marketingAdminAccountId = result.account.id;
      return result.account.id;
    });

    await step("marketing-admin set password", async () => {
      const token = issueActionToken({
        purpose: "set_password_invite",
        audience: "marketing_admin",
        accountId: state.marketingAdminAccountId,
        email: marketingAdminEmail,
      }, "7d");
      const result = await request("POST", "/v1/auth/reset-password", {
        body: {token, password: marketingAdminPassword},
      });
      return result.ok ? "password-set" : "unexpected";
    });

    await step("marketing-admin auth login", async () => {
      const result = await request("POST", "/v1/marketing-admin/auth/login", {
        body: {email: marketingAdminEmail, password: marketingAdminPassword},
      });
      state.marketingAdminToken = result.token;
      return result.admin.email;
    });

    await step("marketing-admin me", async () => {
      const result = await request("GET", "/v1/marketing-admin/me", {token: state.marketingAdminToken});
      return result.admin.email;
    });

    await step("marketing-admin me update", async () => {
      const result = await request("PUT", "/v1/marketing-admin/me", {
        token: state.marketingAdminToken,
        body: {name: "QA Sweep Marketing Admin Updated", email: marketingAdminEmail},
      });
      state.marketingAdminToken = result.token;
      return result.admin.name;
    });

    await step("marketing-admin admin-users get", async () => {
      const result = await request("GET", "/v1/marketing-admin/admin-users", {token: state.marketingAdminToken});
      return `${result.accounts?.length || 0} accounts`;
    });

    await step("marketing-admin admin-users create", async () => {
      const result = await request("POST", "/v1/marketing-admin/admin-users", {
        token: state.marketingAdminToken,
        body: {name: "QA Nested MA", email: nestedMarketingAdminEmail, roleType: "marketing_admin"},
        expectedStatus: 201,
      });
      state.nestedMarketingAdminAccountId = result.account.id;
      return result.account.id;
    });

    await step("marketing-admin admin-users delete", async () => {
      await request("DELETE", `/v1/marketing-admin/admin-users/${encodeURIComponent(state.nestedMarketingAdminAccountId)}`, {
        token: state.marketingAdminToken,
      });
      return "disabled";
    });

    await step("marketing-admin overview", async () => {
      const result = await request("GET", "/v1/marketing-admin/overview", {token: state.marketingAdminToken});
      return Object.keys(result).length;
    });

    let currentRates;
    await step("marketing-admin commission-rates get", async () => {
      const result = await request("GET", "/v1/marketing-admin/commission-rates", {token: state.marketingAdminToken});
      currentRates = result.rates;
      return `${currentRates.length} rates`;
    });

    await step("marketing-admin commission-rates put", async () => {
      const result = await request("PUT", "/v1/marketing-admin/commission-rates", {
        token: state.marketingAdminToken,
        body: {rates: currentRates},
      });
      return `${result.rates?.length || 0} rates`;
    });

    await step("marketing-admin partners create", async () => {
      const result = await request("POST", "/v1/marketing-admin/partners", {
        token: state.marketingAdminToken,
        body: partnerPayload({name: "QA Sweep Partner", email: partnerEmail}),
      });
      state.partnerId = result.id;
      state.partnerCode = result.code;
      return `${state.partnerId}:${state.partnerCode}`;
    });

    await step("partner set password", async () => {
      const token = issueActionToken({
        purpose: "set_password_invite",
        audience: "partner",
        affiliateId: state.partnerId,
        email: partnerEmail,
      }, "7d");
      const result = await request("POST", "/v1/auth/reset-password", {
        body: {token, password: partnerPassword},
      });
      return result.ok ? "password-set" : "unexpected";
    });

    await step("partner auth login", async () => {
      const result = await request("POST", "/v1/partner/auth/login", {
        body: {email: partnerEmail, password: partnerPassword},
      });
      state.partnerToken = result.token;
      return result.affiliate.code;
    });

    await step("student profile referral reassignment", async () => {
      const result = await request("PUT", "/v1/me/profile", {
        token: state.studentToken,
        body: {name: "QA Student", city: "Delhi", referralCode: state.partnerCode, signupSource: "web"},
      });
      return result.referralCode;
    });

    await step("marketing-admin partners get", async () => {
      const result = await request("GET", "/v1/marketing-admin/partners", {token: state.marketingAdminToken});
      return `${result.partners?.length || 0} partners`;
    });

    await step("marketing-admin partner detail", async () => {
      const result = await request("GET", `/v1/marketing-admin/partners/${encodeURIComponent(state.partnerId)}`, {
        token: state.marketingAdminToken,
      });
      return result.partner?.id || state.partnerId;
    });

    await step("marketing-admin partner update", async () => {
      const payload = partnerPayload({name: "QA Sweep Partner Updated", email: partnerEmail});
      payload.code = state.partnerCode;
      payload.referred_by_affiliate_id = null;
      const result = await request("PUT", `/v1/marketing-admin/partners/${encodeURIComponent(state.partnerId)}`, {
        token: state.marketingAdminToken,
        body: payload,
      });
      return result.success ? "updated" : "unexpected";
    });

    await step("marketing-admin payouts get", async () => {
      const result = await request("GET", "/v1/marketing-admin/payouts", {token: state.marketingAdminToken});
      return `${result.payouts?.length || 0} payouts`;
    });

    await step("marketing-admin payouts generate", async () => {
      const result = await request("POST", "/v1/marketing-admin/payouts/generate", {
        token: state.marketingAdminToken,
        body: {month: payoutMonth},
      });
      return `${result.generated?.length || 0} generated`;
    });

    await step("marketing-admin temp payouts seed", async () => {
      state.payoutId = `pay_${prefix}_1`;
      state.payoutBulkId = `pay_${prefix}_2`;
      await pool.query(
        `insert into commission_payouts
          (id, affiliate_id, month, gross_revenue, weighted_commission_rate, commission_amount, status)
         values
          ($1,$3,$5,1000,10,100,'pending'),
          ($2,$4,$5,2000,10,200,'pending')`,
        [state.payoutId, state.payoutBulkId, state.partnerId, state.partnerId, payoutMonth],
      );
      return "seeded";
    });

    await step("marketing-admin payout pay", async () => {
      const result = await request("PUT", `/v1/marketing-admin/payouts/${encodeURIComponent(state.payoutId)}/pay`, {
        token: state.marketingAdminToken,
        body: {paid_amount: 100, notes: "qa"},
      });
      return result.success ? "paid" : "unexpected";
    });

    await step("marketing-admin payout bulk-pay", async () => {
      const result = await request("PUT", "/v1/marketing-admin/payouts/bulk-pay", {
        token: state.marketingAdminToken,
        body: {payouts: [{id: state.payoutBulkId, paid_amount: 200, notes: "qa bulk"}]},
      });
      return `${result.updated?.length || 0} updated`;
    });

    await step("marketing-admin toolkit upload", async () => {
      const form = new FormData();
      form.append("title", "QA Toolkit");
      form.append("category", "Scripts");
      form.append("description", "QA toolkit file");
      form.append("file", new Blob([Buffer.from("qa toolkit")], {type: "text/plain"}), "qa.txt");
      const result = await request("POST", "/v1/marketing-admin/toolkit", {
        token: state.marketingAdminToken,
        body: form,
        isJson: false,
      });
      state.toolkitFileId = result.id;
      return result.id;
    });

    await step("marketing-admin toolkit get", async () => {
      const result = await request("GET", "/v1/marketing-admin/toolkit", {token: state.marketingAdminToken});
      return `${result.files?.length || 0} files`;
    });

    await step("partner me", async () => {
      const result = await request("GET", "/v1/partner/me", {token: state.partnerToken});
      return result.code;
    });

    await step("partner me update", async () => {
      const payload = partnerPayload({name: "QA Sweep Partner Updated", email: partnerEmail});
      const result = await request("PUT", "/v1/partner/me", {
        token: state.partnerToken,
        body: payload,
      });
      return result.partner?.login_email || partnerEmail;
    });

    await step("partner stats", async () => {
      const result = await request("GET", "/v1/partner/stats", {token: state.partnerToken});
      return `${result.totalStudents || 0} students`;
    });

    await step("partner students", async () => {
      const result = await request("GET", "/v1/partner/students", {token: state.partnerToken});
      return `${result.total || 0} total`;
    });

    await step("partner monthly", async () => {
      const result = await request("GET", "/v1/partner/monthly", {token: state.partnerToken});
      return `${result.months?.length || result.length || 0}`;
    });

    await step("partner courses", async () => {
      const result = await request("GET", "/v1/partner/courses", {token: state.partnerToken});
      return `${result.courses?.length || result.length || 0}`;
    });

    await step("partner payouts", async () => {
      const result = await request("GET", "/v1/partner/payouts", {token: state.partnerToken});
      return `${result.payouts?.length || result.length || 0}`;
    });

    await step("partner leaderboard", async () => {
      const result = await request("GET", "/v1/partner/leaderboard", {token: state.partnerToken});
      return `${result.partners?.length || result.length || 0}`;
    });

    await step("partner milestones", async () => {
      const result = await request("GET", "/v1/partner/milestones", {token: state.partnerToken});
      return `${result.milestones?.length || result.length || 0}`;
    });

    await step("partner platform-stats", async () => {
      const result = await request("GET", "/v1/partner/platform-stats", {token: state.partnerToken});
      return `${Object.keys(result).length} sections`;
    });

    await step("partner toolkit", async () => {
      const result = await request("GET", "/v1/partner/toolkit", {token: state.partnerToken});
      return `${result.files?.length || result.length || 0}`;
    });

    await step("partner leads get", async () => {
      const result = await request("GET", "/v1/partner/leads", {token: state.partnerToken});
      return `${result.leads?.length || result.length || 0}`;
    });

    await step("partner lead create", async () => {
      const result = await request("POST", "/v1/partner/leads", {
        token: state.partnerToken,
        body: {
          name: "QA Lead",
          phone: "9998887776",
          email: `${prefix}-lead@meritlaunchers.test`,
          city: "Delhi",
          interest_exam: "CUET",
          status: "new",
          notes: "QA lead",
          priority: "medium",
        },
        expectedStatus: 200,
      });
      state.leadId = result.lead.id;
      return state.leadId;
    });

    await step("partner lead update", async () => {
      const result = await request("PUT", `/v1/partner/leads/${encodeURIComponent(state.leadId)}`, {
        token: state.partnerToken,
        body: {
          status: "contacted",
          notes: "QA lead updated",
          priority: "high",
        },
      });
      return result.lead.status;
    });

    await step("partner checklist complete", async () => {
      const result = await request("POST", `/v1/partner/checklist/${encodeURIComponent("profile")}/complete`, {
        token: state.partnerToken,
      });
      return result.success ? "completed" : "unexpected";
    });

    await step("marketing-admin pending seed via public join", async () => {
      await request("POST", "/v1/partner/join", {
        body: joinPayload({name: "QA Pending Parent", email: pendingParentEmail, referrerCode: "ADMIN"}),
      });
      const row = await queryOne("select id from affiliates where login_email = $1", [pendingParentEmail]);
      state.pendingParentId = row.id;
      return row.id;
    });

    await step("marketing-admin pending get", async () => {
      const result = await request("GET", "/v1/marketing-admin/pending", {token: state.marketingAdminToken});
      return `${result.pending?.length || 0} pending`;
    });

    await step("marketing-admin pending bulk approve", async () => {
      const result = await request("POST", "/v1/marketing-admin/pending/bulk-approve", {
        token: state.marketingAdminToken,
        body: {ids: [state.pendingParentId]},
      });
      return `${result.approved?.length || 0} approved`;
    });

    await step("partner child pending seed via public join", async () => {
      await request("POST", "/v1/partner/join", {
        body: joinPayload({name: "QA Pending Child", email: pendingChildEmail, referrerCode: state.partnerCode}),
      });
      const row = await queryOne("select id from affiliates where login_email = $1", [pendingChildEmail]);
      state.pendingChildId = row.id;
      return row.id;
    });

    await step("partner pending get", async () => {
      const result = await request("GET", "/v1/partner/pending", {token: state.partnerToken});
      return `${result.pending?.length || 0} pending`;
    });

    await step("partner pending approve", async () => {
      const result = await request("POST", `/v1/partner/pending/${encodeURIComponent(state.pendingChildId)}/approve`, {
        token: state.partnerToken,
        body: {},
      });
      return result.success ? "approved" : "unexpected";
    });

    await step("partner network", async () => {
      const result = await request("GET", "/v1/partner/network", {token: state.partnerToken});
      return `${result.subPartners?.length || 0} roots`;
    });

    await step("partner sub-partner detail", async () => {
      const result = await request("GET", `/v1/partner/sub-partners/${encodeURIComponent(state.pendingChildId)}`, {
        token: state.partnerToken,
      });
      return result.partner?.id || state.pendingChildId;
    });

    await step("partner sub-partner update", async () => {
      const child = await queryOne("select * from affiliates where id = $1", [state.pendingChildId]);
      const payload = {
        ...partnerPayload({name: "QA Pending Child Updated", email: pendingChildEmail}),
        code: child.code,
        associate_id: child.associate_id,
      };
      const result = await request("PUT", `/v1/partner/sub-partners/${encodeURIComponent(state.pendingChildId)}`, {
        token: state.partnerToken,
        body: payload,
      });
      return result.partner?.id || state.pendingChildId;
    });

    await step("marketing-admin network", async () => {
      const result = await request("GET", "/v1/marketing-admin/network", {token: state.marketingAdminToken});
      return `${result.tree?.length || 0} roots`;
    });

    await step("partner change-password", async () => {
      const result = await request("POST", "/v1/partner/change-password", {
        token: state.partnerToken,
        body: {current_password: partnerPassword, new_password: partnerPassword2},
      });
      return result.success ? "changed" : "unexpected";
    });

    await step("partner relogin after password change", async () => {
      const result = await request("POST", "/v1/partner/auth/login", {
        body: {email: partnerEmail, password: partnerPassword2},
      });
      state.partnerToken = result.token;
      return "relogin-ok";
    });

    await step("marketing-admin toolkit delete", async () => {
      const result = await request("DELETE", `/v1/marketing-admin/toolkit/${encodeURIComponent(state.toolkitFileId)}`, {
        token: state.marketingAdminToken,
      });
      state.toolkitFileId = null;
      return result.success ? "deleted" : "unexpected";
    });

    await step("marketing-admin partner delete blocked by history", async () => {
      try {
        await request("DELETE", `/v1/marketing-admin/partners/${encodeURIComponent(state.partnerId)}`, {
          token: state.marketingAdminToken,
          expectedStatus: 409,
        });
      } catch (error) {
        throw new Error(`Expected a 409 conflict when deleting a partner with history. ${error.message || error}`);
      }
      return "blocked-as-expected";
    });

    await step("marketing-admin deletable partner create", async () => {
      const result = await request("POST", "/v1/marketing-admin/partners", {
        token: state.marketingAdminToken,
        body: partnerPayload({
          name: "QA Sweep Deletable Partner",
          email: `${prefix}-deletable@meritlaunchers.test`,
        }),
      });
      state.deletablePartnerId = result.id;
      state.deletablePartnerCode = result.code;
      return `${state.deletablePartnerId}:${state.deletablePartnerCode}`;
    });

    await step("marketing-admin partner delete", async () => {
      const deletedId = state.deletablePartnerId;
      const result = await request("DELETE", `/v1/marketing-admin/partners/${encodeURIComponent(deletedId)}`, {
        token: state.marketingAdminToken,
      });
      state.deletedPartnerId = deletedId;
      state.deletablePartnerId = null;
      state.deletablePartnerCode = null;
      return result.success ? "deleted" : "unexpected";
    });

    await step("marketing-admin deleted partner detail returns 404", async () => {
      const deletedId = state.deletedPartnerId;
      if (deletedId) {
        await request("GET", `/v1/marketing-admin/partners/${encodeURIComponent(deletedId)}`, {
          token: state.marketingAdminToken,
          expectedStatus: 404,
        });
        state.deletedPartnerId = null;
        return "404";
      }
      throw new Error("No deleted partner id was recorded for the 404 verification.");
    });

    await step("admin paper delete", async () => {
      await request("DELETE", `/v1/admin/papers/${encodeURIComponent(state.paperId)}`, {
        token: state.adminToken,
      });
      state.paperId = null;
      return "deleted";
    });

    await step("admin subject delete", async () => {
      await request("DELETE", `/v1/admin/subjects/${encodeURIComponent(state.subjectId)}`, {
        token: state.adminToken,
      });
      state.subjectId = null;
      return "deleted";
    });

    if (HAS_CMS_CREDENTIALS && state.blogId) {
      await step("cms blog delete", async () => {
        await request("DELETE", `/v1/cms/admin/blogs/${encodeURIComponent(state.blogId)}`, {
          token: state.cmsToken,
        });
        state.blogId = null;
        return "deleted";
      });
    } else {
      record("cms blog delete", "skipped: CMS blog record was not created");
    }

    await step("student logout", async () => {
      const result = await request("POST", "/v1/auth/logout", {
        token: state.studentToken,
        body: {},
      });
      return result.ok ? "revoked" : "unexpected";
    });

    const failed = results.filter((item) => item.status === "failed");
    console.log(JSON.stringify({
      ok: failed.length === 0,
      total: results.length,
      passed: results.filter((item) => item.status === "passed").length,
      failed: failed.length,
      results,
    }, null, 2));
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error.message || String(error),
    results,
  }, null, 2));
  process.exitCode = 1;
});
