// Turns the failing tests in a node --test log into one GitHub Actions error annotation, so the reason a CI
// run failed can be read on the run page without downloading logs. Piped output is in the TAP format.
import { readFileSync } from "node:fs";

const [file, title = "Failing tests"] = process.argv.slice(2);
const lines = readFileSync(file, "utf8").split(/\r?\n/);
const keep = [];
for (let i = 0; i < lines.length && keep.length < 120; i += 1) {
  const line = lines[i];
  if (/^\s*not ok\b/.test(line) || /^\s*✖/.test(line)) keep.push(line.trim());
  else if (/^\s*(error|expected|actual|location):/.test(line)) {
    keep.push(line.trim());
    // A multi-line error message follows "error: |-" on indented lines.
    for (let j = i + 1; j < lines.length && /^\s{4,}\S/.test(lines[j]) && j < i + 6; j += 1) keep.push(lines[j].trim());
  }
}
const message = (keep.length ? keep.join("\n") : "No failing test lines found; see the step log.").replaceAll("%", "%25").replaceAll("\r", "").replaceAll("\n", "%0A");
console.log(`::error title=${title}::${message}`);
