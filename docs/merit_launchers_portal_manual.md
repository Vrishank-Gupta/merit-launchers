# Merit Launchers Internal Portal Manual

## Purpose

This document is the internal operating manual for every major Merit Launchers portal:
- marketing website
- student portal
- admin CMS
- marketing admin console
- partner portal

It is intended for internal use by product, operations, content, support, and marketing teams.

## Live URLs

- Main website: `https://meritlaunchers.com/`
- Student portal: `https://meritlaunchers.com/portal/`
- Admin CMS: `https://meritlaunchers.com/admin/`
- Marketing admin: `https://meritlaunchers.com/marketing-admin/login`
- Partner login: `https://meritlaunchers.com/partner/login`
- API health: `https://meritlaunchers.com/health`

## Personas

### Student

Primary goals:
- sign in
- browse courses and subjects
- access purchased or free preview papers
- attempt tests
- review results and progress

Entry points:
- marketing website
- student portal on web
- Android app

### Admin CMS

Primary goals:
- manage papers and questions
- manage subject hierarchy under courses
- import papers from source files
- edit course content
- manage blogs and support

Current configured admin username:
- `info@meritlaunchers.com`

Password:
- managed in environment configuration
- do not distribute inside versioned documents

### Marketing Admin

Primary goals:
- approve and manage partners
- inspect conversion activity
- manage toolkit files
- manage commission settings and payouts
- monitor marketing funnel performance

Current configured marketing admin username:
- `marketing@meritlaunchers.com`

Password:
- managed in environment configuration
- do not distribute inside versioned documents

### Partner

Primary goals:
- log in
- track dashboard performance
- manage leads and follow-up
- access playbooks and toolkit assets
- inspect commission and network data

Login:
- each partner gets their own credentials
- login URL: `https://meritlaunchers.com/partner/login`

## Marketing Website

### Purpose

The public website is the top-level entry point for:
- SEO traffic
- course discovery
- blog traffic
- contact and support discovery
- partner recruitment

### Key pages

- home
- about
- contact
- blog listing
- blog detail
- fee structure
- FAQ
- policy pages
- course landing pages

### Footer quick links

The live footer now includes:
- Home
- About Us
- Blog
- Contact Us
- FAQ
- Fee Structure
- Admin Portal
- Marketing Portal
- Partner Login

### Blog system

Blogs are served from the backend CMS table and rendered on the website.

Current local content state includes five enhanced published blogs plus the live blog API integration.

## Student Portal

### Purpose

The student portal is the authenticated workspace for learning and testing.

### Sign-in modes

- Google sign-in
- OTP sign-in
- local dev bypass in dev-only flows

### Core student features

- course browsing
- subject grouping inside courses
- free preview paper access
- purchased paper access
- test session start and resume
- question navigation
- results and progress
- support messages

### Subject-aware CUET structure

CUET is now grouped as:
- course -> subject -> paper -> question

Representative live CUET subjects:
- Accountancy
- Biology
- Business studies
- Chemistry
- Economics
- English
- General Aptitude Test
- Geography
- Hindi
- History
- Mathematics
- Physics
- Political science
- Psychology
- Sociology

### Question and math handling

The portal supports mixed rich text and math content.

Math-heavy papers were imported accuracy-first. Some difficult papers, especially Mathematics, were curated partial imports rather than guessed full imports.

## Admin CMS

### Purpose

The admin CMS is the operational control panel for educational content.

### Core capabilities

- add and edit courses
- add and edit subjects inside a course
- add and edit papers inside a subject
- add and edit questions
- import question papers from file sources
- review and fix imported questions before saving
- manage blogs
- view support-related data

### Current paper hierarchy support

Supported structure:
- course
- subject
- paper
- question

This is fully wired into both admin and student experiences.

### Paper import workflow

Import sources currently handled through the pipeline:
- DOCX
- TXT
- text PDFs
- OCR-recovered PDFs through one-off tooling

