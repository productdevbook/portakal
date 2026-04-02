import { describe, expect, it } from "vitest";
import { epl } from "../src/lang/epl";
import { label } from "../src/builder";

describe("EPL2 compiler", () => {
  it("generates basic label structure", () => {
    const output = epl.compile(label({ width: 40, height: 30 }));

    expect(output).toContain("N\n");
    expect(output).toContain("q320\n");
    expect(output).toContain("Q240,");
    expect(output).toContain("S4\n");
    expect(output).toContain("D8\n");
    expect(output).toContain("P1\n");
  });

  it("generates text command", () => {
    const output = epl.compile(
      label({ width: 40, height: 30 }).text("Hello EPL", { x: 10, y: 20, font: "3", size: 2 }),
    );

    expect(output).toContain('A10,20,0,3,2,2,N,"Hello EPL"');
  });

  it("generates reverse text", () => {
    const output = epl.compile(
      label({ width: 40, height: 30 }).text("Reverse", { x: 10, y: 20, reverse: true }),
    );

    expect(output).toContain('A10,20,0,2,1,1,R,"Reverse"');
  });

  it("generates box command", () => {
    const output = epl.compile(
      label({ width: 40, height: 30 }).box({ x: 5, y: 5, width: 200, height: 100, thickness: 2 }),
    );

    expect(output).toContain("X5,5,205,105,2");
  });

  it("generates horizontal line", () => {
    const output = epl.compile(
      label({ width: 40, height: 30 }).line({ x1: 10, y1: 50, x2: 300, y2: 50, thickness: 2 }),
    );

    expect(output).toContain("LO10,50,290,2");
  });

  it("generates image GW command header", () => {
    const bitmap = {
      data: new Uint8Array([0xff, 0x00]),
      width: 8,
      height: 2,
      bytesPerRow: 1,
    };

    const output = epl.compile(label({ width: 40, height: 30 }).image(bitmap, { x: 10, y: 10 }));

    expect(output).toContain("GW10,10,1,2");
  });

  it("handles multiple copies", () => {
    const output = epl.compile(label({ width: 40, height: 30, copies: 10 }));
    expect(output).toContain("P10");
  });

  it("handles raw passthrough", () => {
    const output = epl.compile(label({ width: 40, height: 30 }).raw("OD"));

    expect(output).toContain("OD");
  });
});
