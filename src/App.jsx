import { useState } from "react";

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
    if (images.length === 0) return;

    setLoading(true);
    setDataPairs([]);

    const formData = new FormData();
    images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      const res = await fetch("https://textextractor1-production.up.railway.app/extract", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to extract data");
      }

      const data = await res.json();
      setDataPairs(data);
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong while extracting data.");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    const text = dataPairs.map((d) => `${d.name} - ${d.number}`).join("\n");
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