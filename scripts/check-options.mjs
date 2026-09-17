// Verifies that the form's option lists are identical in the three places they
// live. Runs before every build (and so before every `firebase deploy`), because
// a mismatch fails quietly for real people:
//   • firestore.rules missing an id  → those volunteers' submissions are refused
//   • Code.gs missing an id or label → the Google Sheet shows blanks or raw ids
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const config = read("src/config.ts");
const rules = read("firestore.rules");
const sheets = read("google-sheets/Code.gs");

const problems = [];
const between = (text, start, end) => {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  if (from < 0 || to < 0) throw new Error(`Couldn't find "${start}" … "${end}"`);
  return text.slice(from, to);
};
const sameList = (label, a, b) => {
  const missing = a.filter((x) => !b.includes(x));
  const extra = b.filter((x) => !a.includes(x));
  if (missing.length || extra.length) {
    problems.push(
      `${label}:` +
        (missing.length ? `\n    missing: ${missing.join(", ")}` : "") +
        (extra.length ? `\n    not in src/config.ts: ${extra.join(", ")}` : ""),
    );
  }
};

/* --- src/config.ts (the source of truth) --------------------------------- */
const categoryBlock = between(config, "export const HELP_CATEGORIES", "export const OTHER_CONTRIBUTION_ID");
const configOptions = [...categoryBlock.matchAll(/\{ id: "([a-z_]+)", label: "([^"]+)" \}/g)].map((m) => ({
  id: m[1],
  label: m[2],
}));
const listIds = (name) =>
  [...between(config, `export const ${name}`, "] as const").matchAll(/id: "([^"]+)"/g)].map((m) => m[1]);
const configCommitments = listIds("COMMITMENTS");
const configTimes = listIds("TIMES");
const configStatuses = listIds("STATUSES");

/* --- firestore.rules ----------------------------------------------------- */
const rulesIds = (fn) =>
  [...between(rules, `function ${fn}()`, "}").matchAll(/'([^']+)'/g)].map((m) => m[1]);
sameList("firestore.rules helpOptionIds()", configOptions.map((o) => o.id), rulesIds("helpOptionIds"));
sameList("firestore.rules commitmentIds()", configCommitments, rulesIds("commitmentIds"));
sameList("firestore.rules timeIds()", configTimes, rulesIds("timeIds"));
sameList("firestore.rules statusIds()", configStatuses, rulesIds("statusIds"));

const sizeCap = rules.match(/d\.helpWith\.size\(\) <= (\d+)/);
if (!sizeCap || Number(sizeCap[1]) !== configOptions.length) {
  problems.push(
    `firestore.rules: helpWith size cap is ${sizeCap?.[1]}, but there are ${configOptions.length} options`,
  );
}

/* --- google-sheets/Code.gs ----------------------------------------------- */
const sheetsOptions = [
  ...between(sheets, "var HELP_CATEGORIES", "var COMMITMENT_LABEL").matchAll(/(\w+): '((?:[^'\\]|\\.)+)'/g),
]
  .map((m) => ({ id: m[1], label: m[2].replace(/\\'/g, "'") }))
  .filter((o) => !["id", "label", "specifics"].includes(o.id));
sameList("Code.gs HELP_CATEGORIES", configOptions.map((o) => o.id), sheetsOptions.map((o) => o.id));
for (const option of configOptions) {
  const match = sheetsOptions.find((o) => o.id === option.id);
  if (match && match.label !== option.label) {
    problems.push(`Code.gs label for ${option.id}: "${match.label}" should be "${option.label}"`);
  }
}
const sheetsKeys = (name) =>
  [...between(sheets, `var ${name}`, "};").matchAll(/^\s+(\w+):/gm)].map((m) => m[1]);
sameList("Code.gs COMMITMENT_LABEL", configCommitments, sheetsKeys("COMMITMENT_LABEL"));
sameList("Code.gs TIME_LABEL", configTimes, sheetsKeys("TIME_LABEL"));
sameList("Code.gs STATUS_LABEL", configStatuses, sheetsKeys("STATUS_LABEL"));

if (problems.length) {
  console.error("\n✖ Form options are out of step:\n\n  " + problems.join("\n  ") + "\n");
  console.error("  src/config.ts is the source of truth. Update the other files to match.\n");
  process.exit(1);
}
console.log(
  `✔ Form options match across config, rules and Sheets script ` +
    `(${configOptions.length} help options, ${configCommitments.length} commitments, ${configTimes.length} times).`,
);
