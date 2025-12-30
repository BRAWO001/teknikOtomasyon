// src/components/BelgeUploadBlock.jsx

import { useState } from "react";

export default function BelgeUploadBlock({ uploadAndAttach }) {
  const [docUploading, setDocUploading] = useState(false);
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docError, setDocError] = useState("");

  const handleDocChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocError("");
    setDocUrl("");
    setDocName(file.name);

    try {
      setDocUploading(true);
      const url = await uploadAndAttach(file, 20);
      setDocUrl(url);
    } catch (err) {
      console.error("Belge upload hata:", err);
      setDocError(
        err?.response?.data?.Message ||
          err?.message ||
          "Belge yüklenirken bir hata oluştu."
      );
    } finally {
      setDocUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Belge
      </div>

      <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900">
        {docUploading ? "Yükleniyor..." : "Belge Seç"}
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleDocChange}
        />
      </label>

      {docName && (
        <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          Seçilen: {docName}
        </div>
      )}

      {docUrl && (
        <div className="mt-2 max-w-full break-all rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          URL: {docUrl}
        </div>
      )}

      {docError && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {docError}
        </div>
      )}
    </div>
  );
}
