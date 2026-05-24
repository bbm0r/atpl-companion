import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createCollection } from "../src/lib/qdrant";

async function main() {
  await createCollection();
}

main().catch((e) => { console.error(e); process.exit(1); });
