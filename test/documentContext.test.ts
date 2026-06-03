import assert from "node:assert/strict";
import test from "node:test";
import { selectFimContext } from "../src/documentContext";

test("selectFimContext returns text before and after the cursor", () => {
  const context = selectFimContext("const value = answer;", 12, 100, 100);

  assert.deepEqual(context, {
    prefix: "const value ",
    suffix: "= answer;",
  });
});

test("selectFimContext limits prefix and suffix by character count", () => {
  const context = selectFimContext("0123456789", 5, 2, 3);

  assert.deepEqual(context, {
    prefix: "34",
    suffix: "567",
  });
});

test("selectFimContext rejects cursor offsets outside the document", () => {
  assert.throws(() => selectFimContext("abc", 4, 10, 10), /outside the document/);
  assert.throws(() => selectFimContext("abc", -1, 10, 10), /outside the document/);
});
