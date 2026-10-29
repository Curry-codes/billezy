/**
 * Assign trusted inventory roles to existing Firebase Auth users.
 * Usage with npm run create-auth:
 * Create users in Firebase Authentication, then set ADMIN_EMAIL and/or STAFF_EMAIL.
 * Provide a service account through GOOGLE_APPLICATION_CREDENTIALS.
 */
const fs = require("node:fs");
const path = require("node:path");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

function loadDotEnvFile() {
  const envPath = path.resolve(__dirname, "..", ".env");

  if (!fs.existsSync(envPath)) {
    return {};
  }

  const raw = fs.readFileSync(envPath, "utf8");
  const values = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const normalized = trimmed.replace(/^export\s+/, "");
    const match = normalized.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    const unquoted = rawValue.trim();
    let value = unquoted;

    if (
      (unquoted.startsWith('"') && unquoted.endsWith('"')) ||
      (unquoted.startsWith("'") && unquoted.endsWith("'"))
    ) {
      value = unquoted.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

const dotEnv = loadDotEnvFile();

function getEmailEnvVar(key) {
  const candidates = [key, key.toLowerCase(), key.toUpperCase()];

  for (const candidate of candidates) {
    const value = process.env[candidate];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }

  const dotEnvValue = dotEnv[key] ?? dotEnv[key.toLowerCase()] ?? dotEnv[key.toUpperCase()];
  if (typeof dotEnvValue === "string" && dotEnvValue.trim() !== "") {
    return dotEnvValue.trim();
  }

  return undefined;
}

let app;
try {
  app = initializeApp();
} catch (e) {
  console.error(
    "Failed to initialize admin SDK. Ensure service account is present.",
    e
  );
  process.exit(1);
}

const auth = getAuth(app);

const rolesToProvision = ["admin", "staff"].filter((role) =>
  getEmailEnvVar(`${role.toUpperCase()}_EMAIL`)
);

if (rolesToProvision.length === 0) {
  console.error(
    "Set ADMIN_EMAIL, STAFF_EMAIL, or both. Values may also be defined in a .env file."
  );
  process.exit(1);
}

async function provisionRole(role) {
  const prefix = role.toUpperCase();
  const email = getEmailEnvVar(`${prefix}_EMAIL`);

  if (!email) {
    throw new Error(`${prefix}_EMAIL must be set`);
  }

  const user = await auth.getUserByEmail(email);

  await auth.setCustomUserClaims(user.uid, {
    ...user.customClaims,
    role,
  });
  console.log(`Assigned ${role} role to ${email}`);
}

Promise.all(rolesToProvision.map(provisionRole)).catch((e) => {
  console.error(e);
  process.exit(1);
});
