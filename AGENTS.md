# portakal

Universal printer language SDK — TSC, ZPL, EPL, ESC/POS, CPCL, DPL, IPL, SBPL and more. Text, images, and printer-native barcode/QR commands. Pure TypeScript, zero runtime dependencies.

> [!NOTE]
> **Barcode/QR generation is NOT in this package.** Use [`etiket`](https://github.com/productdevbook/etiket) for barcode & QR code generation (SVG/PNG). Portakal sends printer-native barcode/QR commands (the printer's built-in encoder) OR accepts pre-rendered images from `etiket` for pixel-perfect output.

> [!IMPORTANT]
> Keep `AGENTS.md` updated with project status.

## Project Structure

```
src/
  index.ts                  # Main API — all exports
  types.ts                  # Shared types
  errors.ts                 # Custom error classes
  builder.ts                # Label builder (fluent API)
  core.ts                   # Core logic
  image.ts                  # Image processing (monochrome bitmap)
  convert.ts                # Cross-language converter
  encoding.ts               # Encoding utilities
  markup.ts                 # Markup utilities
  preview.ts                # Preview generation
  profiles.ts               # Printer profiles
  receipt.ts                # Receipt mode
  transport.ts              # Transport layer (USB, network, serial, BT)
  utils.ts                  # Shared utilities
  validate.ts               # Label validation
  languages/                # Compilers (label → printer language)
    tsc.ts                  # TSC/TSPL printer language
    zpl.ts                  # Zebra ZPL II
    epl.ts                  # Eltron EPL2
    escpos.ts               # ESC/POS (receipt printers)
    cpcl.ts                 # Comtec CPCL
    dpl.ts                  # Datamax DPL
    ipl.ts                  # Intermec IPL
    sbpl.ts                 # SATO SBPL
    starprnt.ts             # Star PRNT
  parsers/                  # Parsers (printer language → structured data)
    tsc.ts                  # TSC/TSPL parser
    zpl.ts                  # Zebra ZPL II parser
    epl.ts                  # Eltron EPL2 parser
    escpos.ts               # ESC/POS parser
    cpcl.ts                 # Comtec CPCL parser
    dpl.ts                  # Datamax DPL parser
    ipl.ts                  # Intermec IPL parser
    sbpl.ts                 # SATO SBPL parser
    starprnt.ts             # Star PRNT parser
  lang/                     # Language modules (compile + parse + preview + validate)
    tsc.ts                  # TSC module
    zpl.ts                  # ZPL module
    epl.ts                  # EPL module
    escpos.ts               # ESC/POS module
    cpcl.ts                 # CPCL module
    dpl.ts                  # DPL module
    ipl.ts                  # IPL module
    sbpl.ts                 # SBPL module
    starprnt.ts             # Star PRNT module
test/
  *.test.ts                 # Test files
```

## Public API

Tree-shakeable language modules — import only what you need:

```ts
import { label } from "portakal/core";
import { zpl } from "portakal/lang/zpl";

const myLabel = label({ width: 40, height: 30, unit: "mm" })
  .text("Hello World", { x: 10, y: 10, font: "A", size: 2 })
  .barcode("123456789", { x: 10, y: 50, type: "code128", height: 60 })
  .qrcode("https://example.com", { x: 10, y: 120, size: 6 })
  .image(buffer, { x: 200, y: 10, width: 100 })
  .print(2);

const code = zpl.compile(myLabel);   // ZPL II commands
const svg  = zpl.preview(myLabel);   // SVG preview with ZPL font metrics
```

### Available language modules

```ts
import { tsc } from "portakal/lang/tsc";       // TSC/TSPL2
import { zpl } from "portakal/lang/zpl";       // Zebra ZPL II
import { epl } from "portakal/lang/epl";       // Eltron EPL2
import { escpos } from "portakal/lang/escpos"; // ESC/POS
import { cpcl } from "portakal/lang/cpcl";     // Comtec CPCL
import { dpl } from "portakal/lang/dpl";       // Datamax DPL
import { ipl } from "portakal/lang/ipl";       // Intermec IPL
import { sbpl } from "portakal/lang/sbpl";     // SATO SBPL
import { starprnt } from "portakal/lang/starprnt"; // Star PRNT
```

Each module exports: `compile()`, `parse()`, `preview()`, `validate()`.

## Build & Scripts

```bash
pnpm build          # obuild (rolldown)
pnpm dev            # vitest watch
pnpm lint           # oxlint + oxfmt --check
pnpm lint:fix       # oxlint --fix + oxfmt
pnpm fmt            # oxfmt
pnpm test           # pnpm lint && pnpm typecheck && vitest run
pnpm typecheck      # tsgo --noEmit
pnpm release        # pnpm test && pnpm build && bumpp
```

## Code Conventions

- **Pure ESM** — no CJS
- **Zero runtime dependencies**
- **TypeScript strict** — tsgo for typecheck
- **Formatter:** oxfmt (double quotes, semicolons)
- **Linter:** oxlint (unicorn, typescript, oxc plugins)
- **Tests:** vitest in `test/` directory, flat naming
- **Internal files:** prefix with `_` where applicable
- **Exports:** explicit in `src/index.ts`, no barrel re-exports
- **Commits:** semantic lowercase (`feat:`, `fix:`, `chore:`, `docs:`)
- **Issues:** reference in commits (`feat(#N):`)

## Testing

- **Framework:** vitest
- **Location:** `test/` directory (flat structure)
- **Coverage:** `@vitest/coverage-v8`
- **Rule:** No code without tests. Every function must have corresponding test coverage.
- Run all: `pnpm test`
- Run single: `pnpm vitest run test/<file>.test.ts`
