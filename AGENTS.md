# portakal

Universal printer language SDK — TSC, ZPL, EPL, ESC/POS, CPCL, DPL, IPL, SBPL and more. Text, barcode, QR, images. Pure TypeScript, zero dependencies.

> [!IMPORTANT]
> Keep `AGENTS.md` updated with project status.

## Project Structure

```
src/
  index.ts                  # Main API — all exports
  types.ts                  # Shared types
  errors.ts                 # Custom error classes
  core/
    builder.ts              # Label builder (fluent API)
    element.ts              # Base element types
    image.ts                # Image processing (monochrome bitmap)
  languages/
    tsc.ts                  # TSC/TSPL printer language
    zpl.ts                  # Zebra ZPL II
    epl.ts                  # Eltron EPL2
    escpos.ts               # ESC/POS (receipt printers)
    cpcl.ts                 # Comtec CPCL
    dpl.ts                  # Datamax DPL
    ipl.ts                  # Intermec IPL
    sbpl.ts                 # SATO SBPL
    starprnt.ts             # Star PRNT
    fingerprint.ts          # Honeywell Fingerprint
  transport/
    usb.ts                  # USB connection
    network.ts              # TCP/IP socket
    serial.ts               # Serial port
    bluetooth.ts            # Bluetooth
test/
  *.test.ts                 # Test files
```

## Public API

Single entry: `portakal`. Builder pattern for constructing labels:

```ts
import { label } from "portakal";

const cmd = label({ width: 40, height: 30, unit: "mm" })
  .text("Hello World", { x: 10, y: 10, font: "A", size: 2 })
  .barcode("123456789", { x: 10, y: 50, type: "code128", height: 60 })
  .qrcode("https://example.com", { x: 10, y: 120, size: 6 })
  .image(buffer, { x: 200, y: 10, width: 100 })
  .print(2)
  .toTSC();    // or .toZPL(), .toEPL(), .toESCPOS(), etc.
```

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
