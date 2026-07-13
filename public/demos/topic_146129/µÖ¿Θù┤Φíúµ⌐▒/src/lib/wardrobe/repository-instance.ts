import { isAbsolute, join } from "node:path";
import { ensureDemoWardrobeData } from "./demo-data";
import { createLocalWardrobeRepository, type WardrobeRepository } from "./local-repository";

let repository: WardrobeRepository | undefined;

const resolveDatabasePath = () => {
  const configuredPath = process.env.WARDROBE_DB_PATH;

  if (!configuredPath) {
    return join(process.cwd(), "data", "wardrobe.db");
  }

  return isAbsolute(configuredPath) ? configuredPath : join(process.cwd(), configuredPath);
};

export const getWardrobeRepository = () => {
  if (!repository) {
    repository = createLocalWardrobeRepository(resolveDatabasePath());

    if (process.env.WARDROBE_ENABLE_DEMO_DATA !== "false") {
      ensureDemoWardrobeData(repository);
    }
  }

  return repository;
};
