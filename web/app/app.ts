import { label, type LabelBuilder } from "portakal";

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
    $("#output-error").setAttribute("hidden", "");
  } catch (e: any) {
    $("#output-code").textContent = "";
    $("#preview-container").innerHTML = "";
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

  for (const input of $$("input, select")) {
    input.addEventListener("input", generate);
    input.addEventListener("change", generate);
  }

  generate();
}
