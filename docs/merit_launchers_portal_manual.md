# Merit Launchers Platform Bible

## Purpose

This is the internal operating manual for the full Merit Launchers platform. It is meant to explain the complete system in one place:
- public marketing website
- student portal on web
- student app on Android
- admin CMS
- marketing admin console
- partner portal
- referral and attribution flows
- content hierarchy, imports, blogs, support, purchases, and reporting

This document is written as an internal reference for founders, product, content, support, operations, and marketing teams.

## Live Surfaces

- Main website: `https://meritlaunchers.com/`
- Student portal: `https://meritlaunchers.com/portal/`
- Admin CMS: `https://meritlaunchers.com/admin/`
- Marketing admin: `https://meritlaunchers.com/marketing-admin/login`
- Partner login: `https://meritlaunchers.com/partner/login`
- API health: `https://meritlaunchers.com/health`

## Platform Model

The platform has two major operating halves:
- student learning and testing
- partner-led acquisition and marketing operations

The educational content hierarchy is:
- course
- subject
- paper
- question

The main operational hierarchy is:
- marketing site brings traffic
- student signs in and explores courses
- free preview or purchase unlocks testing
- admin manages courses, subjects, papers, questions, blogs, students, affiliates, support
- marketing admin manages partners, payouts, commission rates, toolkit, pending approvals, and network performance
- partner portal runs outreach, tracking, leads, commissions, and sub-network visibility

## Personas

### Student

Main jobs:
- sign in
- complete onboarding
- browse available courses
- inspect subjects inside a course
- access free preview papers
- buy courses and unlock papers
- start tests
- resume tests across devices
- submit attempts
- review results and performance
- download receipts
- contact support
- manage profile information

### Admin CMS

Main jobs:
- manage courses
- manage subjects within each course
- manage papers within each subject
- manage questions within each paper
- import papers from files
- correct imported question wording and answers
- manage blogs
- inspect students
- manage affiliates
- handle support conversations
- manage platform-level settings

### Marketing Admin

Main jobs:
- approve partners
- create and edit partner records
- track partner lifecycle and health
- monitor attributed students, clicks, and revenue
- manage payout queue
- manage commission-rate slabs
- upload toolkit assets
- review partner network structure

### Partner

Main jobs:
- log in
- see activity dashboard
- follow onboarding checklist
- manage own lead pipeline
- track students and conversions
- review sales and commission
- access scripts and toolkit
- inspect personal network and sub-partners
- maintain account details

## Authentication and Entry Flows

### Student auth

Student auth supports:
- Google sign-in
- mobile OTP sign-in
- local dev bypass in dev-only environments

On web and mobile, the student app chooses the correct auth UI based on platform and environment.

### Student onboarding stages

After auth, the student can be routed through:
- phone verification after Google sign-in if phone is missing
- email collection after OTP sign-in if email is missing
- onboarding flow for first-time profile completion
- direct student dashboard if required profile fields already exist

### Admin auth

Admin access is role-based. Admins enter the Flutter admin surface at `/admin/`.

### Marketing admin auth

Marketing admins use a dedicated email/password login at `/marketing-admin/login`.

### Partner auth

Partners use dedicated partner credentials created and managed through marketing admin.

### Referral entry

Referral flows support:
- `/ref/:code`
- `/ref/:code/:channel`
- `/join/:code`

This allows the platform to:
- record clicks
- preserve channel attribution
- show partner referral context
- route prospects into the partner join flow

## Public Marketing Website

### Purpose

The public site is the first-touch surface for:
- search traffic
- course discovery
- blog discovery
- institutional credibility
- contact and support
- partner recruitment

### Main pages

The public marketing site includes:
- Home
- About
- Contact
- Blog listing
- Blog details
- Course landing pages for CLAT, CTET I, CTET II, DSSSB, CUET, SSC, NEET, JEE, IPMAT
- Fee Structure
- FAQ
- Important Tips
- Videos
- Return Policy
- Privacy Policy
- Terms & Conditions
- External Links
- Our Team

### Home page responsibilities

The homepage is responsible for:
- explaining the brand promise
- showing course categories and use cases
- driving students toward the portal or app
- driving partner interest
- offering trust and navigation to the rest of the marketing site

### Blog system

Blogs are stored in the backend `blogs` table and surfaced on:
- blog listing page
- blog detail page

Supported blog fields include:
- title
- slug
- HTML content
- featured image
- author
- category
- tags
- meta description
- publish status
- publish date
- view count

### Footer

The live footer now includes quick access to:
- Home
- About Us
- Blog
- Contact Us
- FAQ
- Fee Structure
- Admin Portal
- Marketing Portal
- Partner Login

