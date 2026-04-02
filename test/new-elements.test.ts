import { describe, expect, it } from "vitest";
import { cpcl } from "../src/lang/cpcl";
import { dpl } from "../src/lang/dpl";
import { epl } from "../src/lang/epl";
import { escpos } from "../src/lang/escpos";
import { ipl } from "../src/lang/ipl";
import { renderPreview } from "../src/preview";
import { sbpl } from "../src/lang/sbpl";
import { starprnt } from "../src/lang/starprnt";
import { tsc } from "../src/lang/tsc";
import { zpl } from "../src/lang/zpl";
import { label } from "../src/builder";

describe("Ellipse element", () => {
  it("generates TSC ELLIPSE", () => {
    const output = tsc.compile(
      label({ width: 40, height: 30 }).ellipse({
        x: 50,
        y: 50,
        width: 100,
        height: 60,
        thickness: 2,
      }),
    );
    expect(output).toContain("ELLIPSE 50,50,100,60,2");
  });

  it("renders in preview as SVG ellipse", () => {
    const svg = renderPreview(
      label({ width: 40, height: 30 })
        .ellipse({
          x: 50,
          y: 50,
          width: 100,
          height: 60,
          thickness: 2,
        })
        .resolve(),
    );
    expect(svg).toContain("<ellipse");
    expect(svg).toContain('rx="50"');
    expect(svg).toContain('ry="30"');
  });
});

describe("Reverse element", () => {
  it("generates TSC REVERSE", () => {
    const output = tsc.compile(
      label({ width: 40, height: 30 }).reverse({ x: 10, y: 10, width: 200, height: 30 }),
    );
    expect(output).toContain("REVERSE 10,10,200,30");
  });

  it("renders in preview as black rect", () => {
    const svg = renderPreview(
      label({ width: 40, height: 30 }).reverse({ x: 10, y: 10, width: 200, height: 30 }).resolve(),
    );
    expect(svg).toContain('fill="#000"');
    expect(svg).toContain('width="200"');
  });
});

describe("Erase element", () => {
  it("generates TSC ERASE", () => {
    const output = tsc.compile(
      label({ width: 40, height: 30 }).erase({ x: 10, y: 10, width: 50, height: 50 }),
    );
    expect(output).toContain("ERASE 10,10,50,50");
  });

  it("renders in preview as white rect", () => {
    const svg = renderPreview(
      label({ width: 40, height: 30 }).erase({ x: 10, y: 10, width: 50, height: 50 }).resolve(),
    );
    expect(svg).toContain('fill="#fff"');
  });
});

describe("All compilers handle new elements without error", () => {
  const b = () =>
    label({ width: 40, height: 30 })
      .ellipse({ x: 50, y: 50, width: 100, height: 60 })
      .reverse({ x: 10, y: 10, width: 200, height: 30 })
      .erase({ x: 10, y: 10, width: 50, height: 50 });

  it("TSC", () => {
    expect(tsc.compile(b())).toContain("ELLIPSE");
  });
  it("ZPL", () => {
    expect(() => zpl.compile(b())).not.toThrow();
  });
  it("EPL", () => {
    expect(() => epl.compile(b())).not.toThrow();
  });
  it("CPCL", () => {
    expect(() => cpcl.compile(b())).not.toThrow();
  });
  it("DPL", () => {
    expect(() => dpl.compile(b())).not.toThrow();
  });
  it("SBPL", () => {
    expect(() => sbpl.compile(b())).not.toThrow();
  });
  it("IPL", () => {
    expect(() => ipl.compile(b())).not.toThrow();
  });
  it("ESC/POS", () => {
    expect(() => escpos.compile(b())).not.toThrow();
  });
  it("Star PRNT", () => {
    expect(() => starprnt.compile(b())).not.toThrow();
  });
  it("Preview", () => {
    expect(renderPreview(b().resolve())).toContain("<ellipse");
  });
});
