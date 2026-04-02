import {
  label,
  formatPair,
  separator,
  renderPreview,
  parseTSC,
  parseTSPL,
  parseZPL,
  parseEPL,
  parseCPCL,
  parseDPL,
  parseSBPL,
  parseIPL,
  convert,
  validate,
  type LabelBuilder,
  type MonochromeBitmap,
  type ResolvedLabel,
} from "portakal";
import {
  encodeCode128,
  encodeEAN13,
  encodeEAN8,
  encodeUPCA,
  encodeCode39,
  encodeITF14,
  encodeCodabar,
  encodeQR,
  renderBarcodeRaster,
  renderMatrixRaster,
} from "etiket";
import type { RasterData } from "etiket";

function $(sel: string): HTMLElement {
  return document.querySelector(sel)!;
}
function $$(sel: string): HTMLElement[] {
  return [...document.querySelectorAll(sel)] as HTMLElement[];
}
function val(id: string): string {
  return ($(id) as HTMLInputElement).value;
}
function num(id: string): number {
  return Number.parseInt(val(id), 10) || 0;
}
function checked(id: string): boolean {
  return ($(id) as HTMLInputElement).checked;
}

let currentLang: "tsc" | "zpl" | "epl" | "cpcl" | "dpl" | "sbpl" | "ipl" | "escpos" | "starprnt" =
  "tsc";

/** Convert etiket RasterData (8-bit per pixel rows) to portakal MonochromeBitmap (1-bit packed) */
function rasterToBitmap(raster: RasterData): MonochromeBitmap {
  const { width, height, rows } = raster;
  const bytesPerRow = Math.ceil(width / 8);
  const data = new Uint8Array(bytesPerRow * height);

  for (let y = 0; y < height; y++) {
    const row = rows[y];
    if (!row) continue;
    for (let x = 0; x < width; x++) {
      if (row[x]) {
        // 1 = foreground (black) → set bit
        const byteIdx = y * bytesPerRow + Math.floor(x / 8);
        const bitIdx = 7 - (x % 8);
        data[byteIdx] |= 1 << bitIdx;
      }
    }
  }

  return { data, width, height, bytesPerRow };
}

function encodeBarcode(data: string, type: string): number[] {
  switch (type) {
    case "ean13":
      return encodeEAN13(data);
    case "ean8":
      return encodeEAN8(data);
    case "upca":
      return encodeUPCA(data);
    case "code39":
      return encodeCode39(data);
    case "itf14":
      return encodeITF14(data);
    case "codabar":
      return encodeCodabar(data);
    default:
      return encodeCode128(data);
  }
}

