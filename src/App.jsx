import { useState } from "react";
import Tesseract from "tesseract.js";

export default function App() {
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [dataPairs, setDataPairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleImageChange = (e) => {
    const selected = Array.from(e.target.files).slice(0, 50);
    setImages(selected);
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
  };

  const extractData = async () => {
    setLoading(true);
    setDataPairs([]);
    const newPairs = [];

    for (const image of images) {
      try {
        const {
          data: { text }
        } = await Tesseract.recognize(image, "eng", {
          tessedit_char_whitelist: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.@ ",
        });

        const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

        for (let i = 0; i < lines.length - 1; i++) {
          const name = lines[i];
          const numberLine = lines[i + 1];

          // Match anything that looks like a phone number
          const phoneMatch = numberLine.match(/\d{10,13}/);

          if (phoneMatch) {
            let rawNumber = phoneMatch[0];

            // Take last 10 digits only (to remove country code like +91, 91, etc.)
            const cleanNumber = rawNumber.slice(-10);

            if (/^[6-9]\d{9}$/.test(cleanNumber)) {
              newPairs.push({ name, number: cleanNumber });
              i++; // Skip next line since it's already used
            }
          }
        }

      } catch (err) {
        console.error("Error processing image:", err);
      }
    }

    setDataPairs(newPairs);
    setLoading(false);
  };

  const copyAll = () => {
    const text = dataPairs.map(d => `${d.name} - ${d.number}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center p-6">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-4xl">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
          OCR Name & Number Extractor
        </h1>

        <label className="block cursor-pointer border-2 border-dashed border-gray-300 p-6 rounded-lg text-center text-gray-500 hover:bg-gray-100 transition">
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
          {previews.length > 0 ? (
            <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto mt-2">
              {previews.map((src, idx) => (
                <img key={idx} src={src} className="h-20 object-cover rounded" />
              ))}
            </div>
          ) : (
            <p>Click to upload up to 50 images</p>
          )}
        </label>

        {images.length > 0 && (
          <button
            onClick={extractData}
            disabled={loading}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition"
          >
            {loading ? "Extracting..." : "Extract Names & Numbers"}
          </button>
        )}

        {dataPairs.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-700 text-center mb-2">
              Extracted Data
            </h2>
            <ul className="bg-gray-100 p-4 rounded-lg shadow-inner max-h-64 overflow-y-auto text-sm">
              {dataPairs.map((pair, idx) => (
                <li key={idx} className="flex justify-between border-b last:border-none py-1">
                  <span className="text-gray-800">{pair.name}</span>
                  <span className="font-medium">{pair.number}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={copyAll}
              className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition"
            >
              {copied ? "Copied!" : "Copy All"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}