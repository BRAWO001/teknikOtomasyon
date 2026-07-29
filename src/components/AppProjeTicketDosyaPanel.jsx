// src/components/TicketDosyaPanel.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

const UPLOAD_URL = "HttpUpload/upload-ftp";
const SAVE_URL_BASE = "DestekTalepDosyaEkle";

const TUR = { FOTO: 10, BELGE: 20 };

const MAX_FILE_COUNT = 5;
const MAX_SINGLE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "pdf"];

function pickAny(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return null;
}
function pickId(obj) {
  return pickAny(obj, "id", "Id", "ticketId", "TicketId", "dosyaId", "DosyaId");
}
function fileExt(name) {
  const s = String(name || "");
  const idx = s.lastIndexOf(".");
  return idx >= 0 ? s.slice(idx + 1).toLowerCase() : "";
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
function isProbablyImage(file) {
  const t = String(file?.type || "").toLowerCase();
  if (t.startsWith("image/")) return true;
  const ext = fileExt(file?.name);
  return ["jpg", "jpeg", "png", "webp", "heic"].includes(ext);
}
function isProbablyPdfOrDoc(file) {
  const t = String(file?.type || "").toLowerCase();
  if (t.includes("pdf")) return true;
  const ext = fileExt(file?.name);
  return ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(ext);
}

/**
 * Görseli yeniden boyutlandırıp JPEG olarak sıkıştırır.
 * quality: 0-1
 * maxWidth / maxHeight: maksimum çözünürlük sınırı
 */
async function compressImageFile(
  file,
  quality = 0.75,
  maxWidth = 1920,
  maxHeight = 1920
) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        let { width, height } = img;

        const widthRatio = maxWidth / width;
        const heightRatio = maxHeight / height;
        const ratio = Math.min(widthRatio, heightRatio, 1);

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context alınamadı."));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Görsel sıkıştırılamadı."));
              return;
            }

            const safeName = String(file?.name || "photo.jpg").replace(
              /\.(png|webp|heic)$/i,
              ".jpg"
            );

            const compressedFile = new File([blob], safeName, {
              type: "image/jpeg",
            });

            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => reject(err);

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export default function TicketDosyaPanel({ ticketId, onStatusChange, disabled }) {
  const inputRef = useRef(null);
  const _ticketId = useMemo(() => {
    const n = Number(ticketId || 0);
    return n > 0 ? n : 0;
  }, [ticketId]);

  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filesError, setFilesError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [pending, setPending] = useState([]); // [{ url, dosyaAdi, tur, createdAt }]
  const [attaching, setAttaching] = useState(false);
  const [attachError, setAttachError] = useState("");

  // progress
  const [uploadTotal, setUploadTotal] = useState(0);
  const [uploadDone, setUploadDone] = useState(0);
  const [uploadingName, setUploadingName] = useState("");

  useEffect(() => {
    if (typeof onStatusChange === "function") {
      onStatusChange({
        uploading,
        attaching,
        pendingCount: pending.length,
        hasTicketId: !!_ticketId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploading, attaching, pending.length, _ticketId]);

  const loadFiles = async () => {
    if (!_ticketId) return;
    try {
      setLoadingFiles(true);
      setFilesError("");
      const data = await getDataAsync(`${SAVE_URL_BASE}/${_ticketId}`);
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Ticket dosyaları alınırken hata:", err);
      setFilesError(err?.message || "Dosyalar alınırken bir hata oluştu.");
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (_ticketId) loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_ticketId]);

  const uploadOnly = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await postDataAsync(UPLOAD_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const url = uploadRes?.Url || uploadRes?.url;
    if (!url) throw new Error("Upload cevabında Url alanı bulunamadı.");
    return url;
  };

  const attachToTicket = async (items) => {
    if (!_ticketId) return;

    const body = (items || []).map((x) => ({
      url: x.url,
      dosyaAdi: x.dosyaAdi,
      tur: x.tur,
    }));

    if (!body.length) return;

    await postDataAsync(`${SAVE_URL_BASE}/${_ticketId}`, body, {
      headers: { "Content-Type": "application/json" },
    });
  };

  // ticketId sonradan geldiyse pending’i tek seferde DB’ye bağla
  useEffect(() => {
    const run = async () => {
      if (!_ticketId) return;
      if (!pending.length) return;
      if (attaching) return;

      try {
        setAttachError("");
        setAttaching(true);

        await attachToTicket(pending);

        setPending([]);
        await loadFiles();
      } catch (err) {
        console.error("PENDING ATTACH ERROR:", err);
        setAttachError(err?.message || "Bekleyen dosyalar ticket'a bağlanırken hata oluştu.");
      } finally {
        setAttaching(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_ticketId, pending.length]);

  const validateSelectedFiles = (selectedFiles) => {
    const currentCount = pending.length + files.length;
    const nextCount = currentCount + selectedFiles.length;

    if (nextCount > MAX_FILE_COUNT) {
      return `En fazla ${MAX_FILE_COUNT} dosya ekleyebilirsiniz.`;
    }

    const selectedTotal = selectedFiles.reduce(
      (sum, file) => sum + Number(file?.size || 0),
      0
    );

    if (selectedTotal > MAX_TOTAL_SIZE) {
      return "Seçilen dosyaların toplam boyutu 20 MB'ı geçemez.";
    }

    for (const file of selectedFiles) {
      const ext = fileExt(file?.name);

      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return `${file?.name || "Dosya"} desteklenmiyor. JPG, JPEG, PNG, WEBP veya PDF seçin.`;
      }

      if (Number(file?.size || 0) > MAX_SINGLE_SIZE) {
        return `${file?.name || "Dosya"} 5 MB sınırını aşıyor.`;
      }
    }

    return null;
  };

  const handlePickAndUpload = async (e) => {
    const selectedFiles = Array.from(e?.target?.files || []);
    if (e?.target) e.target.value = "";

    if (selectedFiles.length === 0) return;

    setUploadError("");
    setAttachError("");

    const validationError = validateSelectedFiles(selectedFiles);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploading(true);
    setUploadTotal(selectedFiles.length);
    setUploadDone(0);
    setUploadingName("");

    const uploadedItems = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const originalFile = selectedFiles[i];
        const tur = isProbablyImage(originalFile) ? TUR.FOTO : TUR.BELGE;
        setUploadingName(originalFile?.name || "");

        let fileToUpload = originalFile;
        let finalDosyaAdi = originalFile?.name || "dosya";

        if (tur === TUR.FOTO) {
          fileToUpload = await compressImageFile(
            originalFile,
            0.75,
            1920,
            1920
          );
          finalDosyaAdi =
            fileToUpload?.name || originalFile?.name || "foto.jpg";
        }

        const url = await uploadOnly(fileToUpload);

        uploadedItems.push({
          url,
          dosyaAdi: finalDosyaAdi,
          tur,
          size: Number(originalFile?.size || 0),
          createdAt: new Date().toISOString(),
        });

        setUploadDone(i + 1);
      }

      if (_ticketId) {
        setAttaching(true);
        try {
          await attachToTicket(uploadedItems);
          await loadFiles();
        } finally {
          setAttaching(false);
        }
      } else {
        setPending((prev) => [...uploadedItems, ...prev]);
      }
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      setUploadError(err?.message || "Yükleme sırasında hata oluştu.");
    } finally {
      setUploading(false);
      setUploadingName("");
      setUploadTotal(0);
      setUploadDone(0);
    }
  };

  const pendingTotalSize = pending.reduce(
    (sum, item) => sum + Number(item?.size || 0),
    0
  );

  return (
    <section className="mt-5 space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Görsel ve belgeler
        </div>

        <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          {pending.length + files.length}/5 dosya · {formatBytes(pendingTotalSize)}
        </div>
      </div>

      {uploadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {uploadError}
        </div>
      ) : null}

      {attachError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {attachError}
        </div>
      ) : null}

      {filesError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {filesError}
        </div>
      ) : null}

      {(uploading || attaching) && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          {uploading ? (
            <div>
              Yükleme: <b>{uploadDone}</b> / <b>{uploadTotal}</b>
              {uploadingName ? (
                <div className="mt-1 text-[11px] opacity-80">
                  Şu an: {uploadingName}
                </div>
              ) : null}
            </div>
          ) : (
            "Dosyalar talebe bağlanıyor..."
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={
          disabled ||
          uploading ||
          attaching ||
          pending.length + files.length >= MAX_FILE_COUNT
        }
        className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-7 text-sm font-semibold text-zinc-700 transition hover:border-zinc-500 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-950"
      >
        {uploading ? "Yükleniyor..." : "Dosya veya görsel seç"}
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        disabled={disabled || uploading || attaching}
        onChange={handlePickAndUpload}
      />

      <div className="text-center text-[11px] text-zinc-500 dark:text-zinc-400">
        En fazla 5 dosya · Dosya başına 5 MB · Toplam 20 MB
      </div>

      {pending.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {pending.map((item, index) => (
            <div
              key={`${item.url}-${index}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/50"
            >
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                  {item.dosyaAdi}
                </div>
                <div className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                  {item.tur === TUR.FOTO ? "GÖRSEL" : "PDF"}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPending((previous) =>
                    previous.filter((_, currentIndex) => currentIndex !== index)
                  )
                }
                disabled={disabled || uploading || attaching}
                className="shrink-0 rounded-lg border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
              >
                Kaldır
              </button>
            </div>
          ))}
        </div>
      ) : !loadingFiles && files.length === 0 ? (
        <div className="text-center text-[11px] text-zinc-500 dark:text-zinc-400">
          Henüz dosya seçilmedi.
        </div>
      ) : null}
    </section>
  );
}