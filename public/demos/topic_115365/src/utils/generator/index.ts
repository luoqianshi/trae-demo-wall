import type { Control, ProjectConfig, GeneratedFile } from "@/types";
import { generateVueFiles } from "./vueGenerator";
import { generateJavaFiles } from "./javaGenerator";
import { generateSqlFile } from "./sqlGenerator";

export function generateAll(config: ProjectConfig, controls: Control[]): GeneratedFile[] {
  const vueFiles = generateVueFiles(config, controls);
  const javaFiles = generateJavaFiles(config, controls);
  const sqlFile = generateSqlFile(config, controls);
  return [...vueFiles, ...javaFiles, sqlFile];
}

export { generateVueFiles, generateJavaFiles, generateSqlFile };
