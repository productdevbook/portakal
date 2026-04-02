import type {
  BoxOptions,
  CircleOptions,
  ImageOptions,
  LabelConfig,
  LabelElement,
  LineOptions,
  MonochromeBitmap,
  ResolvedLabel,
  TextOptions,
} from "./types";
import { InvalidConfigError } from "./errors";
import { toDots } from "./utils";
import { compileToTSC } from "./languages/tsc";
import { compileToZPL } from "./languages/zpl";
import { compileToEPL } from "./languages/epl";
import { compileToESCPOS } from "./languages/escpos";
import { compileToCPCL } from "./languages/cpcl";
import { compileToDPL } from "./languages/dpl";
import { compileToSBPL } from "./languages/sbpl";
import { compileToStarPRNT } from "./languages/starprnt";
import { compileToIPL } from "./languages/ipl";
import { renderPreview } from "./preview";

export class LabelBuilder {
  private readonly config: LabelConfig;
  private readonly elements: LabelElement[] = [];

  constructor(config: LabelConfig) {
    if (!config.width || config.width <= 0) {
      throw new InvalidConfigError("Label width must be a positive number");
    }
    this.config = config;
  }

  text(content: string, options: TextOptions = {}): this {
    this.elements.push({ type: "text", content, options });
    return this;
  }

  image(bitmap: MonochromeBitmap, options: ImageOptions = {}): this {
    this.elements.push({ type: "image", bitmap, options });
    return this;
  }

  box(options: BoxOptions): this {
    this.elements.push({ type: "box", options });
    return this;
  }

  line(options: LineOptions): this {
    this.elements.push({ type: "line", options });
    return this;
  }

  circle(options: CircleOptions): this {
    this.elements.push({ type: "circle", options });
    return this;
  }

  raw(content: string | Uint8Array): this {
    this.elements.push({ type: "raw", content });
    return this;
  }

  resolve(): ResolvedLabel {
    const unit = this.config.unit ?? "mm";
    const dpi = this.config.dpi ?? 203;

    return {
      widthDots: toDots(this.config.width, unit, dpi),
      heightDots: this.config.height ? toDots(this.config.height, unit, dpi) : 0,
      dpi,
      gapDots: this.config.gap != null ? toDots(this.config.gap, unit, dpi) : toDots(3, "mm", dpi),
      speed: this.config.speed ?? 4,
      density: this.config.density ?? 8,
      direction: this.config.direction ?? 0,
      copies: this.config.copies ?? 1,
      elements: this.elements,
    };
  }

  toTSC(): string {
    return compileToTSC(this.resolve());
  }

  toZPL(): string {
    return compileToZPL(this.resolve());
  }

  toEPL(): string {
    return compileToEPL(this.resolve());
  }

  toESCPOS(): Uint8Array {
    return compileToESCPOS(this.resolve());
  }

  toCPCL(): string {
    return compileToCPCL(this.resolve());
  }

  toDPL(): string {
    return compileToDPL(this.resolve());
  }

  toSBPL(): string {
    return compileToSBPL(this.resolve());
  }

  toStarPRNT(): Uint8Array {
    return compileToStarPRNT(this.resolve());
  }

  toIPL(): string {
    return compileToIPL(this.resolve());
  }

  toPreview(): string {
    return renderPreview(this.resolve());
  }
}

/** Create a new label builder */
export function label(config: LabelConfig): LabelBuilder {
  return new LabelBuilder(config);
}
