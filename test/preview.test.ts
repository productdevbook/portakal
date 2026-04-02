import { describe, expect, it } from "vitest";
import { renderPreview } from "../src/preview";
import { label } from "../src/builder";

describe("SVG preview renderer", () => {
  it("returns valid SVG string", () => {
    const svg = renderPreview(label({ width: 40, height: 30 }).resolve());
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("renders label background with correct dimensions", () => {
    const svg = renderPreview(label({ width: 40, height: 30 }).resolve());
    expect(svg).toContain('width="320"');
    expect(svg).toContain('height="240"');
    expect(svg).toContain("320×240 dots");
    expect(svg).toContain("203 DPI");
  });

  it("renders text element", () => {
    const svg = renderPreview(
      label({ width: 40, height: 30 }).text("Hello World", { x: 10, y: 20, size: 2 }).resolve(),
    );
    expect(svg).toContain("Hello World");
    expect(svg).toContain("<text");
  });

  it("escapes XML special characters in text", () => {
    const svg = renderPreview(
      label({ width: 40, height: 30 }).text("A<B>C&D", { x: 10, y: 10 }).resolve(),
    );
    expect(svg).toContain("A&lt;B&gt;C&amp;D");
  });

  it("renders bold text with font-weight", () => {
    const svg = renderPreview(
      label({ width: 40, height: 30 }).text("Bold", { x: 10, y: 10, bold: true }).resolve(),
    );
    expect(svg).toContain('font-weight="bold"');
  });

  it("renders reverse text as white (XOR approximation)", () => {
    const svg = renderPreview(
      label({ width: 40, height: 30 }).text("Reverse", { x: 10, y: 10, reverse: true }).resolve(),
    );
    // ^FR is XOR — in SVG we approximate with white text (assumes dark background)
    expect(svg).toContain('fill="#fff"');
    expect(svg).toContain("Reverse");
  });

  it("renders box as rect with stroke", () => {
    const svg = renderPreview(
      label({ width: 40, height: 30 })
        .box({
          x: 5,
          y: 5,
          width: 100,
          height: 80,
          thickness: 2,
        })
        .resolve(),
    );
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('stroke="#000"');
    expect(svg).toContain('stroke-width="2"');
  });

  it("renders line element", () => {
    const svg = renderPreview(
      label({ width: 40, height: 30 })
        .line({
          x1: 10,
          y1: 50,
          x2: 300,
          y2: 50,
          thickness: 2,
        })
        .resolve(),
    );
    expect(svg).toContain("<line");
    expect(svg).toContain('x1="10"');
    expect(svg).toContain('stroke-width="2"');
  });

  it("renders circle element", () => {
    const svg = renderPreview(
      label({ width: 40, height: 30 })
        .circle({
          x: 100,
          y: 100,
          diameter: 60,
          thickness: 2,
        })
        .resolve(),
    );
    expect(svg).toContain("<circle");
    expect(svg).toContain('r="29"');
  });

  it("renders monochrome bitmap image", () => {
    const bitmap = {
      data: new Uint8Array([0b10101010, 0b01010101]),
      width: 8,
      height: 2,
      bytesPerRow: 1,
    };
    const svg = renderPreview(
      label({ width: 40, height: 30 }).image(bitmap, { x: 10, y: 10 }).resolve(),
    );
    expect(svg).toContain("<rect");
  });

  it("ignores raw elements in preview", () => {
    const svg = renderPreview(label({ width: 40, height: 30 }).raw("SET CUTTER ON").resolve());
    expect(svg).not.toContain("SET CUTTER ON");
  });
});
