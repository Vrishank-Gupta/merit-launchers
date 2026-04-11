# Azure Document Intelligence Validation

This is a small validation path for the exact kind of NDA PDFs that are currently failing in our local extractor.

It uses Azure AI Document Intelligence `prebuilt-layout` with the `2024-11-30` API and asks Azure for Markdown output so we can inspect:

- page text quality
- equation / matrix text quality
- question and option separation
- figure / diagram region detection

## Prerequisites

Create an Azure AI Document Intelligence resource and copy:

- endpoint, for example `https://<resource>.cognitiveservices.azure.com`
- key

Azure pricing / free tier:

- Azure Document Intelligence pricing: https://azure.microsoft.com/en-in/pricing/details/document-intelligence/
- Layout output docs: https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/concept-layout?view=doc-intel-4.0.0
- REST analyze docs: https://learn.microsoft.com/en-us/rest/api/aiservices/document-models/analyze-document?view=rest-aiservices-v4.0%2B%282024-11-30%29

## Run

In PowerShell:

```powershell
$env:AZURE_DOCINTEL_ENDPOINT="https://<resource>.cognitiveservices.azure.com"
$env:AZURE_DOCINTEL_KEY="<key>"
node .\scripts\validate_azure_layout_nda.js "C:\Users\VRISHANK\Downloads\NDA\2025 - 1.pdf" "1-8"
```

Optional:

```powershell
$env:AZURE_DOCINTEL_MODEL_ID="prebuilt-layout"
```

## Output

The script writes:

- `tmp/azure_validation/<pdf-name>__azure_layout.json`
- `tmp/azure_validation/<pdf-name>__azure_layout.md`

The markdown file is the fast review surface.
The JSON file is the raw Azure result for deeper parser work.

## What to inspect

Check whether Azure improves these known failure points:

- determinant / matrix rendering
- subscripts / superscripts
- broken option boundaries
- merged question + option text
- missing figure regions for geometry / diagram questions

If the markdown and per-page lines are materially better than our current source-first bank, we can plug Azure into the CMS import pipeline as the first-pass parser.
