import type { LabelElement } from "../types";

/**
 * ZPL II Parser — converts ZPL commands back to structured data.
 * Based on Zebra ZPL II Programming Guide (P1012728-011) and
 * zpl-toolchain spec files (223/223 commands).
 *
 * World's first open-source TypeScript ZPL parser.
 */

/** Parsed ZPL command */
export interface ZPLCommand {
  /** Command code (e.g., "^FO", "~SD") */
  code: string;
  /** Raw parameters string */
  rawParams: string;
  /** Parsed parameters */
  params: string[];
}

/** ZPL parse result */
export interface ZPLParseResult {
  /** All parsed commands */
  commands: ZPLCommand[];
  /** Label width in dots */
  widthDots: number;
  /** Label height in dots */
  heightDots: number;
  /** Elements for preview rendering */
  elements: LabelElement[];
  /** Parse warnings */
  warnings: string[];
}

/**
 * Tokenize ZPL source into commands.
 * ZPL commands start with ^ (caret) or ~ (tilde).
 * ^FD data runs until ^FS.
 */
export function tokenize(code: string): ZPLCommand[] {
  const commands: ZPLCommand[] = [];
  let i = 0;

  while (i < code.length) {
    // Skip whitespace/newlines between commands
    if (code[i] === " " || code[i] === "\r" || code[i] === "\n" || code[i] === "\t") {
      i++;
      continue;
    }

    // Command starts with ^ or ~
    if (code[i] === "^" || code[i] === "~") {
      const prefix = code[i];
      i++;

      // Read command code (1-2 alphanumeric chars after ^ or ~)
      // Examples: ^XA, ^FO, ^A (font), ^B3 (Code39), ^BC (Code128), ~SD, ^A@ (named font)
      let cmdCode = prefix;
      if (i < code.length && /[A-Za-z]/.test(code[i])) {
        cmdCode += code[i].toUpperCase();
        i++;
      }
      if (i < code.length && /[A-Za-z0-9@]/.test(code[i])) {
        cmdCode += code[i].toUpperCase();
        i++;
      }

      // Read parameters until next ^ or ~ or end
      let rawParams = "";

      if (cmdCode === "^FD" || cmdCode === "^FV") {
        // ^FD data runs until ^FS (can contain anything except ^FS)
        const endMarker = "^FS";
        const endIdx = code.indexOf(endMarker, i);
        if (endIdx >= 0) {
          rawParams = code.slice(i, endIdx).trim();
          i = endIdx; // ^FS will be parsed as next command
        } else {
          rawParams = code.slice(i).trim();
          i = code.length;
        }
      } else if (cmdCode === "^GF" || cmdCode === "~DG") {
        // Graphic data — read until next ^ or ~, may contain anything
        const start = i;
        while (i < code.length && code[i] !== "^" && code[i] !== "~") {
          i++;
        }
        rawParams = code.slice(start, i).trim();
      } else if (cmdCode === "^FX") {
        // Comment — read until next ^
        const start = i;
        while (i < code.length && code[i] !== "^" && code[i] !== "~") {
          i++;
        }
        rawParams = code.slice(start, i).trim();
      } else {
        // Normal parameters — read until next ^ or ~ or newline
        const start = i;
        while (i < code.length && code[i] !== "^" && code[i] !== "~") {
          if (code[i] === "\r" || code[i] === "\n") break;
          i++;
        }
        rawParams = code.slice(start, i).trim();
      }

      const params = rawParams ? rawParams.split(",").map((s) => s.trim()) : [];
      commands.push({ code: cmdCode, rawParams, params });
    } else {
      // Skip unknown character
      i++;
    }
  }

  return commands;
}

/**
 * Parse ZPL II source code into structured result.
 */
