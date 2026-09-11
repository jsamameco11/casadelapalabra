// Built from char codes (not a literal \u escape) so the source file can't
// end up with an actual combining-mark character silently substituted in.
const COMBINING_MARKS = new RegExp(
  "[" + String.fromCharCode(92, 117, 48, 51, 48, 48) + "-" + String.fromCharCode(92, 117, 48, 51, 54, 102) + "]",
  "g"
);

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
