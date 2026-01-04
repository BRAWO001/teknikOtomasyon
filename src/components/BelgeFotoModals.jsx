// src/components/BelgeFotoModals.jsx

import { useEffect, useState } from "react";
import axios from "axios";
import { getDataAsync } from "../utils/apiService";

import BelgeFotoHeader from "./BelgeFotoHeader";
import FotoUploadBlock from "./FotoUploadBlock";
import BelgeUploadBlock from "./BelgeUploadBlock";
import UploadedFilesSection from "./UploadedFilesSection";

// Ortamına göre değiştir
// const UPLOAD_URL = "https://pilotapisrc.com/api/HttpUpload/upload-ftp";
// const SAVE_URL_BASE = "https://pilotapisrc.com/api/IsEmriDosyaEkle";
const UPLOAD_URL = "https://pilotapisrc.com/api/HttpUpload/upload-ftp";
const SAVE_URL_BASE = "https://pilotapisrc.com/api/IsEmriDosyaEkle";

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
    if (isOpen && isEmriId) {
      loadFiles();
    }
  }, [isOpen, isEmriId]);

  // Ortak upload + iş emrine kaydet
  const uploadAndAttach = async (file, tur) => {
    if (!file) return;

    // 1) FTP'ye yükle
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await axios.post(UPLOAD_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const url = uploadRes.data?.Url || uploadRes.data?.url;
    if (!url) throw new Error("Upload cevabında Url alanı bulunamadı.");

    // 2) İş emrine kaydet
    const body = [
      {
        url,
        dosyaAdi: file.name,
        tur, // 10 = Foto, 20 = Belge
      },
    ];

    await axios.post(`${SAVE_URL_BASE}/${isEmriId}`, body, {
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
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black/60 p-2"
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
          {/* ÜST KISIM: Foto / Belge yükleme */}
          <div className="grid gap-3 md:grid-cols-2">
            <FotoUploadBlock uploadAndAttach={uploadAndAttach} />
            <BelgeUploadBlock uploadAndAttach={uploadAndAttach} />
          </div>

          {/* ALT KISIM: Liste */}
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
