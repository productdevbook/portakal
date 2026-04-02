import { defineBuildConfig } from "obuild/config";

export default defineBuildConfig({
  entries: [
    {
      type: "bundle",
      input: [
        "./src/index.ts",
        "./src/languages/tsc.ts",
        "./src/languages/zpl.ts",
        "./src/languages/epl.ts",
        "./src/languages/escpos.ts",
        "./src/languages/cpcl.ts",
        "./src/languages/dpl.ts",
        "./src/languages/sbpl.ts",
        "./src/languages/starprnt.ts",
        "./src/languages/ipl.ts",
        "./src/image.ts",
        "./src/receipt.ts",
        "./src/encoding.ts",
        "./src/profiles.ts",
        "./src/transport.ts",
        "./src/preview.ts",
      ],
      minify: true,
    },
  ],
});