export function parseZPL(code: string): ZPLParseResult {
  const commands = tokenize(code);
  const elements: LabelElement[] = [];
  const warnings: string[] = [];
  let widthDots = 812; // 4 inch default
  let heightDots = 1218; // 6 inch default

  // State tracking
  let fieldX = 0;
  let fieldY = 0;
  let labelHomeX = 0;
  let labelHomeY = 0;
  let labelShift = 0;
  let labelTop = 0;
  let currentFont = "0";
  let currentFontH = 30;
  let currentFontW = 30;
  let currentOrientation = "N";
  let fieldReverse = false;
  let fieldData = "";
  let barcodeType = "";
  let barcodeHeight = 10; // ^BY default height
  let barcodeModuleWidth = 2; // ^BY default module width
  let fieldBaseline = false;
  // ^FB state
  let fieldBlockWidth = 0;
  let fieldBlockMaxLines = 1;
  let fieldBlockJustify = "L";

  for (const cmd of commands) {
    // Handle ^A + font_letter (^A0, ^AA, ^AB, etc.) — font letter is part of command code
    if (cmd.code.startsWith("^A") && cmd.code.length === 3 && cmd.code !== "^A@") {
      currentFont = cmd.code[2];
      const parts = cmd.rawParams.split(",");
      if (parts[0]) {
        const o = parts[0].replace(/[^NRIB]/g, "");
        if (o) currentOrientation = o;
      }
      if (parts[1]) {
        currentFontH = Number(parts[1]) || currentFontH;
        // ZPL spec: if w omitted, w = h
        currentFontW = parts[2] ? Number(parts[2]) || currentFontH : currentFontH;
      }
      continue;
    }

    // Handle ^B + barcode_type (^B0-^B9, ^BA-^BZ) — barcode type is part of command code
    if (cmd.code.startsWith("^B") && cmd.code.length === 3 && cmd.code !== "^BY") {
      barcodeType = cmd.code;
      // params[0] = orientation, params[1] = height (overrides ^BY default)
      if (cmd.params[1]) {
        const h = Number(cmd.params[1]);
        if (h > 0) barcodeHeight = h;
      }
      continue;
    }

    switch (cmd.code) {
      // ===== FORMAT STRUCTURE =====
      case "^XA":
        // Start format — reset state
        fieldX = 0;
        fieldY = 0;
        fieldReverse = false;
        break;

      case "^XZ":
        // End format
        break;

      // ===== LABEL CONFIGURATION =====
      case "^PW":
        if (cmd.params[0]) widthDots = Number(cmd.params[0]);
        break;

      case "^LL":
        if (cmd.params[0]) heightDots = Number(cmd.params[0]);
        break;

      case "^LH":
        // Label home — offset added to all ^FO positions
        labelHomeX = Number(cmd.params[0] ?? 0);
        labelHomeY = Number(cmd.params[1] ?? 0);
        break;

      case "^LS":
        // Label shift — horizontal offset for all fields
        labelShift = Number(cmd.params[0] ?? 0);
        break;

      case "^LT":
        // Label top — vertical offset (-120 to 120)
        labelTop = Number(cmd.params[0] ?? 0);
        break;

      case "^LR":
        // Label reverse
        break;

      // ===== PRINT CONTROL =====
      case "^PQ":
        // Print quantity
        break;

      case "^PR":
        // Print rate/speed
        break;

      case "^MD":
      case "~SD":
        // Darkness
        break;

      case "^MM":
        // Print mode (tear/peel/rewind/cutter)
        break;

      case "^MT":
        // Media type (thermal transfer/direct)
        break;

      case "^MN":
        // Media tracking
        break;

      case "^PO":
        // Print orientation
        break;

      case "^PM":
        // Print mirror
        break;

      case "^MU":
        // Set units
        break;

      // ===== FIELD COMMANDS =====
      case "^FO":
        // ^FO is relative to ^LH, plus ^LS horizontal and ^LT vertical offset
        fieldX = Number(cmd.params[0] ?? 0) + labelHomeX + labelShift;
        fieldY = Number(cmd.params[1] ?? 0) + labelHomeY + labelTop;
        fieldReverse = false;
        fieldBaseline = false;
        fieldBlockWidth = 0;
        break;

      case "^FT":
        // ^FT uses baseline positioning (y = bottom of text, not top)
        // ^FT is also relative to ^LH + ^LS + ^LT
        fieldX = Number(cmd.params[0] ?? 0) + labelHomeX + labelShift;
        fieldY = Number(cmd.params[1] ?? 0) + labelHomeY + labelTop;
        fieldBaseline = true;
        fieldBlockWidth = 0;
        break;

      case "^FD":
      case "^FV":
        fieldData = cmd.rawParams;
        break;

      case "^FS": {
        // Field separator — if there's pending data, create element
        if (fieldData) {
          // Adjust y for baseline positioning (^FT): convert baseline to top-left
          const adjustedY = fieldBaseline ? fieldY - currentFontH : fieldY;

          if (barcodeType) {
            // Barcode field — store as raw ZPL with ^BY module width for preview
            elements.push({
              type: "raw",
              content: `^BY${barcodeModuleWidth}^FO${fieldX},${adjustedY}${barcodeType}N,${barcodeHeight},Y^FD${fieldData}^FS`,
            });
            barcodeType = "";
          } else {
            // Text field — store font and dot dimensions for accurate preview
            const align = fieldBlockWidth > 0 && fieldBlockJustify === "C"
              ? "center" as const
              : fieldBlockWidth > 0 && fieldBlockJustify === "R"
                ? "right" as const
                : undefined;
            elements.push({
              type: "text",
              content: fieldData,
              options: {
                x: fieldX,
                y: adjustedY,
                font: currentFont,
                size: 1,
                xScale: currentFontW,
                yScale: currentFontH,
                reverse: fieldReverse || undefined,
                maxWidth: fieldBlockWidth || undefined,
                align,
              },
            });
          }
          fieldData = "";
        }
        fieldReverse = false;
        fieldBaseline = false;
        break;
      }

      case "^FR":
        fieldReverse = true;
        break;

      case "^FN":
        // Field number (for templates)
        break;

      case "^FH":
        // Field hex indicator
        break;

      case "^FP":
        // Field parameter (direction)
        break;

      case "^FW":
        // Field default orientation
        if (cmd.params[0]) currentOrientation = cmd.params[0];
        break;

      case "^FX":
        // Comment — ignore
        break;

      case "^A@":
        // Use named font
        break;

      case "^CF":
        // Change default font: ^CFf,h,w — if w omitted, w = h
        if (cmd.params[0]) currentFont = cmd.params[0];
        if (cmd.params[1]) {
          currentFontH = Number(cmd.params[1]);
          currentFontW = cmd.params[2] ? Number(cmd.params[2]) : currentFontH;
        }
        break;

      case "^CI":
        // Change international font/encoding
        break;

      case "^CW":
        // Font identifier mapping
        break;

      // ===== TEXT BLOCK =====
      case "^FB":
        // Field block: ^FBwidth,maxLines,lineSpacing,justify,hangingIndent
        fieldBlockWidth = Number(cmd.params[0] ?? 0);
        fieldBlockMaxLines = Number(cmd.params[1] ?? 1);
        fieldBlockJustify = (cmd.params[3] ?? "L").toUpperCase();
        break;

      case "^TB":
        // Text block
        break;

      // ===== BARCODE COMMANDS =====
      case "^BY":
        // Bar code field default: ^BYw,r,h
        if (cmd.params[0]) barcodeModuleWidth = Number(cmd.params[0]) || barcodeModuleWidth;
        // params[1] = wide-to-narrow ratio (not used for Code 128)
        if (cmd.params[2]) barcodeHeight = Number(cmd.params[2]) || barcodeHeight;
        break;

      // Barcode commands are handled above (^B + type letter/digit)

      // ===== GRAPHIC COMMANDS =====
      case "^GB": {
        const w = Number(cmd.params[0] ?? 1);
        const h = Number(cmd.params[1] ?? 1);
        const t = Number(cmd.params[2] ?? 1);
        const color = (cmd.params[3] ?? "B").toUpperCase();
        const rIndex = Number(cmd.params[4] ?? 0);
        // ZPL corner radius: index 0-8 → dots = (index/8) * (shorter_side/2)
        const r = rIndex > 0 ? (rIndex / 8) * (Math.min(w, h) / 2) : 0;
        // ^FR XORs the field: black↔white. Color W also inverts.
        const isWhite = fieldReverse ? color !== "W" : color === "W";
        const isFilled = t >= Math.min(w, h);
        if (isWhite && isFilled) {
          // White filled box → erase region (used for XOR effect in logos etc.)
          elements.push({
            type: "erase",
            options: { x: fieldX, y: fieldY, width: w, height: h },
          });
        } else {
          elements.push({
            type: "box",
            options: { x: fieldX, y: fieldY, width: w, height: h, thickness: t, radius: r },
          });
        }
        fieldReverse = false;
        break;
      }

      case "^GC": {
        const d = Number(cmd.params[0] ?? 1);
        const t = Number(cmd.params[1] ?? 1);
        const gcColor = (cmd.params[2] ?? "B").toUpperCase();
        const gcIsWhite = fieldReverse ? gcColor !== "W" : gcColor === "W";
        if (gcIsWhite && t >= d / 2) {
          // White filled circle → erase region
          elements.push({
            type: "erase",
            options: { x: fieldX, y: fieldY, width: d, height: d },
          });
        } else {
          elements.push({
            type: "circle",
            options: { x: fieldX, y: fieldY, diameter: d, thickness: t },
          });
        }
        fieldReverse = false;
        break;
      }

      case "^GD": {
        const w = Number(cmd.params[0] ?? 1);
        const h = Number(cmd.params[1] ?? 1);
        const t = Number(cmd.params[2] ?? 1);
        // params[3] = color, params[4] = orientation (R or L)
        const dir = (cmd.params[4] ?? "R").toUpperCase();
        // Note: ^FR on diagonal lines inverts color — for SVG preview we skip
        // white diagonal lines as they're rarely used and hard to render in SVG
        if (dir === "R") {
          elements.push({
            type: "line",
            options: { x1: fieldX, y1: fieldY, x2: fieldX + w, y2: fieldY + h, thickness: t },
          });
        } else {
          elements.push({
            type: "line",
            options: { x1: fieldX + w, y1: fieldY, x2: fieldX, y2: fieldY + h, thickness: t },
          });
        }
        fieldReverse = false;
        break;
      }

      case "^GE":
        // Graphic ellipse
        break;

      case "^GF":
        // Graphic field (image data)
        break;

      case "^GS":
        // Graphic symbol
        break;

      // ===== IMAGE COMMANDS =====
      case "~DG":
        // Download graphic
        break;

      case "^ID":
        // Image delete
        break;

      case "^IL":
        // Image load
        break;

      case "^IM":
        // Image move (print stored image)
        break;

      case "^IS":
        // Image save
        break;

      case "^XG":
        // Recall graphic
        break;

      // ===== TEMPLATE COMMANDS =====
      case "^DF":
        // Define format (store template)
        break;

      case "^XF":
        // Recall format (load template)
        break;

      // ===== SERIAL/COUNTER =====
      case "^SN":
        // Serialization
        break;

      // ===== CONFIGURATION =====
      case "^JM":
      case "^JU":
      case "^JZ":
      case "^SZ":
      case "^SC":
      case "^SE":
      case "^SF":
      case "^SI":
      case "^SL":
      case "^SO":
      case "^SP":
      case "^SQ":
      case "^SR":
      case "^SS":
      case "^ST":
      case "^SX":
        break;

      // ===== STATUS/HOST COMMANDS =====
      case "~HI":
      case "~HS":
      case "~HM":
      case "~HU":
      case "~HB":
      case "~HD":
      case "~HQ":
      case "^HH":
      case "^HF":
      case "^HG":
      case "^HL":
      case "^HR":
      case "^HT":
      case "^HV":
      case "^HW":
      case "^HY":
      case "^HZ":
        break;

      // ===== NETWORK =====
      case "^NC":
      case "^ND":
      case "^NI":
      case "^NN":
      case "^NP":
      case "^NS":
      case "^NT":
      case "^NW":
      case "~NC":
      case "~NR":
      case "~NT":
      case "^NB":
        break;

      // ===== RFID =====
      case "^RF":
      case "^RL":
      case "^RB":
      case "^RS":
      case "^RU":
      case "^RW":
        break;

      // ===== MISC COMMANDS =====
      case "^WD":
      case "^WA":
      case "^WE":
      case "^WL":
      case "^WP":
      case "^WR":
      case "^WS":
      case "^WX":
      case "~WC":
      case "~WL":
      case "~WQ":
      case "~WR":
      case "^MC":
      case "^MF":
      case "^MI":
      case "^ML":
      case "^MP":
      case "^MW":
      case "^MA":
      case "^CC":
      case "^CD":
      case "^CM":
      case "^CN":
      case "^CO":
      case "^CP":
      case "^CT":
      case "^CV":
      case "^FC":
      case "^FE":
      case "^FL":
      case "^FM":
      case "^JB":
      case "^JH":
      case "^JI":
      case "^JJ":
      case "^JS":
      case "^JT":
      case "^JW":
      case "^KC":
      case "^KD":
      case "^KL":
      case "^KN":
      case "^KP":
      case "^KV":
      case "^LF":
      case "^PA":
      case "^PF":
      case "^PH":
      case "^PN":
      case "^PP":
      case "^TO":
      case "^XB":
      case "^XS":
      case "^ZZ":
      case "~DB":
      case "~DE":
      case "~DN":
      case "~DS":
      case "~DT":
      case "~DU":
      case "~DY":
      case "~EG":
      case "~JA":
      case "~JB":
      case "~JC":
      case "~JD":
      case "~JE":
      case "~JF":
      case "~JG":
      case "~JI":
      case "~JL":
      case "~JN":
      case "~JO":
      case "~JP":
      case "~JQ":
      case "~JR":
      case "~JS":
      case "~JX":
      case "~KB":
      case "~PL":
      case "~PM":
      case "~PR":
      case "~PS":
      case "~RO":
      case "~TA":
        break;

      default:
        if (cmd.code !== "^FS") {
          warnings.push(`Unknown command: ${cmd.code}`);
        }
        break;
    }
  }

  return { commands, widthDots, heightDots, elements, warnings };
}
