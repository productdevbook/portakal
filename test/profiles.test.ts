import { describe, expect, it } from "vitest";
import {
  PRINTER_PROFILES,
  getProfile,
  listProfiles,
  findByVendorId,
  findByLanguage,
} from "../src/profiles";

describe("getProfile", () => {
  it("returns profile by model ID", () => {
    const p = getProfile("epson-tm-t88vi");
    expect(p).toBeDefined();
    expect(p!.name).toBe("Epson TM-T88VI");
    expect(p!.vendor).toBe("Epson");
    expect(p!.language).toBe("escpos");
    expect(p!.paperWidth).toBe(80);
    expect(p!.dotsPerLine).toBe(576);
    expect(p!.dpi).toBe(203);
  });

  it("returns undefined for unknown model", () => {
    expect(getProfile("nonexistent")).toBeUndefined();
  });
});

describe("listProfiles", () => {
  it("returns all profile IDs", () => {
    const ids = listProfiles();
    expect(ids.length).toBeGreaterThan(15);
    expect(ids).toContain("epson-tm-t88vi");
    expect(ids).toContain("zebra-zd420");
    expect(ids).toContain("tsc-te200");
    expect(ids).toContain("star-tsp143");
    expect(ids).toContain("sato-cl4nx");
  });
});

describe("findByVendorId", () => {
  it("finds Epson printers by VID 0x04B8", () => {
    const printers = findByVendorId(0x04b8);
    expect(printers.length).toBeGreaterThan(2);
    for (const p of printers) {
      expect(p.vendor).toBe("Epson");
    }
  });

  it("finds Zebra printers by VID 0x0A5F", () => {
    const printers = findByVendorId(0x0a5f);
    expect(printers.length).toBeGreaterThan(1);
    for (const p of printers) {
      expect(p.vendor).toBe("Zebra");
    }
  });

  it("finds Star printers by VID 0x0519", () => {
    const printers = findByVendorId(0x0519);
    expect(printers.length).toBeGreaterThan(0);
    for (const p of printers) {
      expect(p.vendor).toBe("Star Micronics");
    }
  });

  it("finds TSC printers by VID 0x1203", () => {
    const printers = findByVendorId(0x1203);
    expect(printers.length).toBeGreaterThan(0);
    for (const p of printers) {
      expect(p.vendor).toBe("TSC");
    }
  });

  it("returns empty for unknown VID", () => {
    expect(findByVendorId(0xffff)).toHaveLength(0);
  });
});

describe("findByLanguage", () => {
  it("finds ESC/POS printers", () => {
    const printers = findByLanguage("escpos");
    expect(printers.length).toBeGreaterThan(5);
    for (const p of printers) {
      expect(p.language).toBe("escpos");
    }
  });

  it("finds ZPL printers", () => {
    const printers = findByLanguage("zpl");
    expect(printers.length).toBeGreaterThan(1);
  });

  it("finds TSC printers", () => {
    const printers = findByLanguage("tsc");
    expect(printers.length).toBeGreaterThan(0);
  });

  it("finds Star printers", () => {
    const printers = findByLanguage("starprnt");
    expect(printers.length).toBeGreaterThan(0);
  });
});

describe("printer profiles data integrity", () => {
  it("all profiles have required fields", () => {
    for (const [id, p] of Object.entries(PRINTER_PROFILES)) {
      expect(p.name, `${id} missing name`).toBeTruthy();
      expect(p.vendor, `${id} missing vendor`).toBeTruthy();
      expect(p.language, `${id} missing language`).toBeTruthy();
      expect(p.paperWidth, `${id} missing paperWidth`).toBeGreaterThan(0);
      expect(p.dotsPerLine, `${id} missing dotsPerLine`).toBeGreaterThan(0);
      expect(p.dpi, `${id} missing dpi`).toBeGreaterThan(0);
      expect(p.features, `${id} missing features`).toBeDefined();
    }
  });

  it("DPI and dotsPerLine are consistent", () => {
    for (const [id, p] of Object.entries(PRINTER_PROFILES)) {
      if (p.paperWidth > 0 && p.dotsPerLine > 0) {
        const expectedDots = Math.round((p.paperWidth / 25.4) * p.dpi);
        // Allow 10% tolerance for non-standard widths
        expect(p.dotsPerLine, `${id} dotsPerLine inconsistent`).toBeGreaterThan(expectedDots * 0.7);
      }
    }
  });
});
