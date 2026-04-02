import { describe, expect, it } from "vitest";
import { parseZPL } from "../src/parsers/zpl";

describe("ZPL Parser — Tokenizer", () => {
  it("tokenizes basic label", () => {
    const result = parseZPL("^XA^XZ");
    expect(result.commands).toHaveLength(2);
    expect(result.commands[0].code).toBe("^XA");
    expect(result.commands[1].code).toBe("^XZ");
  });

  it("tokenizes commands with parameters", () => {
    const result = parseZPL("^XA^PW800^LL1200^XZ");
    expect(result.commands).toHaveLength(4);
    expect(result.commands[1].code).toBe("^PW");
    expect(result.commands[1].params[0]).toBe("800");
    expect(result.commands[2].code).toBe("^LL");
  });

  it("tokenizes tilde commands", () => {
    const result = parseZPL("^XA~SD15^XZ");
    expect(result.commands).toHaveLength(3);
    expect(result.commands[1].code).toBe("~SD");
  });

  it("tokenizes ^FD...^FS data fields", () => {
    const result = parseZPL("^XA^FO50,50^FDHello World^FS^XZ");
    const fd = result.commands.find((c) => c.code === "^FD");
    expect(fd).toBeDefined();
    expect(fd!.rawParams).toBe("Hello World");
  });

  it("handles multiline ZPL", () => {
    const result = parseZPL("^XA\n^PW800\n^LL1200\n^XZ");
    expect(result.commands).toHaveLength(4);
  });

  it("handles ^FX comments", () => {
    const result = parseZPL("^XA^FX This is a comment^FO10,10^XZ");
    const fx = result.commands.find((c) => c.code === "^FX");
    expect(fx).toBeDefined();
  });
});

describe("ZPL Parser — Label Configuration", () => {
  it("parses ^PW (print width)", () => {
    const result = parseZPL("^XA^PW832^XZ");
    expect(result.widthDots).toBe(832);
  });

  it("parses ^LL (label length)", () => {
    const result = parseZPL("^XA^LL1218^XZ");
    expect(result.heightDots).toBe(1218);
  });

  it("uses defaults when no ^PW/^LL", () => {
    const result = parseZPL("^XA^XZ");
    expect(result.widthDots).toBe(812);
    expect(result.heightDots).toBe(1218);
  });
});

describe("ZPL Parser — Text Fields", () => {
  it("parses text field with ^FO + ^A + ^FD + ^FS", () => {
    const result = parseZPL("^XA^FO50,100^A0N,30,30^FDHello ZPL^FS^XZ");
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].type).toBe("text");
    if (result.elements[0].type === "text") {
      expect(result.elements[0].content).toBe("Hello ZPL");
      expect(result.elements[0].options.x).toBe(50);
      expect(result.elements[0].options.y).toBe(100);
    }
  });

  it("parses font with rotation", () => {
    const result = parseZPL("^XA^FO10,10^A0R,60,60^FDRotated^FS^XZ");
    expect(result.elements).toHaveLength(1);
  });

  it("parses ^FR reverse text", () => {
    const result = parseZPL("^XA^FO10,10^A0N,30,30^FR^FDReversed^FS^XZ");
    expect(result.elements).toHaveLength(1);
    if (result.elements[0].type === "text") {
      expect(result.elements[0].options.reverse).toBe(true);
    }
  });

  it("parses multiple text fields", () => {
    const result = parseZPL("^XA^FO10,10^A0N,30,30^FDLine 1^FS^FO10,50^A0N,30,30^FDLine 2^FS^XZ");
    expect(result.elements).toHaveLength(2);
  });
});

describe("ZPL Parser — Graphics", () => {
  it("parses ^GB (graphic box)", () => {
    const result = parseZPL("^XA^FO10,10^GB200,100,3,B,5^FS^XZ");
    expect(result.elements).toHaveLength(1);
    if (result.elements[0].type === "box") {
      expect(result.elements[0].options.x).toBe(10);
      expect(result.elements[0].options.y).toBe(10);
      expect(result.elements[0].options.width).toBe(200);
      expect(result.elements[0].options.height).toBe(100);
      expect(result.elements[0].options.thickness).toBe(3);
      expect(result.elements[0].options.radius).toBe(5);
    }
  });

  it("parses ^GC (graphic circle)", () => {
    const result = parseZPL("^XA^FO100,100^GC60,2,B^FS^XZ");
    expect(result.elements).toHaveLength(1);
    if (result.elements[0].type === "circle") {
      expect(result.elements[0].options.diameter).toBe(60);
      expect(result.elements[0].options.thickness).toBe(2);
    }
  });

  it("parses ^GD (graphic diagonal)", () => {
    const result = parseZPL("^XA^FO10,10^GD200,100,3,B,R^FS^XZ");
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].type).toBe("line");
  });
});

describe("ZPL Parser — Barcodes", () => {
  it("parses ^BC (Code 128) field", () => {
    const result = parseZPL("^XA^FO50,50^BCN,100,Y^FD123456^FS^XZ");
    // Barcode fields don't create preview elements (need image rendering)
    // But command should be tokenized
    const bc = result.commands.find((c) => c.code === "^BC");
    expect(bc).toBeDefined();
  });

  it("parses ^BQ (QR Code) field", () => {
    const result = parseZPL("^XA^FO50,50^BQN,2,5^FDQM,Hello^FS^XZ");
    const bq = result.commands.find((c) => c.code === "^BQ");
    expect(bq).toBeDefined();
  });
});

describe("ZPL Parser — Full Label", () => {
  it("parses complete label", () => {
    const zpl = `^XA
^PW832
^LL1218
^PR4
~SD16
^CI28
^FO50,50^A0N,60,60^FDProduct Label^FS
^FO50,120^A0N,30,30^FDSKU: 12345^FS
^FO50,180^GB700,3,3^FS
^FO50,200^BCN,100,Y^FD123456789^FS
^FO600,200^BQN,2,5^FDQM,https://example.com^FS
^FO40,40^GB720,400,2,B,0^FS
^PQ1
^XZ`;

    const result = parseZPL(zpl);
    expect(result.widthDots).toBe(832);
    expect(result.heightDots).toBe(1218);
    expect(result.commands.length).toBeGreaterThan(10);
    expect(result.elements.length).toBeGreaterThanOrEqual(3); // 2 texts + 1 box + line
  });

  it("handles empty input", () => {
    const result = parseZPL("");
    expect(result.commands).toHaveLength(0);
    expect(result.elements).toHaveLength(0);
  });

  it("handles invalid/unknown commands", () => {
    const result = parseZPL("^XA^ZZ^XZ");
    expect(result.warnings).toHaveLength(0); // ^ZZ is a valid command
  });
});
