# Paper Import Pipeline

## Goal

Turn CMS paper upload into a real import workspace:

1. Upload `DOCX`, searchable `PDF`, or scanned `PDF/image`
2. Parse into a draft import
3. Review unresolved / low-confidence questions
4. Edit, approve, and publish into `papers` + `questions`

## Why this exists

The current direct-import flow is too fragile for:

- maths equations
- match-the-following layouts
- matrix / table formatting
- scanned PDFs
- solved papers with answer sections and mixed page layouts

We need a staged workflow instead of parsing straight into production.

## Data model

### `paper_import_drafts`

Stores one import session:

- source file metadata
- parser mode and source kind
- draft status
- confidence summary
- paper-level instructions / targeting
- debug references

### `paper_import_draft_questions`

Stores editable parsed questions:

- question number
- section
- prompt / options
- segment payloads for math-aware rendering later
- correct index
- confidence and parser notes
- review state

## Current implementation status

Implemented:

- draft tables in runtime schema and `init.sql`
- create draft endpoint
- list draft endpoint
- fetch single draft endpoint
- update draft endpoint

Existing parser reused:

- local heuristic parser
- hybrid AI OCR import
- import confidence scoring

## Proposed flow

### Phase 1

- Upload file
- Parse with current hybrid importer
- Save result into `paper_import_drafts`
- Re-open draft later without re-uploading

### Phase 2

- Draft review list in CMS
- Status pills: `draft`, `review`, `ready`, `published`
- Open draft editor with unresolved question counter
- Filter by section / unresolved / low confidence

### Phase 3

- Publish draft into live `papers` and `questions`
- Option to replace an existing paper
- Validation gate before publish:
  - all questions have 4 options
  - all correct answers resolved
  - no empty prompts

### Phase 4

- Math-aware segmentation preservation
- richer DOCX layout extraction
- PDF block reconstruction
- answer-key + solved-answer hybrid parser profiles by exam type

## Review UI direction

### Draft list

- file name
- target course / subject
- parse status
- total questions
- unresolved count
- parser mode
- last updated

### Draft detail

- left: import/source summary
- center: question editor list
- right: review insights
  - unresolved answers
  - malformed options
  - formatting risk
  - section counts

### Question editor

- source question number
- section picker
- prompt editor
- option editor
- correct answer picker
- confidence badge
- parser notes

## Publish rules

- `ready` means parser output is strong enough to review efficiently
- `published` should only happen through an explicit publish action
- imported drafts should never auto-publish

## NDA-specific benefit

This pipeline is the fix for the NDA/CUET pain:

- parse into draft
- manually repair only the broken rows
- preserve equations and structured layouts
- publish cleanly after review
