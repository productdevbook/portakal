<p align="center">
  <br>
  <img src="https://raw.githubusercontent.com/productdevbook/portakal/main/.github/assets/cover.png" alt="portakal — Universal printer language SDK" width="100%">
  <br><br>
  <b style="font-size: 2em;">portakal</b>
  <br><br>
  Universal printer language SDK — 9 languages, one API.
  <br>
  Text, barcodes, QR codes, images, shapes — anything you can print.
  <br>
  One API, every thermal printer. Pure TypeScript, zero dependencies.
  <br><br>
  <a href="https://npmjs.com/package/portakal"><img src="https://img.shields.io/npm/v/portakal?style=flat&colorA=18181B&colorB=F97316" alt="npm version"></a>
  <a href="https://npmjs.com/package/portakal"><img src="https://img.shields.io/npm/dm/portakal?style=flat&colorA=18181B&colorB=F97316" alt="npm downloads"></a>
  <a href="https://bundlephobia.com/result?p=portakal"><img src="https://img.shields.io/bundlephobia/minzip/portakal?style=flat&colorA=18181B&colorB=F97316" alt="bundle size"></a>
  <a href="https://github.com/productdevbook/portakal/blob/main/LICENSE"><img src="https://img.shields.io/github/license/productdevbook/portakal?style=flat&colorA=18181B&colorB=F97316" alt="license"></a>
  <br><br>
  <a href="https://portakal.productdevbook.com">Playground</a> · <a href="https://github.com/productdevbook/portakal">GitHub</a> · <a href="https://npmjs.com/package/portakal">npm</a>
</p>

