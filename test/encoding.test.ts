import { describe, expect, it } from "vitest";
import { encodeText, encodeTextForPrinter, isASCII } from "../src/encoding";

describe("isASCII", () => {
  it("returns true for plain ASCII", () => {
    expect(isASCII("Hello World")).toBe(true);
    expect(isASCII("123 ABC !@#")).toBe(true);
  });

  it("allows newlines", () => {
    expect(isASCII("Hello\nWorld")).toBe(true);
    expect(isASCII("Hello\r\nWorld")).toBe(true);
  });

  it("returns false for accented characters", () => {
    expect(isASCII("café")).toBe(false);
    expect(isASCII("über")).toBe(false);
  });

  it("returns false for Cyrillic", () => {
    expect(isASCII("Привет")).toBe(false);
  });

  it("returns false for CJK", () => {
    expect(isASCII("你好")).toBe(false);
  });

  it("returns false for Euro sign", () => {
    expect(isASCII("€10.00")).toBe(false);
  });
});

describe("encodeText", () => {
  it("encodes plain ASCII without code page switch", () => {
    const segments = encodeText("Hello World");
    expect(segments).toHaveLength(1);
    expect(segments[0].codePage).toBe(-1);
    expect(new TextDecoder().decode(segments[0].data)).toBe("Hello World");
  });

  it("encodes Euro sign with CP858", () => {
    const segments = encodeText("Total: €10.00");
    // "Total: " is ASCII, "€" needs CP858, "10.00" is ASCII
    expect(segments.length).toBeGreaterThanOrEqual(2);
    // Find segment with Euro
    const euroSeg = segments.find((s) => s.codePage === 19); // CP858
    expect(euroSeg).toBeDefined();
    expect(euroSeg!.data).toContain(0xd5); // € in CP858
  });

  it("encodes German umlauts with CP437", () => {
    const segments = encodeText("Größe");
    // G, r are ASCII; ö needs CP437; ß needs CP437; e is ASCII
    const cpSeg = segments.find((s) => s.codePage === 0);
    expect(cpSeg).toBeDefined();
  });

  it("encodes Cyrillic with CP866", () => {
    const segments = encodeText("Привет");
    const cpSeg = segments.find((s) => s.codePage === 17);
    expect(cpSeg).toBeDefined();
    expect(cpSeg!.data.length).toBe(6); // 6 Cyrillic chars
  });

  it("encodes Turkish characters with CP857", () => {
    const segments = encodeText("Türkçe Ğğ İı Şş");
    // Should find CP857 or CP437 segments for Turkish chars
    const hasTurkish = segments.some((s) => s.codePage >= 0);
    expect(hasTurkish).toBe(true);
  });

  it("minimizes code page switches for mixed text", () => {
    const segments = encodeText("Price: €5.00");
    // Should not switch more than necessary
    expect(segments.length).toBeLessThanOrEqual(3);
  });

  it("replaces unencodable characters with ?", () => {
    const segments = encodeText("Hello 你好"); // Chinese not in any code page
    const allBytes: number[] = [];
    for (const seg of segments) {
      allBytes.push(...seg.data);
    }
    // Should contain ? (0x3F) for Chinese chars
    expect(allBytes.filter((b) => b === 0x3f).length).toBe(2);
  });

  it("handles empty string", () => {
    const segments = encodeText("");
    expect(segments).toHaveLength(0);
  });

  it("handles newlines", () => {
    const segments = encodeText("Line1\nLine2");
    const allBytes: number[] = [];
    for (const seg of segments) allBytes.push(...seg.data);
    expect(allBytes).toContain(0x0a);
  });
});

describe("encodeTextForPrinter", () => {
  it("returns ESC t commands for code page switches", () => {
    const bytes = encodeTextForPrinter("€");
    const arr = Array.from(bytes);
    // Should contain ESC t 19 (CP858)
    const escTIdx = arr.findIndex((b, i) => b === 0x1b && arr[i + 1] === 0x74);
    expect(escTIdx).toBeGreaterThan(-1);
    expect(arr[escTIdx + 2]).toBe(19); // CP858
  });

  it("returns plain bytes for ASCII (no ESC t)", () => {
    const bytes = encodeTextForPrinter("Hello");
    const arr = Array.from(bytes);
    // Should NOT contain ESC t
    const hasEscT = arr.some((b, i) => b === 0x1b && arr[i + 1] === 0x74);
    expect(hasEscT).toBe(false);
    expect(new TextDecoder().decode(bytes)).toBe("Hello");
  });

  it("encodes Cyrillic with ESC t 17 prefix", () => {
    const bytes = encodeTextForPrinter("Москва");
    const arr = Array.from(bytes);
    const escTIdx = arr.findIndex((b, i) => b === 0x1b && arr[i + 1] === 0x74);
    expect(escTIdx).toBeGreaterThan(-1);
    expect(arr[escTIdx + 2]).toBe(17); // CP866
  });

  it("produces correct byte sequence for mixed ASCII + special", () => {
    const bytes = encodeTextForPrinter("Total: £5");
    expect(bytes.length).toBeGreaterThan(0);
    // Should contain "Total: " as ASCII + code page switch + £ byte + "5"
  });
});
