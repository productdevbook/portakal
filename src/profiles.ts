/**
 * Printer capability profiles — know what each printer model supports.
 * Solves the "works on my Epson but not on my XPrinter" problem.
 */

export type PrinterLanguage =
  | "tsc"
  | "zpl"
  | "epl"
  | "cpcl"
  | "dpl"
  | "sbpl"
  | "escpos"
  | "starprnt"
  | "ipl";

export type CutterType = "none" | "partial" | "full";

export type ImageMode = "raster" | "column" | "nvGraphics";

export interface PrinterProfile {
  /** Printer model name */
  name: string;
  /** Manufacturer */
  vendor: string;
  /** Primary printer language */
  language: PrinterLanguage;
  /** Paper width in mm */
  paperWidth: number;
  /** Print width in dots */
  dotsPerLine: number;
  /** Printer DPI */
  dpi: number;
  /** Characters per line (Font A) */
  charsPerLine: number;
  /** USB Vendor ID (hex) */
  usbVendorId?: number;
  /** USB Product ID (hex) */
  usbProductId?: number;
  /** Features */
  features: {
    cutter: CutterType;
    cashDrawer: boolean;
    imageMode: ImageMode[];
    cjk: boolean;
    nativeUtf8: boolean;
    codePages: number[];
  };
}

