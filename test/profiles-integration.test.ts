import { describe, expect, it } from "vitest";
import { tsc } from "../src/lang/tsc";
import { label } from "../src/builder";

describe("Printer profile integration", () => {
  it("uses profile DPI", () => {
    const resolved = label({ width: 100, height: 50, printer: "tsc-te310" }).resolve();
    expect(resolved.dpi).toBe(300); // TE310 is 300 DPI
  });

  it("uses profile width when not specified", () => {
    // Epson TM-T88VI is 80mm wide
    const resolved = label({ width: 80, printer: "epson-tm-t88vi" }).resolve();
    expect(resolved.dpi).toBe(203);
  });

  it("user config overrides profile", () => {
    const resolved = label({ width: 50, dpi: 600, printer: "tsc-te200" }).resolve();
    expect(resolved.dpi).toBe(600); // User override
  });

  it("ignores unknown printer profile", () => {
    const resolved = label({ width: 40, printer: "unknown-model" }).resolve();
    expect(resolved.dpi).toBe(203); // Default
  });

  it("compiles to correct language based on profile", () => {
    const output = tsc.compile(label({ width: 40, height: 30, printer: "tsc-te200" }));
    expect(output).toContain("SIZE");
    expect(output).toContain("PRINT");
  });
});
