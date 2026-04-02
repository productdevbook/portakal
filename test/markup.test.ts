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
import { markup } from "../src/markup";

describe("markup — HTML-like label DSL", () => {
  it("parses basic label with text", () => {
    const output = tsc.compile(
      markup(`
      <label width="40mm" height="30mm">
        <text x="10" y="10" size="2">Hello World</text>
      </label>
    `),
    );

    expect(output).toContain("SIZE 40 mm,30 mm");
    expect(output).toContain('"Hello World"');
    expect(output).toContain("PRINT");
  });

  it("parses text with bold and underline", () => {
    const output = tsc.compile(
      markup(`
      <label width="40mm" height="30mm">
        <text x="10" y="10" bold underline>Styled Text</text>
      </label>
    `),
    );

    expect(output).toContain('"Styled Text"');
  });

  it("parses self-closing tags", () => {
    const output = tsc.compile(
      markup(`
      <label width="40mm" height="30mm">
        <line x1="5" y1="50" x2="315" y2="50" thickness="2" />
        <box x="5" y="5" width="310" height="230" border="2" />
        <circle x="250" y="150" diameter="60" />
      </label>
    `),
    );

    expect(output).toContain("BAR");
    expect(output).toContain("BOX");
    expect(output).toContain("CIRCLE");
  });

  it("parses box with radius", () => {
    const output = tsc.compile(
      markup(`
      <label width="40mm" height="30mm">
        <box x="10" y="10" width="200" height="100" border="2" radius="5" />
      </label>
    `),
    );

    expect(output).toContain(",5");
  });

  it("parses ellipse", () => {
    const output = tsc.compile(
      markup(`
      <label width="40mm" height="30mm">
        <ellipse x="50" y="50" width="100" height="60" thickness="2" />
      </label>
    `),
    );

    expect(output).toContain("ELLIPSE");
  });

  it("parses reverse and erase", () => {
    const output = tsc.compile(
      markup(`
      <label width="40mm" height="30mm">
        <reverse x="10" y="10" width="200" height="30" />
        <erase x="50" y="50" width="20" height="20" />
      </label>
    `),
    );

    expect(output).toContain("REVERSE");
    expect(output).toContain("ERASE");
  });

  it("compiles to ZPL", () => {
    const output = zpl.compile(
      markup(`
      <label width="40mm" height="30mm">
        <text x="50" y="50" size="2">ZPL Label</text>
        <box x="10" y="10" width="300" height="220" border="2" />
      </label>
    `),
    );

    expect(output).toContain("^XA");
    expect(output).toContain("^FDZPL Label^FS");
    expect(output).toContain("^GB");
    expect(output).toContain("^XZ");
  });

  it("compiles to EPL", () => {
    const output = epl.compile(
      markup(`
      <label width="40mm" height="30mm">
        <text x="10" y="10">EPL Label</text>
      </label>
    `),
    );

    expect(output).toContain("N");
    expect(output).toContain('"EPL Label"');
  });

  it("compiles to ESC/POS", () => {
    const output = escpos.compile(
      markup(`
      <label width="80mm">
        <text align="center" size="2" bold>My Store</text>
        <text>Total: $29.48</text>
      </label>
    `),
    );

    expect(output).toBeInstanceOf(Uint8Array);
    expect(output.length).toBeGreaterThan(10);
  });

  it("compiles to all 9 languages", () => {
    const m = markup(`
      <label width="40mm" height="30mm">
        <text x="10" y="10">Test</text>
      </label>
    `);

    expect(tsc.compile(m)).toContain("TEXT");
    expect(zpl.compile(m)).toContain("^XA");
    expect(epl.compile(m)).toContain("N");
    expect(cpcl.compile(m)).toContain("PRINT");
    expect(dpl.compile(m)).toContain("E");
    expect(sbpl.compile(m)).toContain("\x1bA");
    expect(ipl.compile(m)).toContain("\x02");
    expect(escpos.compile(m)).toBeInstanceOf(Uint8Array);
    expect(starprnt.compile(m)).toBeInstanceOf(Uint8Array);
  });

  it("renders preview", () => {
    const svg = renderPreview(
      markup(`
      <label width="40mm" height="30mm">
        <text x="10" y="10" size="2">Preview Test</text>
        <box x="5" y="5" width="310" height="230" border="2" />
      </label>
    `).resolve(),
    );

    expect(svg).toContain("<svg");
    expect(svg).toContain("Preview Test");
  });

  it("uses printer profile", () => {
    const resolved = markup(`
      <label printer="tsc-te310" width="40mm" height="30mm">
        <text x="10" y="10">Profile Test</text>
      </label>
    `).resolve();

    expect(resolved.dpi).toBe(300); // TE310 is 300 DPI
  });

  it("parses label config attributes", () => {
    const resolved = markup(`
      <label width="100mm" height="50mm" dpi="300" speed="6" density="12" copies="3">
        <text x="10" y="10">Config Test</text>
      </label>
    `).resolve();

    expect(resolved.dpi).toBe(300);
    expect(resolved.speed).toBe(6);
    expect(resolved.density).toBe(12);
    expect(resolved.copies).toBe(3);
  });

  it("handles multiple text elements", () => {
    const output = tsc.compile(
      markup(`
      <label width="40mm" height="30mm">
        <text x="10" y="10" size="2">Title</text>
        <text x="10" y="35">Subtitle</text>
        <text x="10" y="55" size="1">Description</text>
      </label>
    `),
    );

    expect(output).toContain('"Title"');
    expect(output).toContain('"Subtitle"');
    expect(output).toContain('"Description"');
  });

  it("handles complex shipping label", () => {
    const output = tsc.compile(
      markup(`
      <label width="100mm" height="150mm" dpi="203">
        <text x="10" y="10" size="2" bold>FROM: Warehouse A</text>
        <text x="10" y="40" size="3" bold>TO: John Doe</text>
        <text x="10" y="80">123 Main St, New York, NY 10001</text>
        <line x1="5" y1="110" x2="780" y2="110" thickness="2" />
        <box x="5" y="5" width="780" height="1170" border="3" />
      </label>
    `),
    );

    expect(output).toContain("SIZE 100 mm,150 mm");
    expect(output).toContain('"FROM: Warehouse A"');
    expect(output).toContain('"TO: John Doe"');
    expect(output).toContain("BOX");
    expect(output).toContain("BAR");
  });

  it("throws on missing <label> root", () => {
    expect(() => markup("<text>Hello</text>")).toThrow("must contain a <label>");
  });

  it("handles raw content", () => {
    const output = tsc.compile(
      markup(`
      <label width="40mm" height="30mm">
        <raw>SET CUTTER ON</raw>
      </label>
    `),
    );

    expect(output).toContain("SET CUTTER ON");
  });
});
