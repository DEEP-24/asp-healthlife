import GeneratorHelper from "@prisma/generator-helper";
import fs from "node:fs/promises";
import path from "node:path";

const { generatorHandler } = GeneratorHelper;

/**
 * This is a fix for the enums not being available in the prisma client after `vite build`.
 * @see https://github.com/prisma/prisma/issues/12504
 */

const header = "// This file was generated by a custom prisma generator, do not edit manually.\n";

generatorHandler({
  async onGenerate(options) {
    const enums = options.dmmf.datamodel.enums;

    const output = enums.map((e) => {
      let enumString = `export const ${e.name} = {\n`;
      // biome-ignore lint/complexity/noForEach: <explanation>
      e.values.forEach(({ name: value }) => {
        enumString += `  ${value}: "${value}",\n`;
      });
      enumString += "} as const;\n\n";
      enumString += `export type ${e.name} = (typeof ${e.name})[keyof typeof ${e.name}];\n`;

      return enumString;
    });

    const outputFile = options.generator.output;
    if (!outputFile || !outputFile.value) {
      throw new Error("No output file specified");
    }

    const outputPath = path.resolve(outputFile.value);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, header + output.join("\n"), "utf-8");
  },
  onManifest() {
    return {
      defaultOutput: "../app/utils/enums.ts",
      prettyName: "Prisma Enum Generator",
    };
  },
});
