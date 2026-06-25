export function buildDebugExport({ir, segmented, answerKey, validation}) {
  return {
    parserVersion: "deterministic-v2",
    sourceType: ir.sourceType,
    blockCount: ir.blocks?.length || 0,
    questionBlockCount: segmented.questionBlocks?.length || 0,
    answerCount: answerKey?.answers?.size || 0,
    confidence: validation.confidence,
    needsReview: validation.needsReview,
    warnings: validation.warnings,
    metadata: ir.metadata || {},
  };
}
