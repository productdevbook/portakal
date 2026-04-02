<p align="center">
  <br>
  <b style="font-size: 2em;">portakal</b>
  <br><br>
  Universal printer language SDK — TSC, ZPL, EPL, ESC/POS and more.
  <br>
  One API, every thermal printer. Pure TypeScript, zero dependencies.
  <br><br>
  <a href="https://npmjs.com/package/portakal"><img src="https://img.shields.io/npm/v/portakal?style=flat&colorA=18181B&colorB=F0DB4F" alt="npm version"></a>
  <a href="https://npmjs.com/package/portakal"><img src="https://img.shields.io/npm/dm/portakal?style=flat&colorA=18181B&colorB=F0DB4F" alt="npm downloads"></a>
  <a href="https://bundlephobia.com/result?p=portakal"><img src="https://img.shields.io/bundlephobia/minzip/portakal?style=flat&colorA=18181B&colorB=F0DB4F" alt="bundle size"></a>
  <a href="https://github.com/productdevbook/portakal/blob/main/LICENSE"><img src="https://img.shields.io/github/license/productdevbook/portakal?style=flat&colorA=18181B&colorB=F0DB4F" alt="license"></a>
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

### Printer-native barcode/QR (zero dependencies)

The printer's built-in encoder handles barcode/QR generation. Fast, minimal data:

```ts
import { label } from "portakal";

const cmd = label({ width: 40, height: 30, unit: "mm" })
  .text("Hello World", { x: 10, y: 10, size: 2 })
  .barcode("123456789", { type: "code128", x: 10, y: 50, height: 60 })
  .qrcode("https://example.com", { x: 10, y: 120, ecc: "M", size: 6 })
  .box({ x: 5, y: 5, width: 310, height: 230, thickness: 2 })
  .toTSC(); // string — TSC/TSPL2 commands
```

Same label definition, any printer language:

```ts
cmd.toTSC(); // TSC/TSPL2  — label printers (TSC, Gprinter, Xprinter, iDPRT)
cmd.toZPL(); // Zebra ZPL II — desktop/industrial (GK420, ZT410, ZD620)
cmd.toEPL(); // Eltron EPL2 — desktop (LP/TLP 2824, GX420, ZD220)
cmd.toESCPOS(); // ESC/POS — receipt printers (Epson, Bixolon, Star, Citizen)
```

### Software-rendered barcode/QR (with etiket)

For pixel-perfect output, styled QR codes, or when the printer doesn't support a format natively:

```sh
npm install portakal etiket
```

```ts
import { label } from "portakal";
import { barcodePNG, qrcodePNG } from "etiket";

// etiket renders barcode/QR as PNG → portakal sends it as an image to the printer
const cmd = label({ width: 40, height: 30, unit: "mm" })
  .text("Product Label", { x: 10, y: 5 })
  .image(barcodePNG("123456789", { type: "code128" }), { x: 10, y: 40, width: 200 })
  .image(qrcodePNG("https://example.com"), { x: 220, y: 40, width: 80 })
  .toZPL();
```

### When to use which?

