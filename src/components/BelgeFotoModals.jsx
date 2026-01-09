




// src/components/BelgeFotoModals.jsx

import { useEffect, useState } from "react";
import { getDataAsync, postDataAsync } from "../utils/apiService";

import BelgeFotoHeader from "./BelgeFotoHeader";
import FotoUploadBlock from "./FotoUploadBlock";
import BelgeUploadBlock from "./BelgeUploadBlock";
import UploadedFilesSection from "./UploadedFilesSection";

// ✅ apiService base'i kullanacağı için relative endpoint
const UPLOAD_URL = "HttpUpload/upload-ftp";
const SAVE_URL_BASE = "IsEmriDosyaEkle";

export default function BelgeFotoModals({ isOpen, onClose, isEmriId, isEmriKod }) {
  if (!isOpen) return null;

  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filesError, setFilesError] = useState("");

  // ESC ile kapat
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Mevcut dosyaları çek
  const loadFiles = async () => {
    if (!isEmriId) return;
    try {
      setLoadingFiles(true);
      setFilesError("");
      const data = await getDataAsync(`IsEmriDosyaEkle/${isEmriId}`);
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Dosyalar alınırken hata:", err);
      setFilesError(err?.message || "Dosyalar alınırken bir hata oluştu.");
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (isOpen && isEmriId) loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEmriId]);

  // ✅ Ortak upload + iş emrine kaydet (SADECE POST)
  const uploadAndAttach = async (file, tur) => {
    if (!file) return;

    // 1) FTP'ye yükle (multipart)
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await postDataAsync(UPLOAD_URL, formData, {
      headers: {
        // ✅ Artık apiService bunu alıp kullanacak
        "Content-Type": "multipart/form-data",
      },
    });

    const url = uploadRes?.Url || uploadRes?.url;
    if (!url) throw new Error("Upload cevabında Url alanı bulunamadı.");

    // 2) İş emrine kaydet (json)
    const body = [
      {
        url,
        dosyaAdi: file.name,
        tur, // 10 = Foto, 20 = Belge
      },
    ];

    await postDataAsync(`${SAVE_URL_BASE}/${isEmriId}`, body, {
      headers: { "Content-Type": "application/json" },
    });

    // 3) Listeyi yenile
    await loadFiles();

    return url;
  };

  const handleCloseAndReload = () => {
    onClose?.();
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black p-2"
      onClick={onClose}
    >
      <div
        className="relative flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <BelgeFotoHeader
          isEmriId={isEmriId}
          isEmriKod={isEmriKod}
          onClose={handleCloseAndReload}
        />

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 text-xs">
          <div className="grid gap-3 md:grid-cols-2">
            <FotoUploadBlock uploadAndAttach={uploadAndAttach} />
            <BelgeUploadBlock uploadAndAttach={uploadAndAttach} />
          </div>

          <UploadedFilesSection
            files={files}
            loadingFiles={loadingFiles}
            filesError={filesError}
          />
        </div>
      </div>
    </div>
  );
}
