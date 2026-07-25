import test from "node:test";
import assert from "node:assert/strict";
import { XMLParser } from "fast-xml-parser";

import { ommlToLatex } from "../src/import-v2/ommlToLatex.js";

const parser = new XMLParser({
  ignoreAttributes: false,
  preserveOrder: true,
  parseTagValue: false,
  trimValues: false,
});

test("converts OMML matrices into LaTeX matrix environments", () => {
  const [node] = parser.parse(`
    <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
      <m:m>
        <m:mPr>
          <m:mcs>
            <m:mc><m:mcPr><m:count m:val="2"/></m:mcPr></m:mc>
          </m:mcs>
        </m:mPr>
        <m:mr>
          <m:e><m:r><m:t>a</m:t></m:r></m:e>
          <m:e><m:r><m:t>b</m:t></m:r></m:e>
        </m:mr>
        <m:mr>
          <m:e><m:r><m:t>c</m:t></m:r></m:e>
          <m:e><m:r><m:t>d</m:t></m:r></m:e>
        </m:mr>
      </m:m>
    </m:oMath>
  `);

  const result = ommlToLatex(node);

  assert.equal(
    result.latex,
    String.raw`\begin{bmatrix}a & b \\ c & d\end{bmatrix}`,
  );
  assert.deepEqual(result.warnings, []);
});
