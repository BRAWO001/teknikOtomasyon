





import { useEffect, useState } from "react";
import { getDataAsync, postDataAsync } from "../utils/apiService";

import ProjeDosyaUploadBlock from "./ProjeDosyaUploadBlock";
import ProjeUploadedFilesSection from "./ProjeUploadedFilesSection";

const UPLOAD_URL = "HttpUpload/upload-ftp";
const SAVE_URL_BASE = "ProjeYonetimDosyaEkle";

export default function ProjeDosyaModals({ isOpen, onClose, siteId, baslik }) {
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filesError, setFilesError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const handler = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const loadFiles = async () => {
    if (!siteId) return;

    try {
      setLoadingFiles(true);
      setFilesError("");

      const data = await getDataAsync(`${SAVE_URL_BASE}/${siteId}`);
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Dosyalar alınırken hata:", err);
      setFilesError(err?.message || "Dosyalar alınırken bir hata oluştu.");
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (isOpen && siteId) loadFiles();
  }, [isOpen, siteId]);

  const uploadAndAttach = async (file, meta) => {
    if (!file) return;

    const tur = (meta?.tur || "Genel").trim();
    const belgeBasligi = (meta?.belgeBasligi || "").trim();
    const belgeAciklamasi = (meta?.belgeAciklamasi || "").trim();

    if (!belgeBasligi) throw new Error("Belge Başlığı zorunlu.");
    if (!belgeAciklamasi) throw new Error("Belge Açıklaması zorunlu.");

    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await postDataAsync(UPLOAD_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const url = uploadRes?.Url || uploadRes?.url;
    if (!url) throw new Error("Upload cevabında Url alanı bulunamadı.");

    const body = [
      {
        url,
        dosyaAdi: file.name,
        tur,
        belgeBasligi,
        belgeAciklamasi,
      },
    ];

    await postDataAsync(`${SAVE_URL_BASE}/${siteId}`, body, {
      headers: { "Content-Type": "application/json" },
    });

    await loadFiles();
    return url;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black p-2"
      onClick={onClose}
    >
      <div
        className="relative flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-4xl font-extrabold tracking-wide text-emerald-600">
              {baslik}
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Kapat ✕
            </button>
          </div>

          <p className="mt-1 text-[11px] text-zinc-500">
            Bu dokümanlar seçili siteye aittir.
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 text-xs">
          <ProjeDosyaUploadBlock uploadAndAttach={uploadAndAttach} />

          <ProjeUploadedFilesSection
            files={files}
            loadingFiles={loadingFiles}
            filesError={filesError}
          />
        </div>
      </div>
    </div>
  );
}