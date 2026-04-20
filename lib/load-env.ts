import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function parseEnvFile(content: string) {
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = trimmed.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

export function loadLocalEnv() {
  const cwd = process.cwd();
  const candidates = [".env.local", ".env"];

  for (const fileName of candidates) {
    const filePath = join(cwd, fileName);
    if (!existsSync(filePath)) {
      continue;
    }

    parseEnvFile(readFileSync(filePath, "utf8"));
  }
}
