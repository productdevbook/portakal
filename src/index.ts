export { label, LabelBuilder } from "./builder";
export { PortakalError, InvalidConfigError, UnsupportedFeatureError } from "./errors";
export { toDots } from "./utils";
export { compileToTSC } from "./languages/tsc";
export { compileToZPL } from "./languages/zpl";
export { compileToEPL } from "./languages/epl";
export { compileToESCPOS } from "./languages/escpos";
export { compileToCPCL } from "./languages/cpcl";
export { compileToDPL } from "./languages/dpl";
export { compileToSBPL } from "./languages/sbpl";
export { compileToStarPRNT } from "./languages/starprnt";
export { compileToIPL } from "./languages/ipl";
export { renderPreview } from "./preview";
export {
  imageToMonochrome,
  rgbaToGrayscale,
  packBitmap,
  ditherThreshold,
  ditherFloydSteinberg,
  ditherAtkinson,
  ditherOrdered,
} from "./image";
export { formatRow, formatPair, formatTable, separator, wordWrap } from "./receipt";
export type { Column } from "./receipt";
export { encodeText, encodeTextForPrinter, isASCII, CODE_PAGES } from "./encoding";
export type { CodePage, EncodedSegment } from "./encoding";
export {
  PRINTER_PROFILES,
  getProfile,
  listProfiles,
  findByVendorId,
  findByLanguage,
} from "./profiles";
export type { PrinterProfile, PrinterLanguage, CutterType, ImageMode } from "./profiles";
export { chunkedWrite, writeWithRetry, BLE_UUIDS, USB_VENDOR_IDS } from "./transport";
export { parseTSC, parseTSPL } from "./parsers/tsc";
export { parseZPL } from "./parsers/zpl";
export { parseEPL } from "./parsers/epl";
export { parseCPCL } from "./parsers/cpcl";
export { parseESCPOS } from "./parsers/escpos";
export { parseDPL } from "./parsers/dpl";
export { parseSBPL } from "./parsers/sbpl";
export { parseStarPRNT } from "./parsers/starprnt";
export { parseIPL } from "./parsers/ipl";
export type {
  PrinterTransport,
  ConnectionState,
  ChunkOptions,
  ReconnectOptions,
  TCPConfig,
  USBConfig,
  BLEConfig,
} from "./transport";

export type {
  Alignment,
  BoxOptions,
  CircleOptions,
  DitherAlgorithm,
  ImageOptions,
  LabelConfig,
  LabelElement,
  LineOptions,
  MonochromeBitmap,
  ResolvedLabel,
  Rotation,
  TextOptions,
  Unit,
} from "./types";
