import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function serifFont() {
  return readFile(join(process.cwd(), "assets/InstrumentSerif-Regular.ttf"));
}
