/**
 * HTML-like markup language for label design.
 * Parses <label>...</label> markup into LabelBuilder.
 *
 * @example
 * ```ts
 * import { tsc } from "./lang/tsc";
 * tsc.compile(markup(`
 *   <label width="40mm" height="30mm">
 *     <text x="10" y="10" size="2" bold>Hello World</text>
 *     <box x="5" y="5" width="310" height="230" border="2" />
 *   </label>
 * `));
 * ```
 */

import { LabelBuilder, label } from "./builder";

interface ParsedTag {
  name: string;
  attrs: Record<string, string>;
  selfClosing: boolean;
  content?: string;
}

/** Parse unit value: "40mm" → { value: 40, unit: "mm" }, "10" → { value: 10, unit: "dot" } */
function parseUnitValue(s: string): number {
  // Just strip units and return number — builder handles unit conversion
  return Number(s.replace(/\s*(mm|inch|dot|px)$/i, ""));
}

/** Parse a single tag: <name attr="value" ... /> or <name attr="value">  */
function parseTag(s: string): ParsedTag | null {
  const selfCloseMatch = s.match(/^<(\w+)((?:\s+[\w-]+(?:="[^"]*")?)*)\s*\/>/);
  if (selfCloseMatch) {
    return {
      name: selfCloseMatch[1].toLowerCase(),
      attrs: parseAttrs(selfCloseMatch[2]),
      selfClosing: true,
    };
  }

  const openMatch = s.match(/^<(\w+)((?:\s+[\w-]+(?:="[^"]*")?)*)\s*>/);
  if (openMatch) {
    return {
      name: openMatch[1].toLowerCase(),
      attrs: parseAttrs(openMatch[2]),
      selfClosing: false,
    };
  }

  return null;
}

/** Parse attributes: ` x="10" y="20" bold` → { x: "10", y: "20", bold: "true" } */
function parseAttrs(s: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([\w-]+)(?:="([^"]*)")?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    attrs[m[1]] = m[2] ?? "true";
  }
  return attrs;
}

/** Get unit from label config attribute */
function getUnit(s: string): "mm" | "inch" | "dot" {
  if (s.endsWith("mm")) return "mm";
  if (s.endsWith("inch") || s.endsWith("in")) return "inch";
  return "dot";
}

/**
 * Parse markup and return a LabelBuilder.
 */
export function markup(source: string): LabelBuilder {
  const trimmed = source.trim();

  // Extract <label ...> attributes
  const labelMatch = trimmed.match(/<label((?:\s+[\w-]+(?:="[^"]*")?)*)\s*>/i);
  if (!labelMatch) {
    throw new Error("Markup must contain a <label> root element");
  }

  const labelAttrs = parseAttrs(labelMatch[1]);
  const unit = getUnit(labelAttrs.width ?? labelAttrs.height ?? "");

  const config: any = {
    width: parseUnitValue(labelAttrs.width ?? "40mm"),
    height: labelAttrs.height ? parseUnitValue(labelAttrs.height) : undefined,
    unit: unit || "mm",
    dpi: labelAttrs.dpi ? Number(labelAttrs.dpi) : undefined,
    gap: labelAttrs.gap ? parseUnitValue(labelAttrs.gap) : undefined,
    speed: labelAttrs.speed ? Number(labelAttrs.speed) : undefined,
    density: labelAttrs.density ? Number(labelAttrs.density) : undefined,
    copies: labelAttrs.copies ? Number(labelAttrs.copies) : undefined,
    printer: labelAttrs.printer ?? undefined,
  };

  const b = label(config);

  // Extract inner content between <label> and </label>
  const innerMatch = trimmed.match(/<label[^>]*>([\s\S]*)<\/label>/i);
  if (!innerMatch) return b;

  const inner = innerMatch[1];

  // Find all tags
  const tagRegex = /<(\w+)((?:\s+[\w-]+(?:="[^"]*")?)*)\s*(?:\/>|>([\s\S]*?)<\/\1>)/gi;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(inner)) !== null) {
    const tagName = match[1].toLowerCase();
    const attrs = parseAttrs(match[2]);
    const content = match[3]?.trim() ?? "";

    switch (tagName) {
      case "text":
        b.text(content, {
          x: attrs.x ? Number(attrs.x) : undefined,
          y: attrs.y ? Number(attrs.y) : undefined,
          font: attrs.font,
          size: attrs.size ? Number(attrs.size) : undefined,
          rotation: attrs.rotation ? (Number(attrs.rotation) as any) : undefined,
          bold: attrs.bold === "true" || attrs.bold === "" ? true : undefined,
          underline: attrs.underline === "true" || attrs.underline === "" ? true : undefined,
          reverse: attrs.reverse === "true" || attrs.reverse === "" ? true : undefined,
          align: (attrs.align as any) ?? undefined,
          maxWidth: attrs.maxwidth
            ? Number(attrs.maxwidth)
            : attrs["max-width"]
              ? Number(attrs["max-width"])
              : undefined,
        });
        break;

      case "line":
        b.line({
          x1: Number(attrs.x1 ?? 0),
          y1: Number(attrs.y1 ?? 0),
          x2: Number(attrs.x2 ?? 0),
          y2: Number(attrs.y2 ?? 0),
          thickness: attrs.thickness
            ? Number(attrs.thickness)
            : attrs.border
              ? Number(attrs.border)
              : undefined,
        });
        break;

      case "box":
        b.box({
          x: Number(attrs.x ?? 0),
          y: Number(attrs.y ?? 0),
          width: Number(attrs.width ?? 100),
          height: Number(attrs.height ?? 100),
          thickness: attrs.thickness
            ? Number(attrs.thickness)
            : attrs.border
              ? Number(attrs.border)
              : undefined,
          radius: attrs.radius ? Number(attrs.radius) : undefined,
        });
        break;

      case "circle":
        b.circle({
          x: Number(attrs.x ?? 0),
          y: Number(attrs.y ?? 0),
          diameter: Number(attrs.diameter ?? attrs.size ?? 50),
          thickness: attrs.thickness ? Number(attrs.thickness) : undefined,
        });
        break;

      case "ellipse":
        b.ellipse({
          x: Number(attrs.x ?? 0),
          y: Number(attrs.y ?? 0),
          width: Number(attrs.width ?? 100),
          height: Number(attrs.height ?? 60),
          thickness: attrs.thickness ? Number(attrs.thickness) : undefined,
        });
        break;

      case "reverse":
        b.reverse({
          x: Number(attrs.x ?? 0),
          y: Number(attrs.y ?? 0),
          width: Number(attrs.width ?? 100),
          height: Number(attrs.height ?? 30),
        });
        break;

      case "erase":
        b.erase({
          x: Number(attrs.x ?? 0),
          y: Number(attrs.y ?? 0),
          width: Number(attrs.width ?? 100),
          height: Number(attrs.height ?? 30),
        });
        break;

      case "raw":
        b.raw(content);
        break;
    }
  }

  return b;
}