function buildLabel(): LabelBuilder {
  const b = label({
    width: num("#lbl-width") || 40,
    height: num("#lbl-height") || 30,
    unit: "mm",
    dpi: num("#lbl-dpi") || 203,
    gap: num("#lbl-gap") || 3,
    speed: num("#lbl-speed") || 4,
    density: num("#lbl-density") || 8,
    copies: num("#lbl-copies") || 1,
  });

  if (checked("#el-text-enable")) {
    b.text(val("#el-text") || "Hello World", {
      x: num("#el-text-x"),
      y: num("#el-text-y"),
      size: num("#el-text-size") || 1,
    });
  }

  if (checked("#el-text2-enable")) {
    b.text(val("#el-text2") || "", {
      x: num("#el-text2-x"),
      y: num("#el-text2-y"),
      size: num("#el-text2-size") || 1,
    });
  }

  if (checked("#el-text3-enable")) {
    b.text(val("#el-text3") || "", {
      x: num("#el-text3-x"),
      y: num("#el-text3-y"),
      size: num("#el-text3-size") || 1,
    });
  }

  if (checked("#el-barcode-enable")) {
    const data = val("#el-barcode-data") || "123456789";
    const type = val("#el-barcode-type");
    const bars = encodeBarcode(data, type);
    const raster = renderBarcodeRaster(bars, { scale: 2, height: 50, margin: 4 });
    const bitmap = rasterToBitmap(raster);
    b.image(bitmap, {
      x: num("#el-barcode-x"),
      y: num("#el-barcode-y"),
      width: num("#el-barcode-w") || raster.width,
    });
  }

  if (checked("#el-qr-enable")) {
    const data = val("#el-qr-data") || "https://example.com";
    const ecc = (val("#el-qr-ecc") as "L" | "M" | "Q" | "H") || "M";
    const matrix = encodeQR(data, { ecLevel: ecc });
    const raster = renderMatrixRaster(matrix, { moduleSize: 4, margin: 2 });
    const bitmap = rasterToBitmap(raster);
    b.image(bitmap, {
      x: num("#el-qr-x"),
      y: num("#el-qr-y"),
      width: num("#el-qr-size") || raster.width,
    });
  }

  if (checked("#el-box-enable")) {
    b.box({
      x: num("#el-box-x"),
      y: num("#el-box-y"),
      width: num("#el-box-w") || 100,
      height: num("#el-box-h") || 100,
      thickness: num("#el-box-t") || 1,
    });
  }

  if (checked("#el-line-enable")) {
    b.line({
      x1: num("#el-line-x1"),
      y1: num("#el-line-y1"),
      x2: num("#el-line-x2") || 300,
      y2: num("#el-line-y2"),
      thickness: num("#el-line-t") || 1,
    });
  }

  if (checked("#el-circle-enable")) {
    b.circle({
      x: num("#el-circle-x"),
      y: num("#el-circle-y"),
      diameter: num("#el-circle-d") || 50,
      thickness: num("#el-circle-t") || 1,
    });
  }

  return b;
}

function generateCodeSnippet(): string {
  const lines: string[] = [];
  lines.push('import { label } from "portakal";');

  const hasBarcode = checked("#el-barcode-enable");
  const hasQR = checked("#el-qr-enable");
  if (hasBarcode || hasQR) {
    const imports: string[] = [];
    if (hasBarcode) imports.push("encodeCode128", "renderBarcodeRaster");
    if (hasQR) imports.push("encodeQR", "renderMatrixRaster");
    lines.push(`import { ${imports.join(", ")} } from "etiket";`);
    lines.push("");
    lines.push("// Helper: convert etiket raster to portakal bitmap");
    lines.push("function rasterToBitmap(raster) { /* see docs */ }");
  }

  lines.push("");

  if (hasBarcode) {
    const data = val("#el-barcode-data") || "123456789";
    lines.push(`const bars = encodeCode128("${data}");`);
    lines.push("const barcodeRaster = renderBarcodeRaster(bars, { scale: 2, height: 50 });");
    lines.push("const barcode = rasterToBitmap(barcodeRaster);");
  }
  if (hasQR) {
    const data = val("#el-qr-data") || "https://example.com";
    const ecc = val("#el-qr-ecc") || "M";
    lines.push(`const qrMatrix = encodeQR("${data}", { ecLevel: "${ecc}" });`);
    lines.push("const qrRaster = renderMatrixRaster(qrMatrix, { moduleSize: 4 });");
    lines.push("const qr = rasterToBitmap(qrRaster);");
  }
  if (hasBarcode || hasQR) lines.push("");

  const w = num("#lbl-width") || 40;
  const h = num("#lbl-height") || 30;
  lines.push(`const cmd = label({ width: ${w}, height: ${h}, unit: "mm" })`);

  if (checked("#el-text-enable")) {
    const t = val("#el-text") || "Hello World";
    lines.push(
      `  .text("${t}", { x: ${num("#el-text-x")}, y: ${num("#el-text-y")}, size: ${num("#el-text-size") || 1} })`,
    );
  }
  if (checked("#el-text2-enable")) {
    const t = val("#el-text2") || "";
    lines.push(`  .text("${t}", { x: ${num("#el-text2-x")}, y: ${num("#el-text2-y")} })`);
  }
  if (checked("#el-text3-enable")) {
    const t = val("#el-text3") || "";
    lines.push(`  .text("${t}", { x: ${num("#el-text3-x")}, y: ${num("#el-text3-y")} })`);
  }
  if (hasBarcode) {
    lines.push(`  .image(barcode, { x: ${num("#el-barcode-x")}, y: ${num("#el-barcode-y")} })`);
  }
  if (hasQR) {
    lines.push(`  .image(qr, { x: ${num("#el-qr-x")}, y: ${num("#el-qr-y")} })`);
  }
  if (checked("#el-box-enable")) {
    lines.push(
      `  .box({ x: ${num("#el-box-x")}, y: ${num("#el-box-y")}, width: ${num("#el-box-w")}, height: ${num("#el-box-h")}, thickness: ${num("#el-box-t") || 1} })`,
    );
  }
  if (checked("#el-line-enable")) {
    lines.push(
      `  .line({ x1: ${num("#el-line-x1")}, y1: ${num("#el-line-y1")}, x2: ${num("#el-line-x2")}, y2: ${num("#el-line-y2")} })`,
    );
  }
  if (checked("#el-circle-enable")) {
    lines.push(
      `  .circle({ x: ${num("#el-circle-x")}, y: ${num("#el-circle-y")}, diameter: ${num("#el-circle-d")} })`,
    );
  }

  const langMap: Record<string, string> = {
    escpos: "toESCPOS",
    starprnt: "toStarPRNT",
    zpl: "toZPL",
    epl: "toEPL",
    cpcl: "toCPCL",
    dpl: "toDPL",
    sbpl: "toSBPL",
    ipl: "toIPL",
    tsc: "toTSC",
  };
  const lang = langMap[currentLang] ?? "toTSC";
  lines.push(`  .${lang}();`);

  return lines.join("\n");
}

