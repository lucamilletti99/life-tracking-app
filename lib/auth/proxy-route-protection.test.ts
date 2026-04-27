import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const proxySource = readFileSync(join(process.cwd(), "proxy.ts"), "utf8");

describe("proxy route protection", () => {
  it("keeps proxy as an explicit pass-through", () => {
    expect(proxySource).toMatch(/export function proxy\(/);
    expect(proxySource).toMatch(/return NextResponse\.next\(\)/);
  });

  it("protects /today via matcher config", () => {
    expect(proxySource).toMatch(/matcher:\s*\[[^\]]*["']\/today["']/s);
  });
});
