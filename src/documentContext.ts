export interface FimContext {
  prefix: string;
  suffix: string;
}

export function selectFimContext(
  documentText: string,
  cursorOffset: number,
  maxPrefixChars: number,
  maxSuffixChars: number,
): FimContext {
  if (cursorOffset < 0 || cursorOffset > documentText.length) {
    throw new Error("Cursor offset is outside the document text.");
  }

  const prefixStart = Math.max(0, cursorOffset - Math.max(0, maxPrefixChars));
  const suffixEnd = Math.min(documentText.length, cursorOffset + Math.max(0, maxSuffixChars));

  return {
    prefix: documentText.slice(prefixStart, cursorOffset),
    suffix: documentText.slice(cursorOffset, suffixEnd),
  };
}