|                                       | Printer-native (`.barcode()` / `.qrcode()`) | Software-rendered (`.image()` + `etiket`) |
| :------------------------------------ | :------------------------------------------ | :---------------------------------------- |
| **Dependencies**                      | None                                        | `etiket` (you install it)                 |
| **Speed**                             | Fast (only sends command text)              | Slower (sends pixel data)                 |
| **Data size**                         | Small (~50 bytes)                           | Larger (bitmap data)                      |
| **Consistency**                       | Varies by printer model                     | Identical on every printer                |
| **Format support**                    | Depends on printer (10-20 types)            | 40+ barcode types, styled QR              |
| **Styled QR** (dots, gradients, logo) | Not possible                                | Full support via etiket                   |
| **Works on cheap printers**           | May not support QR/PDF417                   | Always works (it's just an image)         |
| **Best for**                          | Simple labels, fast printing                | Pixel-perfect, guaranteed output          |

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

### `.barcode(data, options)`

Printer-native barcode (uses the printer's built-in encoder):

```ts
builder.barcode("123456789", {
  type: "code128", // Symbology (see table below)
  x: 10,
  y: 50, // Position
  height: 80, // Bar height in dots
  narrowWidth: 2, // Narrow bar width
  wideWidth: 4, // Wide bar width
  readable: true, // Show human-readable text
  readablePosition: "below", // "none" | "above" | "below" | "both"
  rotation: 0, // 0 | 90 | 180 | 270
});
```

**Supported barcode types:**

| Type                                 | Description            |
| :----------------------------------- | :--------------------- |
| `code128`                            | Code 128 (auto subset) |
| `code128a` / `code128b` / `code128c` | Code 128 subsets       |
| `code39`                             | Code 39                |
| `code93`                             | Code 93                |
| `ean13` / `ean8`                     | EAN-13 / EAN-8         |
| `upca` / `upce`                      | UPC-A / UPC-E          |
| `itf` / `itf14`                      | Interleaved 2 of 5     |
| `codabar`                            | Codabar                |
| `msi`                                | MSI Plessey            |
| `plessey`                            | Plessey                |
| `code11`                             | Code 11                |
| `postnet` / `planet`                 | USPS Postnet / Planet  |
| `gs1_128`                            | GS1-128                |
| `gs1_databar`                        | GS1 DataBar            |

### `.qrcode(data, options?)`

```ts
builder.qrcode("https://example.com", {
  x: 10,
  y: 100, // Position
  ecc: "M", // "L" | "M" | "Q" | "H"
  size: 6, // Module size 1-10
  model: 2, // QR model 1 | 2
  rotation: 0, // 0 | 90 | 180 | 270
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

### Output Methods

| Method        | Output       | Target                   |
| :------------ | :----------- | :----------------------- |
| `.toTSC()`    | `string`     | TSC/TSPL2 label printers |
| `.toZPL()`    | `string`     | Zebra ZPL II printers    |
| `.toEPL()`    | `string`     | Eltron EPL2 printers     |
| `.toESCPOS()` | `Uint8Array` | ESC/POS receipt printers |

## Supported Printer Languages

| Language        | Printers                                       | Status             |
| :-------------- | :--------------------------------------------- | :----------------- |
| **TSC/TSPL2**   | TSC, Gprinter, Xprinter, iDPRT, Munbyn, Polono | :white_check_mark: |
| **ZPL II**      | Zebra GK420, ZT410, ZD620, ZQ series           | :white_check_mark: |
| **EPL2**        | Zebra LP/TLP 2824, GX420, ZD220, ZD420         | :white_check_mark: |
| **ESC/POS**     | Epson, Bixolon, Citizen, Star (compat mode)    | :white_check_mark: |
| **CPCL**        | Zebra QLn, ZQ mobile printers                  | Planned            |
| **DPL**         | Honeywell/Datamax label printers               | Planned            |
| **IPL**         | Intermec/Honeywell printers                    | Planned            |
| **SBPL**        | SATO label printers                            | Planned            |
| **Star PRNT**   | Star TSP100/143/600/700 (native mode)          | Planned            |
| **Fingerprint** | Honeywell Smart Printers                       | Planned            |

## Transport

portakal generates commands only — it does **not** handle printer connections. Send the output over any transport you choose:

```ts
import { label } from "portakal";
import net from "node:net";

const commands = label({ width: 40, height: 30 }).text("Hello", { x: 10, y: 10 }).toTSC();

// TCP (port 9100)
const socket = net.createConnection({ host: "192.168.1.100", port: 9100 });
socket.write(commands);
socket.end();

// USB (via serialport)
import { SerialPort } from "serialport";
const port = new SerialPort({ path: "/dev/usb/lp0", baudRate: 9600 });
port.write(commands);

// ESC/POS (binary) over WebUSB
const escpos = label({ width: 80 }).text("Receipt").toESCPOS();
await usbDevice.transferOut(endpointNumber, escpos);
```

## Comparison

| Feature                      |                portakal                | [node-thermal-printer](https://github.com/Klemen1337/node-thermal-printer) | [escpos](https://github.com/node-escpos/driver) | [jszpl](https://github.com/DanieLeeuwner/JSZPL) |
| :--------------------------- | :------------------------------------: | :------------------------------------------------------------------------: | :---------------------------------------------: | :---------------------------------------------: |
| Zero dependencies            |           :white_check_mark:           |                          :x: (pngjs, iconv-lite)                           |             :x: (get-pixels, jimp)              |               :white_check_mark:                |
| TypeScript-first             |           :white_check_mark:           |                                  Partial                                   |                     Partial                     |               :white_check_mark:                |
| Multi-language output        | :white_check_mark: TSC+ZPL+EPL+ESC/POS |                              :x: ESC/POS only                              |                :x: ESC/POS only                 |                  :x: ZPL only                   |
| Transport-agnostic           |           :white_check_mark:           |                               :x: (coupled)                                |                  :x: (coupled)                  |               :white_check_mark:                |
| Label printers (TSC/ZPL/EPL) |           :white_check_mark:           |                                    :x:                                     |                       :x:                       |                    ZPL only                     |
| Receipt printers (ESC/POS)   |           :white_check_mark:           |                             :white_check_mark:                             |               :white_check_mark:                |                       :x:                       |
| Image support                |           :white_check_mark:           |                             :white_check_mark:                             |               :white_check_mark:                |               :white_check_mark:                |
| Barcode (printer-native)     |           :white_check_mark:           |                             :white_check_mark:                             |               :white_check_mark:                |               :white_check_mark:                |
| QR Code (printer-native)     |           :white_check_mark:           |                             :white_check_mark:                             |               :white_check_mark:                |               :white_check_mark:                |
| Works in browser             |           :white_check_mark:           |                                    :x:                                     |                       :x:                       |               :white_check_mark:                |
| No native modules (no gyp)   |           :white_check_mark:           |                                    :x:                                     |                       :x:                       |               :white_check_mark:                |
| Pure ESM                     |           :white_check_mark:           |                                 :x: (CJS)                                  |                    :x: (CJS)                    |                    :x: (CJS)                    |

**portakal is the only library that generates** TSC + ZPL + EPL + ESC/POS from a single API with zero dependencies.

## Features

- Zero dependencies
- Pure ESM, edge-runtime compatible (Cloudflare Workers, Deno, Bun)
- TypeScript-first with strict types (tsgo)
- Transport-agnostic — generates commands, you handle the connection
- Multi-language — one label definition compiles to TSC, ZPL, EPL, or ESC/POS
- Fluent builder API
- Works in browser, Node.js, Deno, Bun, Electron
- No native modules — no node-gyp, no libusb, no compilation
- Barcode + QR code via printer-native commands (20+ symbologies)
- Image support via MonochromeBitmap
- Drawing primitives — box, line, circle, diagonal
- Raw command passthrough for advanced/unsupported features
- Optional [`etiket`](https://github.com/productdevbook/etiket) integration for pixel-perfect barcode/QR images

## Contributing

Contributions are welcome! Here are areas where help is especially appreciated:

- **CPCL, DPL, IPL, SBPL, Star PRNT** compiler implementations
- Image processing pipeline (dithering, compression)
- Character encoding engine (UTF-8 auto code page selection)
- Arabic/Hebrew RTL support (bidi + shaping)
- Receipt layout engine (tables, same-line alignment)
- Printer capability profiles
- Transport layer implementations (WebUSB, WebSerial, Web Bluetooth)

```bash
pnpm install    # Install dependencies
pnpm dev        # Run tests in watch mode
pnpm test       # Lint + typecheck + test
pnpm build      # Build for production
```

## License

Published under the [MIT](https://github.com/productdevbook/portakal/blob/main/LICENSE) license.
