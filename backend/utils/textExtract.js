const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");

let pdfParse = null;
try {
  const pdfModule = require("pdf-parse");
  pdfParse = pdfModule?.default || pdfModule;
} catch (err) {
  console.error("Failed to load pdf-parse:", err.message);
}

function clampText(text, maxChars = 18000) {
  const clean = String(text || "").trim();
  if (!clean) return "";
  if (clean.length <= maxChars) return clean;
  return clean.slice(0, maxChars);
}

async function extractTextFromFile(filePath, originalName = "") {
  const ext = (path.extname(originalName || filePath) || "").toLowerCase();

  if (!filePath || !fs.existsSync(filePath)) {
    return "";
  }

  try {
    if (ext === ".pdf") {
      if (!pdfParse) {
        throw new Error("pdf-parse is not available");
      }

      const buffer = fs.readFileSync(filePath);
      const parsed = await pdfParse(buffer);
      return parsed?.text || "";
    }

    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      return result?.value || "";
    }

    if (ext === ".txt") {
      return fs.readFileSync(filePath, "utf8");
    }

    return "";
  } catch (err) {
    console.error("extractTextFromFile error:", err);
    return "";
  }
}

module.exports = { extractTextFromFile, clampText };