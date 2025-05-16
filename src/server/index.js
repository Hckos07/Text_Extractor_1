import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Tesseract from "tesseract.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(cors());
app.use(express.json());

// Multer for file uploads
const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("OCR backend is running.");
});

// OCR Endpoint
app.post("/extract", upload.array("images", 50), async (req, res) => {
  const files = req.files;
  const results = [];

  try {
    for (const file of files) {
      const imagePath = path.join(__dirname, file.path);
      const {
        data: { text },
      } = await Tesseract.recognize(imagePath, "eng", {
        tessedit_char_whitelist:
          "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.@ ",
      });

      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

      for (let i = 0; i < lines.length - 1; i++) {
        const name = lines[i];
        const numberLine = lines[i + 1];
        const match = numberLine.match(/(?:\+91[-\s]?)?[789]\d{9}/);
        if (match) {
          results.push({ name, number: match[0] });
          i++;
        }
      }

      fs.unlinkSync(imagePath); // Cleanup
    }

    res.json(results);
  } catch (err) {
    console.error("OCR error:", err);
    res.status(500).json({ error: "Extraction failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});