/** Built-in printer profiles */
export const PRINTER_PROFILES: Record<string, PrinterProfile> = {
  // === ESC/POS Receipt Printers ===
  "epson-tm-t88vi": {
    name: "Epson TM-T88VI",
    vendor: "Epson",
    language: "escpos",
    paperWidth: 80,
    dotsPerLine: 576,
    dpi: 203,
    charsPerLine: 48,
    usbVendorId: 0x04b8,
    features: {
      cutter: "partial",
      cashDrawer: true,
      imageMode: ["raster", "column", "nvGraphics"],
      cjk: true,
      nativeUtf8: true,
      codePages: [0, 1, 2, 3, 4, 5, 11, 12, 13, 14, 15, 16, 17, 18, 19, 255],
    },
  },
  "epson-tm-t88v": {
    name: "Epson TM-T88V",
    vendor: "Epson",
    language: "escpos",
    paperWidth: 80,
    dotsPerLine: 576,
    dpi: 203,
    charsPerLine: 48,
    usbVendorId: 0x04b8,
    features: {
      cutter: "partial",
      cashDrawer: true,
      imageMode: ["raster", "column"],
      cjk: true,
      nativeUtf8: false,
      codePages: [0, 1, 2, 3, 4, 5, 16, 17, 18, 19],
    },
  },
  "epson-tm-t20iii": {
    name: "Epson TM-T20III",
    vendor: "Epson",
    language: "escpos",
    paperWidth: 80,
    dotsPerLine: 576,
    dpi: 203,
    charsPerLine: 48,
    usbVendorId: 0x04b8,
    features: {
      cutter: "partial",
      cashDrawer: true,
      imageMode: ["raster", "column"],
      cjk: true,
      nativeUtf8: true,
      codePages: [0, 16, 17, 19],
    },
  },
  "epson-tm-m30ii": {
    name: "Epson TM-m30II",
    vendor: "Epson",
    language: "escpos",
    paperWidth: 80,
    dotsPerLine: 576,
    dpi: 203,
    charsPerLine: 48,
    usbVendorId: 0x04b8,
    features: {
      cutter: "partial",
      cashDrawer: false,
      imageMode: ["raster", "nvGraphics"],
      cjk: true,
      nativeUtf8: true,
      codePages: [0, 16, 17, 19, 255],
    },
  },

  // === Star Micronics ===
  "star-tsp143": {
    name: "Star TSP143",
    vendor: "Star Micronics",
    language: "starprnt",
    paperWidth: 80,
    dotsPerLine: 576,
    dpi: 203,
    charsPerLine: 48,
    usbVendorId: 0x0519,
    features: {
      cutter: "partial",
      cashDrawer: true,
      imageMode: ["raster"],
      cjk: false,
      nativeUtf8: false,
      codePages: [],
    },
  },
  "star-tsp100": {
    name: "Star TSP100",
    vendor: "Star Micronics",
    language: "starprnt",
    paperWidth: 80,
    dotsPerLine: 576,
    dpi: 203,
    charsPerLine: 48,
    usbVendorId: 0x0519,
    features: {
      cutter: "partial",
      cashDrawer: true,
      imageMode: ["raster"],
      cjk: false,
      nativeUtf8: false,
      codePages: [],
    },
  },

  // === Bixolon ===
  "bixolon-srp-350": {
    name: "Bixolon SRP-350",
    vendor: "Bixolon",
    language: "escpos",
    paperWidth: 80,
    dotsPerLine: 576,
    dpi: 203,
    charsPerLine: 48,
    usbVendorId: 0x1504,
    features: {
      cutter: "partial",
      cashDrawer: true,
      imageMode: ["raster"],
      cjk: false,
      nativeUtf8: false,
      codePages: [0, 16, 17],
    },
  },

  // === Citizen ===
  "citizen-ct-s310ii": {
    name: "Citizen CT-S310II",
    vendor: "Citizen",
    language: "escpos",
    paperWidth: 80,
    dotsPerLine: 576,
    dpi: 203,
    charsPerLine: 48,
    usbVendorId: 0x1d90,
    features: {
      cutter: "partial",
      cashDrawer: true,
      imageMode: ["raster", "column"],
      cjk: false,
      nativeUtf8: false,
      codePages: [0, 16, 17],
    },
  },

  // === 58mm generic ===
  "generic-58mm": {
    name: "Generic 58mm",
    vendor: "Generic",
    language: "escpos",
    paperWidth: 58,
    dotsPerLine: 384,
    dpi: 203,
    charsPerLine: 32,
    features: {
      cutter: "none",
      cashDrawer: false,
      imageMode: ["raster"],
      cjk: false,
      nativeUtf8: false,
      codePages: [0],
    },
  },
  "generic-80mm": {
    name: "Generic 80mm",
    vendor: "Generic",
    language: "escpos",
    paperWidth: 80,
    dotsPerLine: 576,
    dpi: 203,
    charsPerLine: 48,
    features: {
      cutter: "partial",
      cashDrawer: true,
      imageMode: ["raster"],
      cjk: false,
      nativeUtf8: false,
      codePages: [0, 16],
    },
  },

  // === TSC Label Printers ===
  "tsc-te200": {
    name: "TSC TE200",
    vendor: "TSC",
    language: "tsc",
    paperWidth: 108,
    dotsPerLine: 832,
    dpi: 203,
    charsPerLine: 0,
    usbVendorId: 0x1203,
    features: {
      cutter: "none",
      cashDrawer: false,
      imageMode: ["raster"],
      cjk: true,
      nativeUtf8: false,
      codePages: [],
    },
  },
  "tsc-te310": {
    name: "TSC TE310",
    vendor: "TSC",
    language: "tsc",
    paperWidth: 108,
    dotsPerLine: 1276,
    dpi: 300,
    charsPerLine: 0,
    usbVendorId: 0x1203,
    features: {
      cutter: "none",
      cashDrawer: false,
      imageMode: ["raster"],
      cjk: true,
      nativeUtf8: false,
      codePages: [],
    },
  },

  // === Zebra Label Printers ===
  "zebra-zd420": {
    name: "Zebra ZD420",
    vendor: "Zebra",
    language: "zpl",
    paperWidth: 108,
    dotsPerLine: 832,
    dpi: 203,
    charsPerLine: 0,
    usbVendorId: 0x0a5f,
    features: {
      cutter: "full",
      cashDrawer: false,
      imageMode: ["raster"],
      cjk: false,
      nativeUtf8: true,
      codePages: [],
    },
  },
  "zebra-zt410": {
    name: "Zebra ZT410",
    vendor: "Zebra",
    language: "zpl",
    paperWidth: 104,
    dotsPerLine: 832,
    dpi: 203,
    charsPerLine: 0,
    usbVendorId: 0x0a5f,
    features: {
      cutter: "full",
      cashDrawer: false,
      imageMode: ["raster"],
      cjk: false,
      nativeUtf8: true,
      codePages: [],
    },
  },
  "zebra-gk420": {
    name: "Zebra GK420",
    vendor: "Zebra",
    language: "epl",
    paperWidth: 108,
    dotsPerLine: 832,
    dpi: 203,
    charsPerLine: 0,
    usbVendorId: 0x0a5f,
    features: {
      cutter: "none",
      cashDrawer: false,
      imageMode: ["raster"],
      cjk: false,
      nativeUtf8: false,
      codePages: [],
    },
  },

  // === SATO ===
  "sato-cl4nx": {
    name: "SATO CL4NX",
    vendor: "SATO",
    language: "sbpl",
    paperWidth: 104,
    dotsPerLine: 832,
    dpi: 203,
    charsPerLine: 0,
    features: {
      cutter: "full",
      cashDrawer: false,
      imageMode: ["raster"],
      cjk: true,
      nativeUtf8: false,
      codePages: [],
    },
  },

  // === Honeywell ===
  "honeywell-pc42t": {
    name: "Honeywell PC42t",
    vendor: "Honeywell",
    language: "dpl",
    paperWidth: 108,
    dotsPerLine: 832,
    dpi: 203,
    charsPerLine: 0,
    features: {
      cutter: "none",
      cashDrawer: false,
      imageMode: ["raster"],
      cjk: false,
      nativeUtf8: false,
      codePages: [],
    },
  },
};

/** Get a printer profile by model ID */
export function getProfile(modelId: string): PrinterProfile | undefined {
  return PRINTER_PROFILES[modelId];
}

/** List all available profile IDs */
export function listProfiles(): string[] {
  return Object.keys(PRINTER_PROFILES);
}

/** Find profiles by USB vendor ID */
export function findByVendorId(vendorId: number): PrinterProfile[] {
  return Object.values(PRINTER_PROFILES).filter((p) => p.usbVendorId === vendorId);
}

/** Find profiles by language */
export function findByLanguage(language: PrinterLanguage): PrinterProfile[] {
  return Object.values(PRINTER_PROFILES).filter((p) => p.language === language);
}
