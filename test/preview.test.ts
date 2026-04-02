import { describe, expect, it } from "vitest";
import { label } from "../src/builder";

describe("SVG preview renderer", () => {
  it("returns valid SVG string", () => {
    const svg = label({ width: 40, height: 30 }).toPreview();
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("renders label background with correct dimensions", () => {
    const svg = label({ width: 40, height: 30 }).toPreview();
    // 40mm at 203 DPI = 320 dots, 30mm = 240 dots
    expect(svg).toContain('width="320"');
    expect(svg).toContain('height="240"');
    expect(svg).toContain("320×240 dots");
    expect(svg).toContain("203 DPI");
  });

  it("renders text element", () => {
    const svg = label({ width: 40, height: 30 })
      .text("Hello World", { x: 10, y: 20, size: 2 })
      .toPreview();
    expect(svg).toContain("Hello World");
    expect(svg).toContain("<text");
  });

  it("escapes XML special characters in text", () => {
    const svg = label({ width: 40, height: 30 }).text("A<B>C&D", { x: 10, y: 10 }).toPreview();
    expect(svg).toContain("A&lt;B&gt;C&amp;D");
    expect(svg).not.toContain("A<B>C&D");
  });

  it("renders bold text with font-weight", () => {
    const svg = label({ width: 40, height: 30 })
      .text("Bold", { x: 10, y: 10, bold: true })
      .toPreview();
    expect(svg).toContain('font-weight="bold"');
  });

  it("renders underline text with decoration", () => {
    const svg = label({ width: 40, height: 30 })
      .text("Under", { x: 10, y: 10, underline: true })
      .toPreview();
    expect(svg).toContain('text-decoration="underline"');
  });

  it("renders reverse text with black background", () => {
    const svg = label({ width: 40, height: 30 })
      .text("Reverse", { x: 10, y: 10, reverse: true })
      .toPreview();
    expect(svg).toContain('fill="#000"');
    expect(svg).toContain('fill="#fff"');
  });

  it("renders rotated text with transform", () => {
    const svg = label({ width: 40, height: 30 })
      .text("Rotated", { x: 10, y: 10, rotation: 90 })
      .toPreview();
    expect(svg).toContain("rotate(90");
  });

  it("renders barcode with bars and label", () => {
    const svg = label({ width: 40, height: 30 })
      .barcode("123456", { type: "code128", x: 10, y: 50, height: 60 })
      .toPreview();
    expect(svg).toContain("123456");
    // Should contain multiple rect elements (bars)
    const rectCount = (svg.match(/<rect/g) || []).length;
    expect(rectCount).toBeGreaterThan(10);
  });

  it("renders barcode without label when readable=false", () => {
    const svg = label({ width: 40, height: 30 })
      .barcode("123456", { type: "code128", x: 10, y: 50, readable: false })
      .toPreview();
    // Should not contain the data text as label
    const textMatches = svg.match(/>123456</g);
    expect(textMatches).toBeNull();
  });

  it("renders QR code with finder patterns", () => {
    const svg = label({ width: 40, height: 30 })
      .qrcode("https://example.com", { x: 10, y: 10, size: 4 })
      .toPreview();
    // Should contain many rects (finder patterns + data)
    const rectCount = (svg.match(/<rect/g) || []).length;
    expect(rectCount).toBeGreaterThan(15);
  });

  it("renders box as rect with stroke", () => {
    const svg = label({ width: 40, height: 30 })
      .box({ x: 5, y: 5, width: 100, height: 80, thickness: 2 })
      .toPreview();
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('stroke="#000"');
    expect(svg).toContain('stroke-width="2"');
  });

  it("renders box with border radius", () => {
    const svg = label({ width: 40, height: 30 })
      .box({ x: 5, y: 5, width: 100, height: 80, radius: 5 })
      .toPreview();
    expect(svg).toContain('rx="5"');
    expect(svg).toContain('ry="5"');
  });

  it("renders line element", () => {
    const svg = label({ width: 40, height: 30 })
      .line({ x1: 10, y1: 50, x2: 300, y2: 50, thickness: 2 })
      .toPreview();
    expect(svg).toContain("<line");
    expect(svg).toContain('x1="10"');
    expect(svg).toContain('x2="300"');
    expect(svg).toContain('stroke-width="2"');
  });

  it("renders circle element", () => {
    const svg = label({ width: 40, height: 30 })
      .circle({ x: 100, y: 100, diameter: 60, thickness: 2 })
      .toPreview();
    expect(svg).toContain("<circle");
    expect(svg).toContain('r="30"');
    expect(svg).toContain('stroke-width="2"');
  });

  it("renders monochrome bitmap image", () => {
    const bitmap = {
      data: new Uint8Array([0b10101010, 0b01010101]),
      width: 8,
      height: 2,
      bytesPerRow: 1,
    };
    const svg = label({ width: 40, height: 30 }).image(bitmap, { x: 10, y: 10 }).toPreview();
    // Should contain rect elements for black pixels
    expect(svg).toContain("<rect");
  });

  it("renders multiple elements together", () => {
    const svg = label({ width: 40, height: 30 })
      .text("Title", { x: 10, y: 10, size: 2 })
      .barcode("12345", { type: "code128", x: 10, y: 50, height: 40 })
      .qrcode("data", { x: 200, y: 50, size: 4 })
      .box({ x: 5, y: 5, width: 310, height: 230, thickness: 2 })
      .line({ x1: 5, y1: 45, x2: 315, y2: 45 })
      .toPreview();

    expect(svg).toContain("Title");
    expect(svg).toContain("12345");
    expect(svg).toContain("<line");
    expect(svg).not.toContain("<circle"); // no circle added
  });

  it("uses default height 400 for receipt mode (no height)", () => {
    const svg = label({ width: 80 }).text("Receipt", { align: "center" }).toPreview();
    expect(svg).toContain("400");
  });

  it("ignores raw elements in preview", () => {
    const svg = label({ width: 40, height: 30 }).raw("SET CUTTER ON").toPreview();
    expect(svg).not.toContain("SET CUTTER ON");
  });
});
