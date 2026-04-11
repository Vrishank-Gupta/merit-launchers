# CMS Admin + Student Portal Flow/Test Matrix

Google login is intentionally excluded from this matrix per the current release decision. Password login and session/API behavior are covered.

## Shared Platform

| Area | Flows / states / paths / integrations | Test coverage |
| --- | --- | --- |
| Bootstrap | `/api/v1/bootstrap`, public bootstrap, authenticated admin bootstrap, authenticated student bootstrap, courses, subjects, papers, question counts, current student, purchases, attempts, sessions, support messages | `api_repository_contract_test.dart`, `run-prod-web-smoke.ps1`, optional `run-prod-auth-smoke.ps1` |
| API client | JSON request headers, bearer token, timeout/network wrapper, localhost Android fallback, invalid HTML/non-JSON response handling, unauthorized hook | `api_client_test.dart`, `run-prod-web-smoke.ps1` |
| Service worker/cache | `/admin/flutter_bootstrap.js`, `/portal/flutter_bootstrap.js`, disabled service-worker settings for deterministic deploys | `run-prod-web-smoke.ps1` |
| Math rendering input | escaped dollar repair, inline/display delimiters, raw LaTeX commands, matrices, determinants, arrays/cases, fractions, roots, powers, Greek letters, sums, integrals | `math_content_parser_test.dart`, `math_formatter_test.dart` |
| Rich text fallback | powers, subscripts, basic `<b>`, `<i>`, `<u>` editor tags | `math_formatter_test.dart` |
| Image attachments | question-level images, option-level images, API persistence, student/admin preview contract | `portal_workflow_test.dart`, `api_repository_contract_test.dart`, `run-prod-smoke.ps1` |
| Source documents | source PDF/doc metadata on papers, persisted through admin update | `api_repository_contract_test.dart`, `run-prod-smoke.ps1` |

## CMS Admin Portal

| Area | Flows / states / paths / integrations | Test coverage |
| --- | --- | --- |
| Admin auth entry | password login screen, email field, password field, forgot password UX, validation message | `auth_entry_widget_test.dart`, optional `run-prod-auth-smoke.ps1` |
| Admin shell | dashboard tabs, navigation state, admin tab selection | `portal_workflow_test.dart` covers controller state; widget smoke remains future candidate |
| Content management | list courses, list subjects, list papers, display metadata-only question counts, edit paper, save/update paper, delete paper | `portal_workflow_test.dart`, `api_repository_contract_test.dart`, `run-prod-smoke.ps1` |
| Paper editor | add paper, update paper, preserve instructions, duration, free-preview flag, source doc metadata, question order, math segments, attachments, option attachments | `portal_workflow_test.dart`, `api_repository_contract_test.dart`, `run-prod-smoke.ps1` |
| Question editor | prompt text, options, correct option, section, math normalization, attachments, option attachments, formatting tags | `portal_workflow_test.dart`, `math_content_parser_test.dart`, `math_formatter_test.dart` |
| Clipboard image helper | web clipboard read/paste helper compiles cleanly; native stub compiles cleanly | `run-qa.ps1` focused analyzer |
| Subjects | add subject, update subject, publish flag, sort order, delete subject, cascade papers/sessions/attempts locally | `portal_workflow_test.dart`, `api_repository_contract_test.dart` |
| Courses | add course, update intro video URL, preserve price, GST, purchase mode | `portal_workflow_test.dart`, `api_repository_contract_test.dart` |
| Affiliate/referral | add affiliate, code normalization, no-op invalid affiliate, API route | `portal_workflow_test.dart`, `api_repository_contract_test.dart` |
| Admin allowlist | load allowlist, add email/phone entry, remove entry, exact email unlock source | `portal_workflow_test.dart`, `api_repository_contract_test.dart`, optional `run-prod-auth-smoke.ps1` |
| Support desk | admin sends reply to a student thread, support message ownership | `portal_workflow_test.dart`, `api_repository_contract_test.dart` |
| Blog admin | list blogs, create/update/delete blog, upload blog image | Not yet in automated local gate; should be added when blog admin becomes release-blocking for portal launch |
| Import pipeline | upload/import paper endpoint, local/AI parser decision, paper drafts | Covered by production API smoke for persisted paper shape; parser-import-specific regression tests still belong to importer scripts |
| Admin accounts | managed admin/marketing-admin account invite/deactivate | Not yet automated locally; API/widget tests should be added once final account-management endpoints are frozen |

