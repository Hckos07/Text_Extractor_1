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
const PORT = process.env.PORT || 8080;

// Enable CORS for your Vercel frontend
app.use(cors({
  origin: "https://textextractor1-git-main-abhay-pals-projects-1bdaeb02.vercel.app",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

// Multer config (make sure /uploads exists)
const upload = multer({ dest: path.join(__dirname, "uploads/") });

// Test route
app.get("/", (req, res) => {
  res.send("OCR backend is running successfully.");
});

// OCR processing route
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
        const match = numberLine.match(/(?:\+91[-\s]?)?[6-9]\d{9}/);
        if (match) {
          results.push({ name, number: match[0] });
          i++;
        }
      }

      fs.unlinkSync(imagePath); // Cleanup uploaded file
    }

    res.json(results);
  } catch (err) {
    console.error("OCR processing error:", err);
    res.status(500).json({ error: "Extraction failed" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});