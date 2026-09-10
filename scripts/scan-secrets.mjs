// Scans for real secrets so they never reach GitHub.
// Usage: node scripts/scan-secrets.mjs [--push]
//   default : scans staged diff (pre-commit)
//   --push  : scans commits ahead of origin/main, or all tracked files (pre-push)
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const PLACEHOLDER = /(your-|example|placeholder|changeme|xxx+|\*\*\*|\[.+\]|localhost|^$)/i;
const DUMMY_PASSWORDS = new Set(["emergent", "litscope", "postgres", "password", "dev", "test"]);

function sh(cmd) {
  return execFileSync("git", cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
}

// 1. Real secret values from local (untracked) env must never appear in committed content.
// NEXT_PUBLIC_* values ship in the client bundle by design, so they are skipped.
const PUBLIC_VALUES = new Set(["https://api.openalex.org"]);
function localSecrets() {
  const out = new Set();
  for (const f of [".env.local", ".env"]) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*["']?([^"'#\s][^#\r\n]*?)["']?\s*$/);
      if (!m) continue;
      if (m[1].startsWith("NEXT_PUBLIC_")) continue;
      const v = m[2].trim().replace(/\/$/, "");
      if (v.length >= 16 && !PLACEHOLDER.test(v) && !PUBLIC_VALUES.has(v)) out.add(v);
    }
  }
  return out;
}

// 2. Generic high-signal patterns (with placeholder allowlists).
const PATTERNS = [
  { name: "private-key", re: /-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----/ },
  { name: "openai-key", re: /\bsk-(live|proj|sess|test)-[A-Za-z0-9]{10,}/ },
  {
    name: "supabase-service-role",
    re: /service_role[^A-Za-z0-9_].{10,}|SUPABASE_SERVICE_ROLE_KEY\s*=\s*["']?\S[^"'placeholder\s]{15,}/i,
  },
  { name: "aws-key", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "jwt-secret", re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  {
    name: "conn-string-password",
    re: /(postgres(ql)?|mysql|mongodb(\+srv)?|redis(rediss)?):\/\/[^/\s:]+:([^@\s]+)@/i,
    group: 5,
  },
];

function isDummy(secret) {
  const s = secret.toLowerCase();
  if (PLACEHOLDER.test(secret)) return true;
  if (DUMMY_PASSWORDS.has(s)) return true;
  if (/^%[0-9A-F]{2}/i.test(secret)) return true; // URL-encoded template fragment
  return false;
}

function scanText(text, label, findings, literals) {
  text.split("\n").forEach((line, i) => {
    for (const lit of literals) {
      if (lit && line.includes(lit)) findings.push(`${label}:${i + 1} leaks local secret value`);
    }
    for (const p of PATTERNS) {
      const m = line.match(p.re);
      if (!m) continue;
      const captured = p.group ? m[p.group] : m[0];
      if (captured && isDummy(captured)) continue;
      // assignment-form patterns already anchored; others flag on match
      if (!p.group && PLACEHOLDER.test(line)) continue;
      findings.push(`${label}:${i + 1} possible ${p.name}: ${line.trim().slice(0, 80)}`);
    }
  });
}

const push = process.argv.includes("--push");
const literals = localSecrets();
let targets = [];
try {
  if (push) {
    let range = "";
    try {
      const base = sh(["merge-base", "HEAD", "origin/main"]).trim();
      range = `${base}..HEAD`;
    } catch {
      range = "";
    }
    const files = range
      ? sh(["diff", "--name-only", range])
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
      : sh(["ls-files"])
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
    targets = files.filter((f) => existsSync(f)).map((f) => ({ label: f, text: readFileSync(f, "utf8") }));
  } else {
    const staged = sh(["diff", "--cached", "--name-only"])
      .split("\n")
      .map((s) => s.trim())
      .filter((f) => f && f !== "package-lock.json");
    const parts = staged
      .filter((f) => existsSync(f))
      .map((f) => {
        try {
          return sh(["diff", "--cached", "--unified=0", "--", f]);
        } catch {
          return "";
        }
      });
    scanText(parts.join("\n"), "staged", (targets = []), literals);
    report(targets);
  }
} catch (e) {
  console.error("secret scan failed to run:", e.message);
  process.exit(1);
}

function report(findings) {
  const dup = new Set();
  const uniq = findings.filter((f) => (dup.has(f) ? false : (dup.add(f), true)));
  if (uniq.length) {
    console.error("BLOCKED: possible secrets detected:\n" + uniq.slice(0, 20).join("\n"));
    process.exit(1);
  }
  console.log(push ? "secret scan (push): clean" : "secret scan (staged): clean");
}

if (push) {
  const findings = [];
  for (const t of targets) scanText(t.text, t.label, findings, literals);
  report(findings);
}
