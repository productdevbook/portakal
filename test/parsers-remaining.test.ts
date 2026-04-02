import { describe, expect, it } from "vitest";
import { parseESCPOS } from "../src/parsers/escpos";
import { parseDPL } from "../src/parsers/dpl";
import { parseSBPL } from "../src/parsers/sbpl";
import { parseStarPRNT } from "../src/parsers/starprnt";
import { parseIPL } from "../src/parsers/ipl";

describe("ESC/POS Parser", () => {
  it("parses ESC @ (initialize)", () => {
    const r = parseESCPOS(new Uint8Array([0x1b, 0x40]));
    expect(r.commands[0].name).toBe("ESC @");
  });

  it("parses text", () => {
    const bytes = new Uint8Array([0x1b, 0x40, 0x48, 0x65, 0x6c, 0x6c, 0x6f]); // ESC @ Hello
    const r = parseESCPOS(bytes);
    expect(r.elements).toHaveLength(1);
    expect(r.elements[0].type).toBe("text");
    if (r.elements[0].type === "text") expect(r.elements[0].content).toBe("Hello");
  });

  it("parses ESC a (alignment)", () => {
    const r = parseESCPOS(new Uint8Array([0x1b, 0x61, 0x01]));
    expect(r.commands[0].params.align).toBe("center");
  });

  it("parses ESC E (bold)", () => {
    const r = parseESCPOS(new Uint8Array([0x1b, 0x45, 0x01]));
    expect(r.commands[0].params.bold).toBe(true);
  });

  it("parses GS ! (character size)", () => {
    const r = parseESCPOS(new Uint8Array([0x1d, 0x21, 0x22]));
    expect(r.commands[0].params.width).toBe(3);
    expect(r.commands[0].params.height).toBe(3);
  });

  it("parses GS V (cut)", () => {
    const r = parseESCPOS(new Uint8Array([0x1d, 0x56, 0x42, 0x03]));
    expect(r.commands[0].name).toBe("GS V");
    expect(r.commands[0].params.mode).toBe(66);
  });

  it("parses GS k (barcode)", () => {
    const data = new Uint8Array([0x1d, 0x6b, 73, 6, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36]);
    const r = parseESCPOS(data);
    expect(r.commands[0].name).toBe("GS k");
    expect(r.commands[0].params.data).toBe("123456");
  });

  it("parses GS v 0 (raster image)", () => {
    const data = new Uint8Array([0x1d, 0x76, 0x30, 0x00, 0x01, 0x00, 0x02, 0x00, 0xff, 0x00]);
    const r = parseESCPOS(data);
    expect(r.commands[0].name).toBe("GS v 0");
    expect(r.commands[0].params.bytesPerRow).toBe(1);
    expect(r.commands[0].params.rows).toBe(2);
  });

  it("parses ESC p (cash drawer)", () => {
    const r = parseESCPOS(new Uint8Array([0x1b, 0x70, 0x00, 0x32, 0x32]));
    expect(r.commands[0].name).toBe("ESC p");
    expect(r.commands[0].params.pin).toBe(0);
  });

  it("parses DLE EOT (real-time status)", () => {
    const r = parseESCPOS(new Uint8Array([0x10, 0x04, 0x01]));
    expect(r.commands[0].name).toBe("DLE EOT");
    expect(r.commands[0].params.type).toBe(1);
  });

  it("parses ESC t (code page)", () => {
    const r = parseESCPOS(new Uint8Array([0x1b, 0x74, 0x11]));
    expect(r.commands[0].params.codePage).toBe(17);
  });
});

describe("DPL Parser", () => {
  it("parses STX L / E structure", () => {
    const r = parseDPL("\x02L\nD08\nS04\nA0832\nQ0001\nE");
    expect(r.commands.map((c) => c.type)).toContain("STX_L");
    expect(r.commands.map((c) => c.type)).toContain("E");
  });

  it("parses width", () => {
    const r = parseDPL("A0832");
    expect(r.widthDots).toBe(832);
  });

  it("parses density and speed", () => {
    const r = parseDPL("D08\nS04");
    expect(r.commands[0]).toMatchObject({ type: "DENSITY", params: "08" });
    expect(r.commands[1]).toMatchObject({ type: "SPEED", params: "04" });
  });
});