function generate(): void {
  try {
    const b = buildLabel();
    $("#preview-container").innerHTML = b.toPreview();

    let output: string;
    if (currentLang === "escpos") {
      output = formatHex(b.toESCPOS());
    } else if (currentLang === "starprnt") {
      output = formatHex(b.toStarPRNT());
    } else if (currentLang === "zpl") {
      output = b.toZPL();
    } else if (currentLang === "epl") {
      output = b.toEPL();
    } else if (currentLang === "cpcl") {
      output = b.toCPCL();
    } else if (currentLang === "dpl") {
      output = b.toDPL();
    } else if (currentLang === "sbpl") {
      output = b.toSBPL();
    } else if (currentLang === "ipl") {
      output = b.toIPL();
    } else {
      output = b.toTSC();
    }

    const codeEl = $("#output-code") as HTMLTextAreaElement;
    const scrollTop = codeEl.scrollTop;
    codeEl.value = output;
    codeEl.scrollTop = scrollTop;
    $("#code-preview").textContent = generateCodeSnippet();
    $("#output-error").setAttribute("hidden", "");
  } catch (e: any) {
    ($("#output-code") as HTMLTextAreaElement).value = "";
    $("#preview-container").innerHTML = "";
    $("#code-preview").textContent = "";
    const err = $("#output-error");
    err.textContent = e.message;
    err.removeAttribute("hidden");
  }
}

function formatHex(bytes: Uint8Array): string {
  const lines: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const slice = bytes.slice(i, i + 16);
    const hex = [...slice].map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" ");
    const ascii = [...slice]
      .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : "."))
      .join("");
    lines.push(`${i.toString(16).padStart(6, "0")}  ${hex.padEnd(48)}  ${ascii}`);
  }
  return lines.join("\n");
}

