// src/components/TicketDosyaPanel.jsx
import { useEffect, useMemo, useState } from "react";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

const UPLOAD_URL = "HttpUpload/upload-ftp";
const SAVE_URL_BASE = "DestekTalepDosyaEkle";

const TUR = { FOTO: 10, BELGE: 20 };

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

  const normalizeSelectedFiles = (fileList, tur) => {
    const arr = Array.from(fileList || []);
    if (!arr.length) return [];

    if (tur === TUR.FOTO) {
      const bad = arr.find((f) => !isProbablyImage(f));
      if (bad) throw new Error(`Sadece fotoğraf seç: ${bad?.name || "-"}`);
    }
    if (tur === TUR.BELGE) {
      const bad = arr.find((f) => !isProbablyPdfOrDoc(f));
      if (bad) throw new Error(`Sadece belge seç: ${bad?.name || "-"}`);
    }
    return arr;
  };

  const handlePickAndUpload = async (e, tur) => {
    const selectedFiles = Array.from(e?.target?.files || []);
    if (e?.target) e.target.value = "";

    if (selectedFiles.length === 0) return;

    setUploadError("");
    setAttachError("");

    try {
      if (tur === TUR.FOTO) {
        const bad = selectedFiles.find((f) => !isProbablyImage(f));
        if (bad) throw new Error(`Sadece fotoğraf seç: ${bad.name}`);
      }
      if (tur === TUR.BELGE) {
        const bad = selectedFiles.find((f) => !isProbablyPdfOrDoc(f));
        if (bad) throw new Error(`Sadece belge seç: ${bad.name}`);
      }
    } catch (err) {
      setUploadError(err?.message || "Dosya tipi hatalı.");
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
        setUploadingName(originalFile?.name || "");

        let fileToUpload = originalFile;
        let finalDosyaAdi = originalFile?.name || "dosya";

        // Sadece fotoğraflarda kalite düşürme + resize uygula
        if (tur === TUR.FOTO) {
          fileToUpload = await compressImageFile(originalFile, 0.75, 1920, 1920);
          finalDosyaAdi = fileToUpload?.name || originalFile?.name || "foto.jpg";
        }

        const url = await uploadOnly(fileToUpload);

        uploadedItems.push({
          url,
          dosyaAdi: finalDosyaAdi,
          tur,
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

  return (
    <section className="mt-5 space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Ticket Dosyaları
          </div>
        </div>
      </div>

      {uploadError ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100">
          {uploadError}
        </div>
      ) : null}

      {attachError ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
          {attachError}
        </div>
      ) : null}

      {(uploading || attaching) && (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
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
            "Dosyalar ticket’a bağlanıyor..."
          )}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Fotoğraf
          </div>

          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-sky-400 bg-white px-3 py-6 text-center text-[12px] font-semibold text-sky-700 hover:bg-sky-50 dark:bg-zinc-950 dark:hover:bg-zinc-900">
            {uploading ? "Yükleniyor..." : "Fotoğraf Seç"}
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              disabled={disabled || uploading || attaching}
              onChange={(e) => handlePickAndUpload(e, TUR.FOTO)}
            />
          </label>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Belge
          </div>

          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-emerald-400 bg-white px-3 py-6 text-center text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50 dark:bg-zinc-950 dark:hover:bg-zinc-900">
            {uploading ? "Yükleniyor..." : "Belge Seç"}
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/pdf"
              className="hidden"
              disabled={disabled || uploading || attaching}
              onChange={(e) => handlePickAndUpload(e, TUR.BELGE)}
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-2 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
          Eklenen Görsel Ve Ya Belgeler
        </div>

        {pending.length === 0 ? (
          <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
            Dosya yüklenmedi.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {pending.map((p, idx) => {
              const turAd = p.tur === TUR.FOTO ? "Foto" : "Belge";

              return (
                <div
                  key={`${p.url}-${idx}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-zinc-800 dark:text-zinc-100">
                      {p.dosyaAdi}
                    </div>
                    <div className="text-[9px] text-zinc-500 dark:text-zinc-400">
                      {turAd}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPending((prev) => prev.filter((_, i) => i !== idx))
                    }
                    disabled={disabled || uploading || attaching}
                    className="rounded border cursor-pointer border-red-300 px-1.5 py-0.5 text-[9px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}