describe("SBPL Parser", () => {
  it("parses ESC A / ESC Z framing", () => {
    const r = parseSBPL(`\x1bA\x1bCS\x1bZ`);
    expect(r.commands[0].cmd).toBe("START");
    expect(r.commands[r.commands.length - 1].cmd).toBe("END");
  });

  it("parses H/V positioning", () => {
    const r = parseSBPL(`\x1bH0100\x1bV0050`);
    expect(r.commands[0]).toMatchObject({ cmd: "H", params: "0100" });
    expect(r.commands[1]).toMatchObject({ cmd: "V", params: "0050" });
  });

  it("parses K9B text", () => {
    const r = parseSBPL(`\x1bH0100\x1bV0050\x1bK9BHello SATO`);
    expect(r.elements).toHaveLength(1);
    if (r.elements[0].type === "text") {
      expect(r.elements[0].content).toBe("Hello SATO");
    }
  });
});

describe("Star PRNT Parser", () => {
  it("parses ESC @ (initialize)", () => {
    const r = parseStarPRNT(new Uint8Array([0x1b, 0x40]));
    expect(r.commands[0].name).toBe("ESC @");
  });

  it("parses Star alignment ESC GS a n", () => {
    const r = parseStarPRNT(new Uint8Array([0x1b, 0x1d, 0x61, 0x01]));
    expect(r.commands[0].name).toBe("ESC GS a");
  });

  it("parses Star bold ESC E / ESC F", () => {
    const r = parseStarPRNT(new Uint8Array([0x1b, 0x45, 0x48, 0x69, 0x1b, 0x46])); // ESC E + "Hi" + ESC F
    expect(r.commands[0].name).toBe("ESC E");
    expect(r.elements).toHaveLength(1);
    if (r.elements[0].type === "text") {
      expect(r.elements[0].options.bold).toBe(true);
    }
    expect(r.commands[2].name).toBe("ESC F");
  });

  it("parses Star raster mode", () => {
    const r = parseStarPRNT(
      new Uint8Array([
        0x1b,
        0x2a,
        0x72,
        0x41, // Enter raster
        0x62,
        0x01,
        0x00,
        0xff, // Row: b 1 0 FF
        0x1b,
        0x2a,
        0x72,
        0x42, // Exit raster
      ]),
    );
    expect(r.commands[0].name).toBe("ESC * r A");
    expect(r.commands[r.commands.length - 1].name).toBe("ESC * r B");
  });

  it("parses BEL (cash drawer)", () => {
    const r = parseStarPRNT(new Uint8Array([0x07]));
    expect(r.commands[0].name).toBe("BEL");
  });

  it("parses ESC d (partial cut)", () => {
    const r = parseStarPRNT(new Uint8Array([0x1b, 0x64, 0x01]));
    expect(r.commands[0].name).toBe("ESC d");
  });
});

describe("IPL Parser", () => {
  it("parses STX/ETX frames", () => {
    const r = parseIPL(`\x02\x1bC1\x03\x02\x1bP\x03\x02R\x03\x02\x1bE1\x03`);
    expect(r.commands.map((c) => c.type)).toContain("CREATE_FORMAT");
    expect(r.commands.map((c) => c.type)).toContain("PROGRAM_MODE");
    expect(r.commands.map((c) => c.type)).toContain("PRINT");
    expect(r.commands.map((c) => c.type)).toContain("END_FORMAT");
  });

  it("parses SI configuration", () => {
    const r = parseIPL(`\x02<SI>L400\x03\x02<SI>W832\x03\x02<SI>S60\x03`);
    expect(r.heightDots).toBe(400);
    expect(r.widthDots).toBe(832);
  });

  it("parses H (text) field", () => {
    const r = parseIPL(`\x02H1;o50,30;f0;h12;w12;c26;d3,Hello IPL\x03`);
    expect(r.elements).toHaveLength(1);
    if (r.elements[0].type === "text") {
      expect(r.elements[0].content).toBe("Hello IPL");
      expect(r.elements[0].options.x).toBe(50);
      expect(r.elements[0].options.y).toBe(30);
    }
  });

  it("parses W (box) field", () => {
    const r = parseIPL(`\x02W1;o10,20;f0;l200;h100;w2\x03`);
    expect(r.elements).toHaveLength(1);
    if (r.elements[0].type === "box") {
      expect(r.elements[0].options.width).toBe(200);
      expect(r.elements[0].options.height).toBe(100);
    }
  });

  it("parses L (line) field — horizontal", () => {
    const r = parseIPL(`\x02L1;o10,50;f0;l290;w2\x03`);
    expect(r.elements).toHaveLength(1);
    expect(r.elements[0].type).toBe("line");
  });

  it("parses L (line) field — vertical", () => {
    const r = parseIPL(`\x02L1;o50,10;f1;l190;w1\x03`);
    expect(r.elements).toHaveLength(1);
    if (r.elements[0].type === "line") {
      expect(r.elements[0].options.x1).toBe(50);
      expect(r.elements[0].options.y2).toBe(200); // y + len
    }
  });
});