export function setupApp(): void {
  for (const tab of $$(".tab")) {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((t) => t.classList.remove("active"));
      $$(".panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      $(`[data-panel="${tab.dataset.tab}"]`).classList.add("active");
    });
  }

  for (const tab of $$(".lang-tab")) {
    tab.addEventListener("click", () => {
      $$(".lang-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentLang = tab.dataset.lang as any;
      generate();
    });
  }

  for (const header of $$(".ctrl-header")) {
    header.addEventListener("click", () => {
      const name = header.dataset.collapse!;
      const body = $(`[data-section="${name}"]`);
      const toggle = header.querySelector(".toggle") as HTMLElement;
      body.classList.toggle("collapsed");
      toggle.textContent = body.classList.contains("collapsed") ? "\u25B6" : "\u25BC";
    });
  }

  $("#btn-copy").addEventListener("click", () => {
    const text = ($("#output-code") as HTMLTextAreaElement).value;
    navigator.clipboard.writeText(text);
    const btn = $("#btn-copy");
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = "Copy"), 1500);
  });

  $("#btn-copy-code").addEventListener("click", () => {
    const text = $("#code-preview").textContent ?? "";
    navigator.clipboard.writeText(text);
    const btn = $("#btn-copy-code");
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = "Copy"), 1500);
  });

  // Receipt lang tabs
  let receiptLang: "tsc" | "zpl" | "epl" | "cpcl" | "escpos" = "escpos";
  for (const tab of $$(".rlang-tab")) {
    tab.addEventListener("click", () => {
      $$(".rlang-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      receiptLang = tab.dataset.rlang as any;
      generateReceipt();
    });
  }

  // Receipt copy buttons
  $("#btn-copy-receipt-output").addEventListener("click", () => {
    const text = ($("#receipt-output") as HTMLTextAreaElement).value;
    navigator.clipboard.writeText(text);
    const btn = $("#btn-copy-receipt-output");
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = "Copy"), 1500);
  });

  $("#btn-copy-receipt").addEventListener("click", () => {
    const text = $("#receipt-code").textContent ?? "";
    navigator.clipboard.writeText(text);
    const btn = $("#btn-copy-receipt");
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = "Copy"), 1500);
  });

  // Store receiptLang in closure for generateReceipt
  (window as any).__receiptLang = () => receiptLang;

  function update(): void {
    const scrollY = window.scrollY;
    generate();
    generateReceipt();
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  }

  for (const input of $$("input, select, textarea")) {
    if (input.id === "output-code" || input.id === "receipt-output") continue;
    input.addEventListener("input", update);
    input.addEventListener("change", update);
  }

  // When user edits the output textarea, parse it and update preview
  $("#output-code").addEventListener("input", () => {
    const code = ($("#output-code") as HTMLTextAreaElement).value;
    try {
      let parsed: { widthDots: number; heightDots: number; elements: any[] };

      if (currentLang === "zpl") {
        const r = parseZPL(code);
        parsed = { widthDots: r.widthDots, heightDots: r.heightDots, elements: r.elements };
      } else if (currentLang === "epl") {
        const r = parseEPL(code);
        parsed = { widthDots: r.widthDots, heightDots: r.heightDots || 240, elements: r.elements };
      } else if (currentLang === "cpcl") {
        const r = parseCPCL(code);
        parsed = { widthDots: r.widthDots, heightDots: r.heightDots, elements: r.elements };
      } else if (currentLang === "dpl") {
        const r = parseDPL(code);
        parsed = { widthDots: r.widthDots, heightDots: 240, elements: r.elements };
      } else if (currentLang === "sbpl") {
        const r = parseSBPL(code);
        parsed = { widthDots: 320, heightDots: 240, elements: r.elements };
      } else if (currentLang === "ipl") {
        const r = parseIPL(code);
        parsed = { widthDots: r.widthDots, heightDots: r.heightDots, elements: r.elements };
      } else {
        parsed = parseTSC(code);
      }

      const resolved: ResolvedLabel = {
        widthDots: parsed.widthDots,
        heightDots: parsed.heightDots,
        dpi: 203,
        gapDots: 24,
        speed: 4,
        density: 8,
        direction: 0,
        copies: 1,
        elements: parsed.elements,
      };
      $("#preview-container").innerHTML = renderPreview(resolved);
    } catch {
      // ignore parse errors while typing
    }
  });

  // Validate tab
  function runValidate(): void {
    const code = ($("#v-code") as HTMLTextAreaElement).value;
    const lang = val("#v-lang");
    if (!code.trim()) {
      $("#v-preview").innerHTML = "";
      $("#v-result").textContent = "";
      $("#v-warnings").textContent = "";
      return;
    }

    try {
      let commands: any[] = [];
      let elements: any[] = [];
      let warnings: string[] = [];
      let widthDots = 320;
      let heightDots = 240;

      if (lang === "tsc") {
        const r = parseTSPL(code);
        commands = r.commands;
        elements = r.elements;
        warnings = r.warnings;
        widthDots = r.widthDots;
        heightDots = r.heightDots;
      } else if (lang === "zpl") {
        const r = parseZPL(code);
        commands = r.commands;
        elements = r.elements;
        warnings = r.warnings;
        widthDots = r.widthDots;
        heightDots = r.heightDots;
      } else if (lang === "epl") {
        const r = parseEPL(code);
        commands = r.commands;
        elements = r.elements;
        warnings = r.warnings;
        widthDots = r.widthDots;
        heightDots = r.heightDots || 240;
      } else if (lang === "cpcl") {
        const r = parseCPCL(code);
        commands = r.commands;
        elements = r.elements;
        warnings = r.warnings;
        widthDots = r.widthDots;
        heightDots = r.heightDots;
      } else if (lang === "dpl") {
        const r = parseDPL(code);
        commands = r.commands;
        elements = r.elements;
        warnings = r.warnings;
        widthDots = r.widthDots;
      } else if (lang === "sbpl") {
        const r = parseSBPL(code);
        commands = r.commands;
        elements = r.elements;
        warnings = r.warnings;
      } else if (lang === "ipl") {
        const r = parseIPL(code);
        commands = r.commands;
        elements = r.elements;
        warnings = r.warnings;
        widthDots = r.widthDots;
        heightDots = r.heightDots;
      }

      // Count stats
      const unknowns = commands.filter(
        (c: any) => c.cmd === "UNKNOWN" || c.type === "UNKNOWN",
      ).length;
      const total = commands.length;

      // Stats header
      let statsText = `${lang.toUpperCase()} · ${total} commands · ${elements.length} elements · ${widthDots}×${heightDots}`;
      if (unknowns > 0) statsText += ` · ${unknowns} unknown`;
      $("#v-stats").textContent = statsText;

      // Build result detail
      let result = "";
      for (const cmd of commands) {
        const name = cmd.cmd ?? cmd.code ?? cmd.type ?? cmd.name ?? "?";
        result += `${name}`;
        if (cmd.content) result += ` "${cmd.content}"`;
        if (cmd.rawParams) result += ` ${cmd.rawParams}`;
        if (cmd.params && typeof cmd.params === "string") result += ` ${cmd.params}`;
        if (cmd.raw) result += ` (raw: ${cmd.raw.slice(0, 50)})`;
        result += "\n";
      }

      $("#v-result").textContent = result;

      // Warnings
      let warnText = "";
      if (unknowns > 0) {
        warnText += `${unknowns} unknown/unrecognized command(s)\n`;
      }
      for (const w of warnings) {
        warnText += `${w}\n`;
      }
      if (!warnText) warnText = "No warnings — all commands recognized.";
      $("#v-warnings").textContent = warnText;

      // Preview
      const resolved: ResolvedLabel = {
        widthDots,
        heightDots,
        dpi: 203,
        gapDots: 24,
        speed: 4,
        density: 8,
        direction: 0,
        copies: 1,
        elements,
      };
      $("#v-preview").innerHTML = renderPreview(resolved);

      // Validate
      const validation = validate(code, lang as any);
      if (validation.issues.length > 0) {
        let vText = "";
        for (const issue of validation.issues) {
          const icon = issue.level === "error" ? "✗" : issue.level === "warning" ? "⚠" : "ℹ";
          vText += `${icon} ${issue.message}\n`;
        }
        $("#v-warnings").textContent = vText;
      }
    } catch (e: any) {
      $("#v-result").textContent = `Parse error: ${e.message}`;
      $("#v-warnings").textContent = "";
      $("#v-preview").innerHTML = "";
      ($("#v-convert-section") as HTMLElement).style.display = "none";
    }
  }

  $("#v-code").addEventListener("input", runValidate);
  $("#v-lang").addEventListener("change", runValidate);

  $("#btn-copy-validate").addEventListener("click", () => {
    const text = $("#v-result").textContent ?? "";
    navigator.clipboard.writeText(text);
    const btn = $("#btn-copy-validate");
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = "Copy"), 1500);
  });

  // Convert tab
  function runConvert(): void {
    const code = ($("#c-code") as HTMLTextAreaElement).value;
    const from = val("#c-from");
    const to = val("#c-to");
    if (!code.trim()) {
      $("#c-output").textContent = "";
      $("#c-preview-src").innerHTML = "";
      $("#c-stats").textContent = "";
      return;
    }

    try {
      const result = convert(code, from as any, to as any);
      const output =
        result.output instanceof Uint8Array ? formatHex(result.output) : (result.output as string);

      $("#c-output").textContent = output;
      $("#c-stats").textContent =
        `${from.toUpperCase()} → ${to.toUpperCase()} · ${result.elements.length} elements · ${result.widthDots}×${result.heightDots}`;

      // Source preview
      const resolved: ResolvedLabel = {
        widthDots: result.widthDots,
        heightDots: result.heightDots,
        dpi: 203,
        gapDots: 24,
        speed: 4,
        density: 8,
        direction: 0,
        copies: 1,
        elements: result.elements,
      };
      $("#c-preview-src").innerHTML = renderPreview(resolved);
    } catch (e: any) {
      $("#c-output").textContent = `Conversion error: ${e.message}`;
      $("#c-preview-src").innerHTML = "";
      $("#c-stats").textContent = "";
    }
  }

  $("#c-code").addEventListener("input", runConvert);
  $("#c-from").addEventListener("change", runConvert);
  $("#c-to").addEventListener("change", runConvert);

  $("#btn-copy-convert").addEventListener("click", () => {
    const text = $("#c-output").textContent ?? "";
    navigator.clipboard.writeText(text);
    const btn = $("#btn-copy-convert");
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = "Copy"), 1500);
  });

  // Download helpers
  function downloadSVG(containerId: string, filename: string): void {
    const svg = $(`#${containerId}`).innerHTML;
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPNG(containerId: string, filename: string): void {
    const svgEl = $(`#${containerId}`).querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    const w = svgEl.viewBox?.baseVal?.width || 800;
    const h = svgEl.viewBox?.baseVal?.height || 600;
    canvas.width = w * 2;
    canvas.height = h * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(2, 2);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
  }

  // Label downloads
  $("#l-download-svg").addEventListener("click", () =>
    downloadSVG("preview-container", "label.svg"),
  );
  $("#l-download-png").addEventListener("click", () =>
    downloadPNG("preview-container", "label.png"),
  );

  // Convert downloads
  $("#c-download-svg").addEventListener("click", () =>
    downloadSVG("c-preview-src", "label-preview.svg"),
  );
  $("#c-download-png").addEventListener("click", () =>
    downloadPNG("c-preview-src", "label-preview.png"),
  );

  // Load examples on first visit
  const vCode = $("#v-code") as HTMLTextAreaElement;
  if (!vCode.value && vCode.placeholder) vCode.value = vCode.placeholder;

  const cCode = $("#c-code") as HTMLTextAreaElement;
  if (!cCode.value && cCode.placeholder) cCode.value = cCode.placeholder;

  generate();
  generateReceipt();
  runValidate();
  runConvert();
}

