import { useEffect, useState } from "react";
import { getDataAsync, postDataAsync } from "../utils/apiService";

import PeyzajBelgeFotoHeader from "./PeyzajBelgeFotoHeader";
import PeyzajFotoUploadBlock from "./PeyzajFotoUploadBlock";
import PeyzajBelgeUploadBlock from "./PeyzajBelgeUploadBlock";
import PeyzajUploadedFilesSection from "./PeyzajUploadedFilesSection";

const UPLOAD_URL = "HttpUpload/upload-ftp";
const SAVE_URL_BASE = "peyzaj-is-emri-formu";

const TUR = {
  FOTO: 10,
  BELGE: 20,
};

export default function PeyzajBelgeFotoModals({
  isOpen,
  onClose,
  peyzajIsEmriId,
  peyzajIsEmriKod,
}) {
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
    if (!peyzajIsEmriId) return;

    try {
      setLoadingFiles(true);
      setFilesError("");

      const data = await getDataAsync(`${SAVE_URL_BASE}/${peyzajIsEmriId}/dosyalar`);
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Peyzaj dosyaları alınırken hata:", err);
      setFilesError(err?.message || "Dosyalar alınırken bir hata oluştu.");
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (isOpen && peyzajIsEmriId) {
      loadFiles();
    }
  }, [isOpen, peyzajIsEmriId]);

  const uploadAndAttach = async (file, tur) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await postDataAsync(UPLOAD_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const url = uploadRes?.Url || uploadRes?.url;
    if (!url) throw new Error("Upload cevabında Url alanı bulunamadı.");

    const body = [
      {
        url,
        dosyaAdi: file.name,
        tur,
      },
    ];

    await postDataAsync(`${SAVE_URL_BASE}/${peyzajIsEmriId}/dosyalar`, body, {
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
        <PeyzajBelgeFotoHeader
          peyzajIsEmriId={peyzajIsEmriId}
          peyzajIsEmriKod={peyzajIsEmriKod}
          onClose={onClose}
        />

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 text-xs">
          <div className="grid gap-3 md:grid-cols-2">
            <PeyzajFotoUploadBlock uploadAndAttach={uploadAndAttach} />
            <PeyzajBelgeUploadBlock uploadAndAttach={uploadAndAttach} />
          </div>

          <PeyzajUploadedFilesSection
            files={files}
            loadingFiles={loadingFiles}
            filesError={filesError}
          />
        </div>
      </div>
    </div>
  );
}