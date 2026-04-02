import { label } from "portakal";

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

let currentLang: "tsc" | "zpl" | "epl" | "escpos" = "tsc";

function generate(): void {
  try {
    const w = num("#lbl-width") || 40;
    const h = num("#lbl-height") || 30;
    const dpi = num("#lbl-dpi") || 203;
    const gap = num("#lbl-gap") || 3;
    const speed = num("#lbl-speed") || 4;
    const density = num("#lbl-density") || 8;
    const copies = num("#lbl-copies") || 1;

    const b = label({
      width: w,
      height: h,
      unit: "mm",
      dpi,
      gap,
      speed,
      density,
      copies,
    });

    // Text elements
    const textContent = val("#el-text");
    if (textContent) {
      b.text(textContent, {
        x: num("#el-text-x"),
        y: num("#el-text-y"),
        size: num("#el-text-size") || 1,
      });
    }

    // Barcode
    const bcData = val("#el-barcode");
    if (bcData) {
      const bcType = val("#el-barcode-type") as any;
      b.barcode(bcData, {
        type: bcType,
        x: num("#el-barcode-x"),
        y: num("#el-barcode-y"),
        height: num("#el-barcode-h") || 60,
      });
    }

    // QR Code
    const qrData = val("#el-qr");
    if (qrData) {
      b.qrcode(qrData, {
        x: num("#el-qr-x"),
        y: num("#el-qr-y"),
        size: num("#el-qr-size") || 6,
        ecc: (val("#el-qr-ecc") as any) || "M",
      });
    }

    // Box
    if (($("#el-box-enable") as HTMLInputElement).checked) {
      b.box({
        x: num("#el-box-x"),
        y: num("#el-box-y"),
        width: num("#el-box-w") || 100,
        height: num("#el-box-h") || 100,
        thickness: num("#el-box-t") || 1,
      });
    }

    // Line
    if (($("#el-line-enable") as HTMLInputElement).checked) {
      b.line({
        x1: num("#el-line-x1"),
        y1: num("#el-line-y1"),
        x2: num("#el-line-x2") || 300,
        y2: num("#el-line-y2"),
        thickness: num("#el-line-t") || 1,
      });
    }

    let output: string;
    if (currentLang === "escpos") {
      const bytes = b.toESCPOS();
      output = formatHex(bytes);
    } else if (currentLang === "zpl") {
      output = b.toZPL();
    } else if (currentLang === "epl") {
      output = b.toEPL();
    } else {
      output = b.toTSC();
    }

    $("#output-code").textContent = output;
    $("#output-error").setAttribute("hidden", "");
  } catch (e: any) {
    $("#output-code").textContent = "";
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
  // Tab switching
  for (const tab of $$(".tab")) {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((t) => t.classList.remove("active"));
      $$(".panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      const panel = tab.dataset.tab!;
      $(`[data-panel="${panel}"]`).classList.add("active");
    });
  }

  // Language tabs
  for (const tab of $$(".lang-tab")) {
    tab.addEventListener("click", () => {
      $$(".lang-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentLang = tab.dataset.lang as any;
      generate();
    });
  }

  // Copy button
  $("#btn-copy").addEventListener("click", () => {
    const text = $("#output-code").textContent ?? "";
    navigator.clipboard.writeText(text);
    const btn = $("#btn-copy");
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = "Copy"), 1500);
  });

  // Bind all inputs
  for (const input of $$("input, select, textarea")) {
    input.addEventListener("input", generate);
    input.addEventListener("change", generate);
  }

  // Initial render
  generate();
}