This makes the website useful not only for public visitors but also for internal teams and partner users.

## Student Portal and Student App

### Surface model

The student experience exists on:
- web at `/portal/`
- mobile app through the Flutter app shell

The design language is shared, but layouts adapt by screen size.

### Top-level student areas

The student shell provides:
- Dashboard
- Support
- Profile
- Library

### Student dashboard

The dashboard is the operational home screen for a student. It is designed to answer:
- what should I do next
- what have I already purchased
- what tests are pending
- where is my progress moving

Dashboard capabilities include:
- summary stats such as active courses, purchases, attempts, and pending tests
- quick refresh of live content
- deep links to support and library
- pending exam cards with remaining questions and saved timer state
- course cards showing availability and whether a pending session already exists
- responsive layouts for web and mobile

### Course details

Each course detail page supports:
- full course overview
- purchase status awareness
- free preview visibility
- subject grouping when subjects exist
- flat paper listing fallback for old course structures without subjects
- entry into exam briefing before starting a paper

### Subject-aware paper browsing

The system now supports:
- `course -> subject -> paper -> question`

This is live in both admin and student experiences.

Students can:
- open a course
- browse subjects inside it
- open papers inside each subject
- see whether a paper is locked, previewable, or already available

### Free preview behavior

Papers can be marked as:
- free preview
- paid/unlocked after purchase

Students can use preview papers before purchasing a course, while the rest of the course remains protected.

### Exam briefing

Before entering a paper, the student sees an exam intro/briefing page showing:
- paper title
- instructions
- duration
- question count
- existing pending session if present
- resume option if a session already exists

### Exam player

The exam player is the core testing surface.

Capabilities include:
- current question display
- option selection
- question numbering and navigation
- answer persistence
- timer persistence
- save/resume support through `exam_sessions`
- submission flow
- support for rich text and math content

### Resume behavior

Exam sessions are saved with:
- answer map
- remaining seconds
- current question index
- timestamps

This allows a student to:
- leave a paper mid-way
- reopen it on web or app
- continue from the same state

### Submission and results

On submission, the platform creates an `attempt` and stores:
- answers
- section scores
- total score
- max score
- paper and course reference
- submission time

Result reporting includes:
- total score
- section-level breakdown
- question review
- performance reporting
- PDF-style report rendering logic for result summaries

### Math and rich content support

Question prompts and options support:
- text
- parsed rich segments
- inline math
- display math
- math-aware rendering in question view and reporting

This matters especially for:
- science papers
- quantitative papers
- mathematics papers

### Library

The library page acts as the student’s content control center.

Capabilities:
- list purchases
- show purchase date and receipt number
- open receipts
- show pending papers automatically
- resume saved tests
- surface access state cleanly for already purchased content

### Receipt page

The receipt surface provides:
- purchase details
- receipt number
- amount
- timestamp
- course linkage

This is important for support, finance, and user trust.

### Profile

Profile capabilities include:
- view profile details
- edit name, city, and contact fields
- complete missing onboarding information
- maintain referral code where applicable

### Support

Student support includes:
- message history
- sending new support messages
- admin/student role labeling in the thread
- persistence to the backend `support_messages` table

### Refresh and bootstrap behavior

The student app bootstraps from the API and restores:
- session
- profile
- courses
- subjects
- papers
- purchases
- attempts
- exam sessions
- support messages

If the session is invalid, the app can clear stale auth and re-bootstrap.

## Admin CMS

### Purpose

The admin CMS is the content and operations console for the educational side of the business.

### Top-level admin sections

The admin shell includes:
- Overview
- Content
- Students
- Affiliates
- Blog
- Support
- Settings

### Admin overview

The overview exists to provide an at-a-glance operational snapshot:
- platform activity
- revenue context
- content status
- content and student growth signals

### Content management

This is the most important admin module.

It supports:
- creating courses
- editing course titles, descriptions, price, validity, highlights, video URL, publish state
- adding subjects under a course
- assigning sort order and descriptions to subjects
- adding papers inside a subject
- setting paper duration
- setting free preview access
- editing instructions
- editing questions

### Paper editor

The paper editor is a full workflow, not just a form.

Capabilities include:
- subject-aware paper creation
- editable draft state
- question navigator
- selected-question editor
- live preview behavior
- manual correction before save
- question delete
- answer selection and correction
- support for text and math snippets

### Import workflow

The import pipeline supports:
- DOCX
- TXT
- text-extractable PDF
- OCR-assisted recovery for difficult PDF imports