> [!NOTE]
> portakal has **two ways** to print barcodes and QR codes:
>
> 1. **Printer-native** (`.barcode()` / `.qrcode()`) — sends commands to the printer's built-in encoder. Fast, zero dependencies, minimal data transfer. Works for most use cases.
> 2. **Software-rendered** (`.image()` + [`etiket`](https://github.com/productdevbook/etiket)) — renders barcodes/QR codes as images on the host, sends pixels to the printer. Pixel-perfect output, 40+ formats, styled QR codes, guaranteed consistency across all printers. You install `etiket` yourself — portakal stays zero-dependency.

## Quick Start

```sh
npm install portakal
```

### Product label

```ts
import { label } from "portakal/core";
import { tsc } from "portakal/lang/tsc";

const myLabel = label({ width: 40, height: 30, unit: "mm" })
  .text("ACME Corp", { x: 10, y: 10, size: 2 })
  .text("SKU: PRD-00123", { x: 10, y: 35 })
  .line({ x1: 5, y1: 55, x2: 310, y2: 55 })
  .box({ x: 5, y: 5, width: 310, height: 230, thickness: 2 });

const code = tsc.compile(myLabel); // TSC/TSPL2 commands
const svg = tsc.preview(myLabel); // SVG preview with TSC font metrics
```

### Same label → any language

```ts
import { label } from "portakal/core";
import { tsc } from "portakal/lang/tsc";
import { zpl } from "portakal/lang/zpl";
import { epl } from "portakal/lang/epl";
import { escpos } from "portakal/lang/escpos";

const myLabel = label({ width: 40, height: 30, unit: "mm" }).text("Hello World", {
  x: 10,
  y: 10,
  size: 2,
});

tsc.compile(myLabel); // TSC/TSPL2  — TSC, Gprinter, Xprinter, iDPRT
zpl.compile(myLabel); // Zebra ZPL II — GK420, ZT410, ZD620
epl.compile(myLabel); // Eltron EPL2 — LP/TLP 2824, GX420, ZD220
escpos.compile(myLabel); // ESC/POS — Epson, Bixolon, Star, Citizen (Uint8Array)
```

Only the imported languages enter your bundle — 100% tree-shakeable.

### Receipt (ESC/POS)

```ts
import { label } from "portakal/core";
import { escpos } from "portakal/lang/escpos";

const receipt = label({ width: 80, unit: "mm" })
  .text("MY STORE", { align: "center", bold: true, size: 2 })
  .text("123 Market St", { align: "center" })
  .text("================================")
  .text("Hamburger           x2    $25.98")
  .text("Cola                x1     $3.50")
  .text("================================")
  .text("TOTAL                     $29.48", { bold: true, size: 2 });

const bytes = escpos.compile(receipt); // Uint8Array
const svg = escpos.preview(receipt); // Receipt-style SVG
```

### Each module: compile + parse + preview + validate

```ts
import { tsc } from "portakal/lang/tsc";

// Compile: label → printer commands
tsc.compile(myLabel);

// Preview: label → SVG (per-language font metrics)
tsc.preview(myLabel);

// Parse: printer commands → structured data
tsc.parse(tscCode); // { commands, elements, widthDots, ... }

// Validate: check for errors
tsc.validate(tscCode); // { valid, errors, issues }
```

Available: `tsc`, `zpl`, `epl`, `cpcl`, `dpl`, `sbpl`, `escpos`, `starprnt`, `ipl`

### Barcode/QR via etiket

Use [`etiket`](https://github.com/productdevbook/etiket) for barcode/QR generation, then embed as image:

```ts
import { label } from "portakal/core";
import { tsc } from "portakal/lang/tsc";
import { barcodePNG, qrcodePNG } from "etiket";

const myLabel = label({ width: 40, height: 30, unit: "mm" })
  .text("Product Label", { x: 10, y: 5 })
  .image(barcodePNG("123456789", { type: "code128" }), { x: 10, y: 40, width: 200 })
  .image(qrcodePNG("https://example.com"), { x: 220, y: 40, width: 80 });

const code = tsc.compile(myLabel);
```

| **Best for** | Simple labels, fast printing | Pixel-perfect, guaranteed output |

## API

### `label(config)`

Creates a new label builder.

```ts
const builder = label({
  width: 40, // Label width
  height: 30, // Label height (omit for receipt/continuous)
  unit: "mm", // "mm" | "inch" | "dot" (default: "mm")
  dpi: 203, // Printer DPI (default: 203)
  gap: 3, // Gap between labels in mm (default: 3)
  speed: 4, // Print speed 1-10 (default: 4)
  density: 8, // Darkness 0-15 (default: 8)
  copies: 1, // Number of copies (default: 1)
});
```

### `.text(content, options?)`

```ts
builder.text("Hello", {
  x: 10, // X position in dots
  y: 20, // Y position in dots
  font: "2", // Font name/ID (printer-specific)
  size: 2, // Magnification (1-10)
  rotation: 0, // 0 | 90 | 180 | 270
  bold: true, // Bold (ESC/POS only)
  underline: true, // Underline (ESC/POS only)
  reverse: false, // White on black
  align: "center", // "left" | "center" | "right"
  maxWidth: 300, // Word-wrap width in dots
});
```

### `.image(bitmap, options?)`

```ts
builder.image(monochromeBitmap, {
  x: 10,
  y: 10, // Position
  width: 200, // Target width in dots
  height: 100, // Target height in dots
});
```

The `bitmap` must be a `MonochromeBitmap`:

```ts
interface MonochromeBitmap {
  data: Uint8Array; // 1-bit packed, row-major, MSB-first
  width: number; // Width in pixels
  height: number; // Height in pixels
  bytesPerRow: number; // ceil(width / 8)
}
```

### `.box(options)` / `.line(options)` / `.circle(options)`

```ts
builder.box({ x: 0, y: 0, width: 200, height: 100, thickness: 2, radius: 5 });
builder.line({ x1: 0, y1: 50, x2: 300, y2: 50, thickness: 1 });
builder.circle({ x: 100, y: 100, diameter: 60, thickness: 2 });
```

### `.raw(content)`

Escape hatch for printer-specific commands:

```ts
builder.raw("SET CUTTER ON"); // TSC
builder.raw("^FO10,10^FDCustom^FS"); // ZPL
builder.raw(new Uint8Array([0x1b, 0x70, 0x00, 0x32, 0x32])); // ESC/POS cash drawer
```

### Language Module Methods

Each language module (`tsc`, `zpl`, `epl`, `cpcl`, `dpl`, `sbpl`, `escpos`, `starprnt`, `ipl`) has:

| Method                | Output                   | Description                              |
| :-------------------- | :----------------------- | :--------------------------------------- |
| `lang.compile(label)` | `string` or `Uint8Array` | Compile to printer commands              |
| `lang.preview(label)` | `string`                 | SVG preview with language-specific fonts |
| `lang.parse(code)`    | `object`                 | Parse printer commands → structured data |
| `lang.validate(code)` | `object`                 | Validate commands for errors/warnings    |

### Image Processing

Convert any RGBA image to monochrome bitmap with dithering:

```ts
import { imageToMonochrome } from "portakal";

const bitmap = imageToMonochrome(rgbaPixels, width, height, {
  dither: "floyd-steinberg", // "threshold" | "floyd-steinberg" | "atkinson" | "ordered"
});

tsc.compile(label({ width: 40, height: 30 }).image(bitmap, { x: 10, y: 10 }));
```

### Receipt Layout

```ts
import { formatPair, separator, formatTable } from "portakal";

// Same-line left+right alignment
formatPair("Hamburger x2", "$25.98", 48);
// → "Hamburger x2                              $25.98"

// Separator line
separator("=", 48);
// → "================================================"

// Multi-column table
formatTable(
  [
    { width: 30, align: "left" },
    { width: 5, align: "center" },
    { width: 13, align: "right" },
  ],
  [
    ["Item", "Qty", "Price"],
    ["Hamburger", "2", "$25.98"],
  ],
  48,
);
```

### Cross-Compiler

Convert between any printer languages — world's first thermal printer translator:

```ts
import { convert } from "portakal";

// TSC → ZPL
const { output } = convert(tscCode, "tsc", "zpl");

// ZPL → ESC/POS
const { output } = convert(zplCode, "zpl", "escpos");

// EPL → CPCL
const { output } = convert(eplCode, "epl", "cpcl");
```

7 source × 9 target = **63 conversion paths**.

### Validation

Check printer commands for errors before sending to printer:

```ts
import { validate } from "portakal";

const result = validate(code, "tsc");
// { valid: false, errors: 1, warnings: 2, issues: [
//   { level: "error", message: "CLS must appear before label elements" },
//   { level: "warning", message: "No PRINT command found" },
// ]}
```

TSC validation: SIZE order, CLS before elements, PRINT required, DENSITY 0-15, SPEED 1-18.
ZPL validation: ^XA/^XZ required, ^FD without ^FO, ^PW range.

### Printer Profiles

Auto-configure DPI, paper width, and capabilities based on printer model:

```ts
import { label, getProfile, findByVendorId } from "portakal";

// Auto-DPI from profile
label({ width: 40, height: 30, printer: "tsc-te310" }); // 300 DPI
label({ width: 80, printer: "epson-tm-t88vi" }); // 203 DPI

// Lookup profiles
getProfile("zebra-zd420"); // { name, dpi, paperWidth, ... }
findByVendorId(0x04b8); // All Epson printers
```

20 built-in profiles: Epson, Star, Bixolon, Citizen, TSC, Zebra, SATO, Honeywell, Generic.

## Supported Printer Languages

| Language        | Printers                                       | Status             |
| :-------------- | :--------------------------------------------- | :----------------- |
| **TSC/TSPL2**   | TSC, Gprinter, Xprinter, iDPRT, Munbyn, Polono | :white_check_mark: |
| **ZPL II**      | Zebra GK420, ZT410, ZD620, ZQ series           | :white_check_mark: |
| **EPL2**        | Zebra LP/TLP 2824, GX420, ZD220, ZD420         | :white_check_mark: |
| **CPCL**        | Zebra QLn, ZQ mobile printers                  | :white_check_mark: |
| **DPL**         | Honeywell/Datamax label printers               | :white_check_mark: |
| **SBPL**        | SATO label printers                            | :white_check_mark: |
| **ESC/POS**     | Epson, Bixolon, Citizen, Star (compat mode)    | :white_check_mark: |
| **Star PRNT**   | Star TSP100/143/600/700 (native mode)          | :white_check_mark: |
| **IPL**         | Intermec/Honeywell printers                    | :white_check_mark: |
| **PPLA/PPLB**   | Argox (use DPL/EPL/ZPL)                        | :white_check_mark: |
| **Fingerprint** | Honeywell Smart Printers                       | Planned            |

## Transport

portakal generates commands only — it does **not** handle printer connections. Send the output over any transport you choose:

```ts
import { label } from "portakal/core";
import { tsc } from "portakal/lang/tsc";
import { escpos } from "portakal/lang/escpos";
import net from "node:net";

const myLabel = label({ width: 40, height: 30 }).text("Hello", { x: 10, y: 10 });
const commands = tsc.compile(myLabel);

// TCP (port 9100)
const socket = net.createConnection({ host: "192.168.1.100", port: 9100 });
socket.write(commands);
socket.end();

// ESC/POS (binary) over WebUSB
const receipt = label({ width: 80 }).text("Receipt");
const bytes = escpos.compile(receipt);
await usbDevice.transferOut(endpointNumber, bytes);
```

## Comparison

| Feature                      |            portakal            | [node-thermal-printer](https://github.com/Klemen1337/node-thermal-printer) | [escpos](https://github.com/node-escpos/driver) | [jszpl](https://github.com/DanieLeeuwner/JSZPL) |
| :--------------------------- | :----------------------------: | :------------------------------------------------------------------------: | :---------------------------------------------: | :---------------------------------------------: |
| Zero dependencies            |       :white_check_mark:       |                          :x: (pngjs, iconv-lite)                           |             :x: (get-pixels, jimp)              |               :white_check_mark:                |
| TypeScript-first             |       :white_check_mark:       |                                  Partial                                   |                     Partial                     |               :white_check_mark:                |
| Multi-language output        | :white_check_mark: 9 languages |                              :x: ESC/POS only                              |                :x: ESC/POS only                 |                  :x: ZPL only                   |
| Transport-agnostic           |       :white_check_mark:       |                               :x: (coupled)                                |                  :x: (coupled)                  |               :white_check_mark:                |
| Label printers (TSC/ZPL/EPL) |       :white_check_mark:       |                                    :x:                                     |                       :x:                       |                    ZPL only                     |
| Receipt printers (ESC/POS)   |       :white_check_mark:       |                             :white_check_mark:                             |               :white_check_mark:                |                       :x:                       |
| Image support                |       :white_check_mark:       |                             :white_check_mark:                             |               :white_check_mark:                |               :white_check_mark:                |
| Barcode/QR (via etiket)      |       :white_check_mark:       |                             :white_check_mark:                             |               :white_check_mark:                |               :white_check_mark:                |
| Image dithering              |       :white_check_mark:       |                                    :x:                                     |                       :x:                       |                       :x:                       |
| Receipt layout engine        |       :white_check_mark:       |                                  Partial                                   |                       :x:                       |                       :x:                       |
| SVG preview                  |       :white_check_mark:       |                                    :x:                                     |                       :x:                       |                       :x:                       |
| Command parser (reverse)     |  :white_check_mark: 9 parsers  |                                    :x:                                     |                       :x:                       |                       :x:                       |
| Cross-compiler (translate)   |  :white_check_mark: 63 paths   |                                    :x:                                     |                       :x:                       |                       :x:                       |
| Command validation           |       :white_check_mark:       |                                    :x:                                     |                       :x:                       |                       :x:                       |
| Printer profiles             |     :white_check_mark: 20      |                                    :x:                                     |                       :x:                       |                       :x:                       |
| Works in browser             |       :white_check_mark:       |                                    :x:                                     |                       :x:                       |               :white_check_mark:                |
| No native modules (no gyp)   |       :white_check_mark:       |                                    :x:                                     |                       :x:                       |               :white_check_mark:                |
| Pure ESM                     |       :white_check_mark:       |                                 :x: (CJS)                                  |                    :x: (CJS)                    |                    :x: (CJS)                    |

**portakal is the only library that generates** 9 printer languages from a single API with zero dependencies.

## Features

- Zero dependencies — pure computation, no native modules, no node-gyp
- **9 printer languages** — TSC, ZPL, EPL, CPCL, DPL, SBPL, ESC/POS, Star PRNT, IPL
- **Tree-shakeable** — sub-path exports for every module (`portakal/tsc`, `portakal/image`, etc.)
- Pure ESM, edge-runtime compatible (Cloudflare Workers, Deno, Bun)
- TypeScript-first with strict types (tsgo)
- Transport-agnostic — generates commands, you handle the connection
- Fluent builder API — one label definition compiles to any language
- **Image processing** — RGBA → monochrome with 4 dithering algorithms (Floyd-Steinberg, Atkinson, ordered, threshold)
- **Receipt layout engine** — same-line left+right alignment, tables, word-wrap, separators
- **SVG preview** — `lang.preview(label)` renders labels without a physical printer
- **9 parsers** — reverse-parse printer commands back to structured data (TSC, ZPL, EPL, CPCL, ESC/POS, DPL, SBPL, Star PRNT, IPL)
- Drawing primitives — box, line, circle, diagonal
- Raw command passthrough for advanced/unsupported features
- Optional [`etiket`](https://github.com/productdevbook/etiket) integration for barcode/QR images (40+ formats)
- Works in browser, Node.js, Deno, Bun, Electron
- **UTF-8 encoding engine** — auto code page selection (CP437, CP858, CP1252, CP866, CP857)
- **Cross-compiler** — convert between any languages (63 paths: TSC↔ZPL↔EPL↔CPCL↔DPL↔SBPL↔IPL↔ESC/POS↔Star)
- **Real validation** — parameter ranges, command order, structure checks
- **20 printer profiles** — auto-DPI, auto-width by model (Epson, Star, Zebra, TSC, SATO, etc.)
- **Language modules** — each language is a standalone module (compile + parse + preview + validate)
- **Per-language SVG preview** — TSC fonts differ from ZPL fonts, ESC/POS renders receipt-style
- 447 tests across 28 test files

## Help Us Test — Real Printer Output Needed

We're building the most accurate open-source printer language SDK, but we need **real-world validation**. If you have access to a thermal printer, we'd love your help comparing portakal's output against actual printed labels.

### How to help

1. **Pick a language** — ZPL, TSC, EPL, CPCL, or any supported language
2. **Write a test label** — use portakal to generate commands, or paste raw printer code into the [Playground](https://portakal.productdevbook.com)
3. **Print it** — send the commands to a real printer
4. **Compare** — take a photo of the printed label and a screenshot of portakal's SVG preview
5. **Report** — open an [issue](https://github.com/productdevbook/portakal/issues/new) with:
   - The printer code (ZPL, TSC, etc.)
   - Screenshot of portakal's preview
   - Photo of the actual printed label
   - What's different (position, font size, spacing, barcode, etc.)

### Example: ZPL test label

```zpl
^XA
^CF0,60
^FO50,50^GB100,100,100^FS
^FO75,75^FR^GB100,100,100^FS
^FO93,93^GB40,40,40^FS
^FO220,50^FDIntershipping, Inc.^FS
^CF0,30
^FO220,115^FD1000 Shipping Lane^FS
^FO220,155^FDShelbyville TN 38102^FS
^FO50,250^GB700,3,3^FS
^CFA,30
^FO50,300^FDJohn Doe^FS
^FO50,340^FD100 Main Street^FS
^FO50,380^FDSpringfield TN 39021^FS
^BY5,2,270
^FO100,550^BC^FD12345678^FS
^FO50,900^GB700,250,3^FS
^FO400,900^GB3,250,3^FS
^CF0,40
^FO100,960^FDCtr. X34B-1^FS
^CF0,190
^FO470,955^FDCA^FS
^XZ
```

Paste this into the [Playground](https://portakal.productdevbook.com) (Validate tab, select ZPL) and compare with [Labelary](http://labelary.com/viewer.html) or your real printer.

### What we're looking for

| Area | What to check |
|:-----|:-------------|
| **Text positioning** | Are texts at the correct x,y? Do they overflow? |
| **Font sizes** | Does `^CF0,60` look the same size as the real printer? |
| **Font rendering** | Font 0 should be proportional (Helvetica-like), Font A should be monospace |
| **^FR reverse (XOR)** | The Intershipping logo (3 overlapping boxes) should show black L-shape + white area + small black square |
| **Barcodes** | Correct height from `^BY`? Correct width? Readable interpretation line? |
| **Box/line thickness** | Does `^GB` draw borders inward? Correct corner radius? |
| **^LH, ^LS, ^LT offsets** | Do label home / shift / top offsets apply correctly? |
| **ESC/POS receipts** | Alignment, bold, text sizing on Epson/Star/Bixolon |

Even a "looks correct" confirmation is helpful. Every report makes the SDK more reliable for everyone.

> [!TIP]
> No printer? You can still help by comparing our preview against [Labelary](http://labelary.com/viewer.html) (ZPL) or other online viewers and reporting any visual differences.

## Contributing

Contributions are welcome! Here are areas where help is especially appreciated:

- **Arabic/Hebrew RTL** support (bidi algorithm + Arabic shaping)
- **GS1/UDI label standards** (SSCC, GTIN, FMD, DSCSA templates)
- **Star TSP100** raster-only text rendering
- **CJK encoding** (GB18030, Shift_JIS, Big5, EUC-KR)
- **Fingerprint** (Honeywell BASIC-like) compiler
- **WebUSB/WebSerial/Web Bluetooth** transport adapters
- Additional printer profiles
- Parser validation rules for more languages

```bash
pnpm install    # Install dependencies
pnpm dev        # Run tests in watch mode
pnpm test       # Lint + typecheck + test
pnpm build      # Build for production
```

## License

Published under the [MIT](https://github.com/productdevbook/portakal/blob/main/LICENSE) license.
