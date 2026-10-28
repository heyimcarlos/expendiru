import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "packages/backend/src/spend.generated.ts");

if (!existsSync(out)) {
  writeFileSync(
    out,
    `export { encodedSpendStub as encodedSpendGenerated } from "@expendiru/domain"\n`,
  );
}
