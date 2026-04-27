"use client";

import { useState, useCallback } from "react";

export default function UploadPage() {
  const [files, setFiles] = useState<{ name: string; path: string }[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(async (fileList: FileList) => {
    setUploading(true);
    const results: { name: string; path: string }[] = [];

    for (const file of Array.from(fileList)) {
      const formData = new FormData();
      formData.append("file", file);
      // slugify filename
      const slug = file.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9.\-]/g, "");
      formData.append("name", slug);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      results.push({ name: slug, path: data.path });
    }

    setFiles((prev) => [...prev, ...results]);
    setUploading(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
    },
    [upload]
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-12 font-mono">
      <h1 className="text-2xl font-bold mb-2">Image Uploader</h1>
      <p className="text-gray-400 mb-8 text-sm">
        Drop images here → saved to <code className="text-red-500">public/images/projects/</code>
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-16 text-center transition-colors cursor-pointer ${
          dragging ? "border-red-500 bg-red-500/10" : "border-gray-700 hover:border-gray-500"
        }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <p className="text-4xl mb-4">🖼️</p>
        <p className="text-gray-300">{uploading ? "Uploading…" : "Drag & drop images here, or click to select"}</p>
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-8 space-y-3">
          <h2 className="text-gray-400 text-sm uppercase tracking-widest">Uploaded</h2>
          {files.map((f) => (
            <div key={f.path} className="flex items-center gap-4 bg-gray-900 rounded-lg p-4">
              <img src={f.path} alt={f.name} className="w-16 h-16 object-cover rounded" />
              <div>
                <p className="text-white font-medium">{f.name}</p>
                <code className="text-red-500 text-sm">{f.path}</code>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
