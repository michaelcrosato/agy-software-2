import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { PDFParse } from "pdf-parse";

const workerPath = path.resolve("./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");
const workerUrl = pathToFileURL(workerPath).href;
console.log("Worker URL:", workerUrl);
PDFParse.setWorker(workerUrl);

const buffer = fs.readFileSync("tests/test-questionnaire.pdf");
const parser = new PDFParse({ data: buffer });
parser.getText().then(result => {
  console.log("SUCCESS TEXT:", JSON.stringify(result.text));
}).catch(err => {
  console.error("FAIL:", err);
});