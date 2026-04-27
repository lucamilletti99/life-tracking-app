import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const proxySource = readFileSync(join(process.cwd(), "proxy.ts"), "utf8");

describe("proxy route protection", () => {
  it("protects /today via protected-prefix checks", () => {
    expect(proxySource).toMatch(/PROTECTED_PREFIXES\s*=\s*\[[^\]]*["']\/today["']/s);
  });

  it("protects /today via matcher config", () => {
    expect(proxySource).toMatch(/matcher:\s*\[[^\]]*["']\/today["']/s);
  });
});
