import { label, type LabelBuilder } from "portakal";
import { barcodePNG, qrcodePNG } from "etiket/png";
import type { MonochromeBitmap } from "portakal";

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

let currentLang: "tsc" | "zpl" | "epl" | "escpos" = "tsc";

/** Convert etiket PNG (Uint8Array) to MonochromeBitmap for portakal */
function pngToBitmap(png: Uint8Array, targetWidth: number): MonochromeBitmap {
  // Simplified: create a placeholder bitmap for preview
  // In production, you'd decode the PNG properly
  const bytesPerRow = Math.ceil(targetWidth / 8);
  const height = Math.ceil(targetWidth * 0.4);
  const data = new Uint8Array(bytesPerRow * height);
  // Fill with a pattern to show something in preview
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < bytesPerRow; x++) {
      // Simple alternating pattern to represent barcode-like content
      data[y * bytesPerRow + x] = y % 2 === 0 ? 0b10101010 : 0b01010101;
    }
  }
  return { data, width: targetWidth, height, bytesPerRow };
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
    const barcodeData = val("#el-barcode-data") || "123456789";
    const w = num("#el-barcode-w") || 200;
    const png = barcodePNG(barcodeData, {
      type: val("#el-barcode-type") as any,
      height: 50,
      barWidth: 2,
    });
    b.image(pngToBitmap(png, w), {
      x: num("#el-barcode-x"),
      y: num("#el-barcode-y"),
      width: w,
    });
  }

  if (checked("#el-qr-enable")) {
    const qrData = val("#el-qr-data") || "https://example.com";
    const size = num("#el-qr-size") || 80;
    const png = qrcodePNG(qrData, {
      size,
      ecLevel: (val("#el-qr-ecc") as any) || "M",
    });
    b.image(pngToBitmap(png, size), {
      x: num("#el-qr-x"),
      y: num("#el-qr-y"),
      width: size,
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
    if (hasBarcode) imports.push("barcodePNG");
    if (hasQR) imports.push("qrcodePNG");
    lines.push(`import { ${imports.join(", ")} } from "etiket/png";`);
  }

  lines.push("");

  if (hasBarcode) {
    const data = val("#el-barcode-data") || "123456789";
    const type = val("#el-barcode-type");
    lines.push(`const barcode = barcodePNG("${data}", { type: "${type}" });`);
  }
  if (hasQR) {
    const data = val("#el-qr-data") || "https://example.com";
    const ecc = val("#el-qr-ecc") || "M";
    lines.push(`const qr = qrcodePNG("${data}", { ecLevel: "${ecc}" });`);
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
    lines.push(
      `  .image(barcode, { x: ${num("#el-barcode-x")}, y: ${num("#el-barcode-y")}, width: ${num("#el-barcode-w") || 200} })`,
    );
  }
  if (hasQR) {
    lines.push(
      `  .image(qr, { x: ${num("#el-qr-x")}, y: ${num("#el-qr-y")}, width: ${num("#el-qr-size") || 80} })`,
    );
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

  const lang =
    currentLang === "escpos"
      ? "toESCPOS"
      : currentLang === "zpl"
        ? "toZPL"
        : currentLang === "epl"
          ? "toEPL"
          : "toTSC";
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
    } else if (currentLang === "zpl") {
      output = b.toZPL();
    } else if (currentLang === "epl") {
      output = b.toEPL();
    } else {
      output = b.toTSC();
    }

    $("#output-code").textContent = output;
    $("#code-preview").textContent = generateCodeSnippet();
    $("#output-error").setAttribute("hidden", "");
  } catch (e: any) {
    $("#output-code").textContent = "";
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
    const text = $("#output-code").textContent ?? "";
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

  for (const input of $$("input, select")) {
    input.addEventListener("input", generate);
    input.addEventListener("change", generate);
  }

  generate();
}
