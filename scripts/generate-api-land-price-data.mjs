import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const benchmarkSource = resolve(root, "src/data/land-price-benchmarks.ts");
const transactionSource = resolve(root, "src/data/land-price-transaction.generated.ts");
const outputDirectory = resolve(root, "api/data");

const benchmarkOutput = resolve(outputDirectory, "land-price-benchmarks.js");
const transactionOutput = resolve(outputDirectory, "land-price-transaction.generated.js");

const benchmarkText = await readFile(benchmarkSource, "utf8");
const transactionText = await readFile(transactionSource, "utf8");

let benchmarks = benchmarkText
  .replace(/export type DistrictLandPriceBenchmark = \{[\s\S]*?\};\s*/, "")
  .replace(
    "export const DISTRICT_LAND_PRICE_BENCHMARKS: Record<string, DistrictLandPriceBenchmark> = {",
    "export const DISTRICT_LAND_PRICE_BENCHMARKS = {"
  )
  .replace(/export function getDistrictLandPriceBenchmark\([\s\S]*$/, "");

if (benchmarks.includes("DistrictLandPriceBenchmark")) {
  throw new Error("TypeScript benchmark annotations remain in the API JavaScript output.");
}

const rowsMarker = "export const LAND_PRICE_TRANSACTION_ROWS = ";
const rowsStart = transactionText.indexOf(rowsMarker);
if (rowsStart < 0) throw new Error("Transaction rows export is missing.");

let transactions = transactionText.slice(rowsStart)
  .replace(/ as const satisfies readonly LandPriceTransactionRow\[\];?\s*$/, ";");

if (transactions.includes("LandPriceTransactionRow")) {
  throw new Error("TypeScript transaction annotations remain in the API JavaScript output.");
}

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(benchmarkOutput, benchmarks, "utf8"),
  writeFile(transactionOutput, transactions, "utf8")
]);

console.log("Generated Vercel-compatible JavaScript land-price data from the canonical TypeScript sources.");