## Student Portal

| Area | Flows / states / paths / integrations | Test coverage |
| --- | --- | --- |
| Student auth entry | password/email screen, create account entry, forgot password, resend verification, empty form validation | `auth_entry_widget_test.dart`, optional `run-prod-auth-smoke.ps1` |
| Student onboarding/profile | profile save, name/city/referral code update, phone/email collection states | `api_repository_contract_test.dart` covers profile endpoint; direct controller state tests remain next expansion |
| Course catalog | course list, subject-based courses, full-course unlock courses, coming-soon/locked/free-preview states | `portal_workflow_test.dart` |
| Course purchase | full course purchase, duplicate purchase no-op, course unlock state | `portal_workflow_test.dart` |
| Subject purchase | CUET-style subject purchase, duplicate subject purchase no-op, subject unlock state | `portal_workflow_test.dart` |
| Admin-email student unlock | student with CMS-admin access gets all courses/subjects unlocked | Server payload and controller flag are covered indirectly; should be elevated with credential-backed `run-prod-auth-smoke.ps1` using an admin email student test account |
| Paper access | course-level filtering, subject-level filtering, free preview, locked premium papers | `portal_workflow_test.dart` |
| Paper loading | metadata-only paper not treated as loaded, forced fetch paper path, question count display | `portal_workflow_test.dart`, `api_repository_contract_test.dart` |
| Exam session | start session, resume session, save answer/current index/timer, discard session | `portal_workflow_test.dart`, `api_repository_contract_test.dart` |
| Attempt submission | score calculation, negative marking, max score, section scores, delete submitted session, persist attempt | `portal_workflow_test.dart`, `api_repository_contract_test.dart` |
| Reports/history | attempt list and score data source | `portal_workflow_test.dart` covers attempt creation; full report UI widget tests are future hardening |
| Support | student sends support message, trimming, student ownership, admin reply ownership | `portal_workflow_test.dart`, `api_repository_contract_test.dart` |
| Receipts/payments | demo purchase model, Razorpay order/verify/settle endpoints, receipt data | Purchase state covered in `portal_workflow_test.dart`; live Razorpay checkout is intentionally not automated in release gate |
| Images and math in papers | prompt image, option image, math segments, fallback formatting | `portal_workflow_test.dart`, `api_repository_contract_test.dart`, `math_content_parser_test.dart`, `math_formatter_test.dart`, `run-prod-smoke.ps1` |

## Production Gates

| Gate | Command | Blocks deploy |
| --- | --- | --- |
| Local release QA | `powershell -ExecutionPolicy Bypass -File .\deploy\run-qa.ps1` | Yes |
| Production API CRUD smoke | `powershell -ExecutionPolicy Bypass -File .\deploy\run-prod-smoke.ps1` | Yes in `deploy.ps1` |
| Production web/routing smoke | `powershell -ExecutionPolicy Bypass -File .\deploy\run-prod-web-smoke.ps1` | Yes when `deploy.ps1 -Web` is used |
| Production auth smoke | `powershell -ExecutionPolicy Bypass -File .\deploy\run-prod-auth-smoke.ps1` | Runs in deploy and skips safely unless QA credentials are configured |

## Known Intentional Gaps

- Google login automation is skipped.
- Real Razorpay checkout is not automated because it needs payment sandbox/test gateway setup.
- Blog admin and managed admin-account invite/deactivate are identified but not yet release-gated by tests.
- Importer script quality/content validation is separate from portal functionality tests; portal tests validate persisted paper shape and rendering contract, not source-paper correctness.
