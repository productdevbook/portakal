import type {
  BoxOptions,
  CircleOptions,
  EllipseOptions,
  EraseOptions,
  ImageOptions,
  LabelConfig,
  LabelElement,
  LineOptions,
  MonochromeBitmap,
  ResolvedLabel,
  ReverseOptions,
  TextOptions,
} from "./types";
import { InvalidConfigError } from "./errors";
import { toDots } from "./utils";
import { getProfile } from "./profiles";

export class LabelBuilder {
  private readonly config: LabelConfig;
  private readonly elements: LabelElement[] = [];

  constructor(config: LabelConfig) {
    if (config.printer) {
      const profile = getProfile(config.printer);
      if (profile) {
        config = {
          ...config,
          width: config.width || profile.paperWidth,
          dpi: config.dpi ?? profile.dpi,
          unit: config.unit ?? "mm",
        };
      }
    }
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

  ellipse(options: EllipseOptions): this {
    this.elements.push({ type: "ellipse", options });
    return this;
  }

  reverse(options: ReverseOptions): this {
    this.elements.push({ type: "reverse", options });
    return this;
  }

  erase(options: EraseOptions): this {
    this.elements.push({ type: "erase", options });
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
}

export function label(config: LabelConfig): LabelBuilder {
  return new LabelBuilder(config);
}