The admin UI supports:
- subject-aware paper creation
- importing into editable draft state
- live draft/editor sync
- answer correction before publish

### CUET import status

Current imported CUET totals:
- 211 papers
- 9767 questions
- 21 subjects

The final per-subject and per-paper status is tracked in:
- `docs/cuet_final_import_summary.md`
- `docs/cuet_final_import_summary.json`
- `docs/cuet_skipped_questions.json`

### Known import caveat

Some question numbers were intentionally skipped rather than guessed where:
- image quality was too poor
- math notation was corrupted
- figures were missing
- OCR boundaries were unreliable

This is deliberate and accuracy-preserving.

## Marketing Admin Portal

### Purpose

The marketing admin console is the internal operating system for partner-led acquisition.

### Major sections

- Overview
- Partners
- Network
- Pending
- Payouts
- Commission Rates
- Toolkit

### Overview

The overview highlights:
- partner funnel performance
- pending actions
- lifecycle visibility
- activation and health insights

### Partners

Admin can:
- create a partner
- edit partner records
- inspect partner details
- review referral code and login identity

### Pending

Admin can:
- inspect pending partner requests
- bulk approve pending entries

### Payouts

Admin can:
- inspect payout queue
- mark payouts processed
- manage payout operations

### Commission Rates

Admin can:
- view and update commission rates
- control type-based payout settings

### Toolkit

Admin can:
- upload partner toolkit files
- remove toolkit files
- manage internal enablement assets

## Partner Portal

### Purpose

The partner portal is the daily operating workspace for approved partners.

### Main sections

- Dashboard
- Students
- Sales
- Commission
- Leaderboard
- Milestones
- Leads
- Toolkit
- Network
- Account

### Dashboard

The dashboard includes:
- activation guidance
- next actions
- health and lifecycle indicators
- quick operational summaries

### Leads

Partners can:
- track leads
- update lead stages
- maintain follow-up workflow

### Toolkit

Partners can access:
- scripts
- playbooks
- shared assets
- downloadable support material

### Network

Partners can inspect:
- network relationships
- referred students or partner tree views where enabled

## Data and Deployment Notes

### Production stack

Production is currently hosted on a VPS with:
- Docker Compose
- PostgreSQL
- Node API
- Nginx
- static bundles under `deploy/admin-web`

### Important production fact

The production database was rebuilt cleanly during deployment because the old VPS Postgres data directory had a catalog corruption issue. The live system is now on a healthy rebuilt database and the current content set has been restored from local state.

### Production content state now

- courses: 3
- subjects: 21
- papers: 211
- questions: 9767
- blogs: 5
- affiliates: 12

## Operational Login Reference

### Admin CMS

- URL: `https://meritlaunchers.com/admin/`
- Username: `info@meritlaunchers.com`
- Password source: production `server.env`

### Marketing Admin

- URL: `https://meritlaunchers.com/marketing-admin/login`
- Username: `marketing@meritlaunchers.com`
- Password source: production `server.env`

### Partner Login

- URL: `https://meritlaunchers.com/partner/login`
- Username/password: per-partner credentials

### Student

- URL: `https://meritlaunchers.com/portal/`
- Auth modes: Google and OTP

## Internal Reports and Recovery Assets

Keep these for operations and future recovery work:
- `docs/cuet_final_import_summary.md`
- `docs/cuet_final_import_summary.json`
- `docs/cuet_skipped_questions.json`
- `scripts/import_cuet_bundle.js`
- `scripts/recover_cuet_skipped_with_ocr.py`
- `server/scripts/recover_cuet_skipped_with_gemini.mjs`

## What Was Deliberately Not Versioned

These are intentionally treated as disposable:
- OCR scratch PNG renders
- temporary GPU/OCR test files
- disposable local build folders
- local certificates
- local database files

## Recommended Next Checks

- verify CUET subject browsing in the student portal
- verify paper editor behavior in admin for a few CUET subjects
- rotate production admin passwords if the live environment is public-facing
- replace mock OTP with a real provider before broad public release