The workflow is:
- upload a source document
- parse questions into draft items
- land them in the editable paper draft
- review prompt/options/correct answer
- save the paper only after review

### Math helper

The editor includes math helper/snippet insertion support.

This helps content teams insert:
- fractions
- roots
- powers
- calculus-style expressions
- inline formula text

### Subject hierarchy support

The admin portal now fully supports:
- course creation
- subject creation inside a course
- paper creation inside a subject

This is important for structured products like CUET, where one course contains many subjects and each subject contains many papers.

### Student management

The admin students section supports:
- student listing
- student profile review
- purchase visibility
- activity context

This is useful for support, issue triage, and operational debugging.

### Affiliate management

The admin affiliates section supports:
- affiliate listing
- operational review of affiliate records

This is the educational-side affiliate view, separate from the dedicated marketing admin console.

### Blog management

The blog module supports:
- create blog
- edit blog
- publish/unpublish state
- HTML content management
- meta description management
- category/tag management
- featured image support

### Support management

The support module supports:
- viewing student support threads
- reading message history
- replying as admin

### Settings

The settings area is used for platform-level operational adjustments and internal controls surfaced through the admin UI.

## Content Import and CUET Program

### CUET structure now live

The CUET course has been imported into the structured hierarchy using:
- 21 subjects
- 211 papers
- 9767 questions

### Final import reports

Final tracked reports are:
- `docs/cuet_final_import_summary.md`
- `docs/cuet_final_import_summary.json`
- `docs/cuet_skipped_questions.json`

### Accuracy approach

The import process was run accuracy-first.

That means:
- trustworthy questions were imported
- uncertain questions were skipped instead of guessed
- hard image/diagram/formula cases were logged
- some difficult mathematics papers were imported as curated partials rather than fake full papers

### Recovery tooling retained

Useful retained tooling:
- `scripts/import_cuet_bundle.js`
- `scripts/recover_cuet_skipped_with_ocr.py`
- `scripts/generate_cuet_import_summary.py`
- `server/scripts/recover_cuet_skipped_with_gemini.mjs`

These are worth keeping for future recovery or similar subject imports.

## Marketing Admin Console

### Purpose

The marketing admin console is the operating system for partner-led growth.

### Major sections

The marketing admin UI includes:
- Overview
- Partners
- Pending
- Commission Rates
- Payouts
- Toolkit
- Network

### Overview

The overview is an intelligence dashboard rather than a static report.

It shows:
- total partners
- pending payouts
- revenue influenced
- pending applications
- action queue
- lifecycle buckets
- top performers
- at-risk partners
- operational shortcuts into approvals, payouts, partners, and network views

### Partner lifecycle and health

The system tracks:
- lifecycle stage such as New, Active, High Performer, At Risk
- health score
- health band

This helps marketing operations know:
- who needs activation help
- who is performing strongly
- who is declining before revenue drops further

### Partners page

The partners page provides the operating table for partner management.

Capabilities:
- partner search
- lifecycle filter
- partner selection
- partner list with type, lifecycle, health, students, clicks, revenue, and open leads
- create partner
- open partner detail
- edit partner

### Partner creation and editing

Marketing admin can:
- create partner records
- set partner type
- set login email
- issue or reset password
- edit associate ID
- update bank details

### Pending approvals

The pending page is used to:
- review self-registered partner requests
- approve pending applications
- handle bulk approval

### Commission rates

Commission settings are managed by partner type.

Capabilities:
- view current rates
- update rates
- control type-based payout configuration

### Payouts

The payouts module supports:
- payout queue visibility
- payout generation
- payout review
- marking payouts as paid
- storing payment notes and settlement context

### Toolkit management

The toolkit module supports:
- uploading enablement assets
- categorizing files
- deleting outdated files
- maintaining the file library visible to partners

### Network view

The network module provides:
- referral tree visibility
- second-order partner awareness
- structural understanding of partner growth

## Partner Portal

### Purpose

The partner portal is the day-to-day execution surface for approved partners.

### Main sections

The partner sidebar includes:
- Dashboard
- My Students
- My Network
- Sales
- Commission
- Leaderboard
- Milestones
- Leads
- Toolkit
- Account

### Dashboard

The partner dashboard is designed to drive execution.

Capabilities:
- top metrics for students referred, revenue influenced, pending commission, conversion rate
- health score and lifecycle
- first 7 days plan checklist
- action queue
- quick setup fixes
- source/platform split
- open leads visibility
- milestone progress
- quick navigation to leads and toolkit

### First 7 days plan

This checklist helps new partners activate quickly.