function generateReceipt(): void {
  try {
    const w = Number.parseInt(val("#r-width"), 10) || 48;
    const store = val("#r-store") || "MY STORE";
    const address = val("#r-address") || "";
    const footer = val("#r-footer") || "";
    const itemsRaw = val("#r-items") || "";
    const rlang = (window as any).__receiptLang?.() ?? "escpos";

    const items: { name: string; qty: string; price: string }[] = [];
    for (const line of itemsRaw.split("\n")) {
      const parts = line.split(",").map((s) => s.trim());
      if (parts.length >= 3 && parts[0]) {
        items.push({ name: parts[0], qty: parts[1] ?? "1", price: parts[2] ?? "0.00" });
      }
    }

    // Text preview
    const previewLines: string[] = [];
    const center = (text: string) => {
      const pad = Math.max(0, Math.floor((w - text.length) / 2));
      return " ".repeat(pad) + text;
    };

    previewLines.push(center(store));
    if (address) previewLines.push(center(address));
    previewLines.push(separator("=", w));
    previewLines.push(formatPair("Item", "Price", w));
    previewLines.push(separator("-", w));

    let total = 0;
    for (const item of items) {
      const price = Number.parseFloat(item.price) || 0;
      total += price;
      previewLines.push(formatPair(`${item.name} x${item.qty}`, `$${price.toFixed(2)}`, w));
    }

    previewLines.push(separator("-", w));
    previewLines.push(formatPair("TOTAL", `$${total.toFixed(2)}`, w));
    previewLines.push(separator("=", w));
    if (footer) previewLines.push(center(footer));

    $("#receipt-preview").textContent = previewLines.join("\n");

    // Build real label and compile to selected language
    const b = label({ width: 80, unit: "mm" });
    b.text(store, { align: "center", bold: true, size: 2 });
    if (address) b.text(address, { align: "center" });
    b.text(separator("=", w));
    b.text(formatPair("Item", "Price", w));
    b.text(separator("-", w));
    for (const item of items) {
      const price = Number.parseFloat(item.price) || 0;
      b.text(formatPair(`${item.name} x${item.qty}`, `$${price.toFixed(2)}`, w));
    }
    b.text(separator("-", w));
    b.text(formatPair("TOTAL", `$${total.toFixed(2)}`, w), { bold: true, size: 2 });
    b.text(separator("=", w));
    if (footer) b.text(footer, { align: "center" });

    let output: string;
    if (rlang === "escpos") {
      output = formatHex(b.toESCPOS());
    } else if (rlang === "starprnt") {
      output = formatHex(b.toStarPRNT());
    } else if (rlang === "zpl") {
      output = b.toZPL();
    } else if (rlang === "epl") {
      output = b.toEPL();
    } else if (rlang === "cpcl") {
      output = b.toCPCL();
    } else if (rlang === "dpl") {
      output = b.toDPL();
    } else if (rlang === "sbpl") {
      output = b.toSBPL();
    } else if (rlang === "ipl") {
      output = b.toIPL();
    } else {
      output = b.toTSC();
    }

    ($("#receipt-output") as HTMLTextAreaElement).value = output;

    // Code preview
    const rLangMap: Record<string, string> = {
      escpos: "toESCPOS",
      starprnt: "toStarPRNT",
      zpl: "toZPL",
      epl: "toEPL",
      cpcl: "toCPCL",
      dpl: "toDPL",
      sbpl: "toSBPL",
      ipl: "toIPL",
      tsc: "toTSC",
    };
    const langMethod = rLangMap[rlang] ?? "toESCPOS";

    const code = `import { label, formatPair, separator } from "portakal";

const w = ${w};
const receipt = label({ width: 80, unit: "mm" })
  .text("${store}", { align: "center", bold: true, size: 2 })${address ? `\n  .text("${address}", { align: "center" })` : ""}
  .text(separator("=", w))
${items.map((i) => `  .text(formatPair("${i.name} x${i.qty}", "$${Number.parseFloat(i.price).toFixed(2)}", w))`).join("\n")}
  .text(separator("-", w))
  .text(formatPair("TOTAL", "$${total.toFixed(2)}", w), { bold: true, size: 2 })
  .text(separator("=", w))${footer ? `\n  .text("${footer}", { align: "center" })` : ""}
  .${langMethod}();`;

    $("#receipt-code").textContent = code;
  } catch {
    $("#receipt-preview").textContent = "";
    ($("#receipt-output") as HTMLTextAreaElement).value = "";
    $("#receipt-code").textContent = "";
  }
}