Typical steps include:
- complete profile setup
- share first referral link
- begin outreach
- use scripts and toolkit assets

### Action queue

The dashboard uses rule-based guidance to show:
- where traffic is weak
- where leads are open but not followed up
- where conversion support is needed

### My Students

The students view helps partners understand who has come through them.

Capabilities:
- student listing
- joined-at tracking
- exam-interest summaries
- city/source patterns
- paid vs free awareness

### Sales

The sales view supports:
- revenue over time
- student counts over time
- course-wise performance
- tabular revenue summaries

### Commission

The commission view supports:
- commission history
- pending vs paid visibility
- payout awareness
- slab context

### Leaderboard

The leaderboard lets partners compare their performance against others in the system.

### Milestones

The milestones view shows:
- total student count against defined targets
- next milestone gap
- progress bars and goal-state movement

### Leads

The leads module is a real workflow tool, not just a list.

Capabilities:
- add lead
- edit lead
- search leads
- filter by status
- filter by priority
- set next follow-up date/time
- add notes
- update lead stage inline

Lead statuses include:
- New
- Contacted
- Interested
- Follow-up due
- Converted
- Dropped

Lead priorities include:
- High
- Normal
- Low

### Toolkit

The partner toolkit includes:
- scripts
- playbooks
- objection-handling content
- copy-to-clipboard helpers
- downloadable files uploaded by marketing admin

### Network

The network view supports:
- viewing sub-partners
- network growth visibility
- partner-generated downstream structure

### Sub-partner detail

The sub-detail view surfaces:
- students
- revenue
- payouts
- channel clicks
- recent students

### Account

The account section supports:
- viewing identity data
- bank details or payout details
- maintaining partner information

## Referral and Attribution System

### Referral codes

Referral codes are used across:
- partner join flows
- student attribution
- click tracking
- revenue attribution

### Click tracking

The system records referral clicks with:
- affiliate code
- channel
- IP hash
- click date
- conversion flags

### Attribution effects

Referral context influences:
- student signup attribution
- purchase attribution
- partner reporting
- marketing admin analytics

## Backend Features and Data Model

### Core data tables

Key platform tables include:
- `users`
- `admin_allowlist`
- `affiliates`
- `courses`
- `subjects`
- `papers`
- `questions`
- `purchases`
- `login_events`
- `attempts`
- `exam_sessions`
- `support_messages`
- `blogs`
- `commission_slab_history`
- `referral_clicks`
- `commission_payouts`
- `partner_toolkit_files`
- `partner_type_commissions`
- `partner_checklist_progress`
- `partner_leads`

### Student-side backend responsibilities

The backend handles:
- bootstrap payload
- auth
- profile update
- purchases
- attempts
- exam sessions
- support messages
- blog content

### Marketing-side backend responsibilities

The backend also handles:
- partner authentication
- partner dashboard stats
- marketing admin overview
- partner CRUD
- pending approval queue
- payout generation
- payout status updates
- commission rate management
- toolkit file persistence
- referral tracking
- checklist progress
- partner leads

## Operations Notes

### Production content state

Current live content state:
- courses: 3
- subjects: 21
- papers: 211
- questions: 9767
- blogs: 5
- affiliates: 12

### Deployment shape

Production runs on a VPS using:
- Docker Compose
- PostgreSQL
- Node API
- Nginx
- static bundles from `deploy/admin-web`

### Recovery note

Production Postgres had a catalog corruption issue during the subject-aware rollout. The live server was rebuilt cleanly and the content state was restored from local data.

### Cleanup convention

Keep:
- reports
- OCR text caches
- import scripts
- recovery scripts

Do not keep:
- disposable PNG scratch renders
- local build trash
- local certificates
- random deployment tarballs after use

## Internal Access Snapshot

The generated PDF version of this manual includes the current configured login credentials pulled from local `server.env`.

That PDF is for internal circulation only and should not be committed into git.

## Recommended Use of This Manual

Use this document when:
- onboarding a new internal team member
- training content operators
- walking marketing through partner tooling
- debugging portal responsibilities
- explaining how data flows from referral to signup to purchase to reporting
- understanding which surface owns which operational task

## Appendix: High-Value Files

- `lib/app/app.dart`
- `lib/app/app_controller.dart`
- `lib/features/student/student_shell.dart`
- `lib/features/admin/admin_shell.dart`
- `marketing/src/App.tsx`
- `marketing/src/lib/partnerApi.ts`
- `server/src/index.js`
- `server/sql/init.sql`
- `docs/cuet_final_import_summary.md`
- `docs/cuet_final_import_summary.json`
- `docs/cuet_skipped_questions.json`
