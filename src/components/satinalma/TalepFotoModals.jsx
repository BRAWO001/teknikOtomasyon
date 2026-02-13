// src/components/satinalma/TalepFotoModals.jsx
import { useEffect, useMemo, useState } from "react";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { useRouter } from "next/router";

// ✅ apiService base'i kullanacağı için relative endpoint
const UPLOAD_URL = "HttpUpload/upload-ftp";
const SAVE_URL_BASE = "SatinAlmaDosyaEkle";

const TUR = {
  FOTO: 10,
  BELGE: 20,
};

function pickAny(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return null;
}

function pickId(obj) {
  return pickAny(obj, "id", "Id", "talepId", "TalepId", "dosyaId", "DosyaId");
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

export default function TalepFotoModals({
  isOpen,
  onClose,

  // ✅ iki isim de kabul:
  talepId,
  seriNo,
  satinAlmaId,
  satinAlmaSeriNo,
}) {
  const router = useRouter();
  if (!isOpen) return null;

  const _talepId = useMemo(() => {
    const raw = talepId ?? satinAlmaId ?? 0;
    const n = Number(raw || 0);
    return n > 0 ? n : 0;
  }, [talepId, satinAlmaId]);

  const _seriNo = useMemo(() => {
    return seriNo ?? satinAlmaSeriNo ?? null;
  }, [seriNo, satinAlmaSeriNo]);

  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filesError, setFilesError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // ✅ Modal kapanınca sayfayı gerçekten yenile
  const closeAndReload = () => {
    onClose?.();
    // modal state güncellensin diye 0ms sonra reload
    setTimeout(() => {
      window.location.reload();
    }, 0);
  };

  // ESC ile kapat
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && closeAndReload();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  const loadFiles = async () => {
    if (!_talepId) return;
    try {
      setLoadingFiles(true);
      setFilesError("");
      const data = await getDataAsync(`${SAVE_URL_BASE}/${_talepId}`);
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Talep dosyaları alınırken hata:", err);
      setFilesError(err?.message || "Dosyalar alınırken bir hata oluştu.");
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (isOpen && _talepId) loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, _talepId]);

  const uploadAndAttach = async (file, tur) => {
    if (!file) return;

    // 1) Upload (multipart)
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await postDataAsync(UPLOAD_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const url = uploadRes?.Url || uploadRes?.url;
    if (!url) throw new Error("Upload cevabında Url alanı bulunamadı.");

    // 2) DB kaydet (json)
    const body = [
      {
        url,
        dosyaAdi: file.name,
        tur, // 10 Foto, 20 Belge
      },
    ];

    await postDataAsync(`${SAVE_URL_BASE}/${_talepId}`, body, {
      headers: { "Content-Type": "application/json" },
    });

    // 3) Listeyi yenile
    await loadFiles();
    return url;
  };

  const handlePickAndUpload = async (e, tur) => {
    const file = e?.target?.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadError("");
    setUploading(true);

    try {
      if (tur === TUR.FOTO && !isProbablyImage(file)) {
        throw new Error("Lütfen fotoğraf dosyası seçin (jpg/png/heic vb.).");
      }
      if (tur === TUR.BELGE && !isProbablyPdfOrDoc(file)) {
        throw new Error("Lütfen belge seçin (pdf/doc/xls vb.).");
      }

      await uploadAndAttach(file, tur);
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      setUploadError(err?.message || "Yükleme sırasında hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black/70 p-2"
      onClick={() => closeAndReload()}
    >
      <div
        className="relative flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Talep Dosya Yükleme
            </div>
            <div className="mt-0.5 flex flex-wrap gap-2 text-[11px] text-zinc-600 dark:text-zinc-300">
              <span className="rounded-full bg-zinc-100 px-2 py-[2px] dark:bg-zinc-800">
                TalepId: #{_talepId || "-"}
              </span>
              {_seriNo ? (
                <span className="rounded-full bg-zinc-100 px-2 py-[2px] dark:bg-zinc-800">
                  SeriNo: {_seriNo}
                </span>
              ) : null}
            </div>
          </div>

          <button
            onClick={() => {
              closeAndReload();
            }}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Kapat
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 text-xs">
          {!_talepId ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
              TalepId bulunamadı. (Backend create response içinde Id dönmeli.)
            </div>
          ) : null}

          {uploadError ? (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {uploadError}
            </div>
          ) : null}

          {/* Upload blocks */}
          <div className="grid gap-3 md:grid-cols-2">
            {/* FOTO */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Fotoğraf Yükle
              </div>

              <label className="flex cursor-pointer items-center justify-center rounded-lg border border-sky-400 bg-white px-3 py-6 text-center text-[12px] font-semibold text-sky-700 hover:bg-sky-50 dark:border-sky-500 dark:bg-zinc-900 dark:text-sky-300 dark:hover:bg-zinc-800">
                {uploading ? "Yükleniyor..." : "Fotoğraf Seç"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading || !_talepId}
                  onChange={(e) => handlePickAndUpload(e, TUR.FOTO)}
                />
              </label>

              <p className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                Desteklenen: jpg, png, heic vb.
              </p>
            </div>

            {/* BELGE */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                PDF / Belge Yükle
              </div>

              <label className="flex cursor-pointer items-center justify-center rounded-lg border border-emerald-400 bg-white px-3 py-6 text-center text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:bg-zinc-900 dark:text-emerald-300 dark:hover:bg-zinc-800">
                {uploading ? "Yükleniyor..." : "Belge Seç"}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/pdf"
                  className="hidden"
                  disabled={uploading || !_talepId}
                  onChange={(e) => handlePickAndUpload(e, TUR.BELGE)}
                />
              </label>

              <p className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                Desteklenen: pdf, doc/docx, xls/xlsx...
              </p>
            </div>
          </div>

          {/* Uploaded list */}
          <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Yüklenen Dosyalar
              </div>

              <button
                type="button"
                onClick={loadFiles}
                disabled={loadingFiles || uploading || !_talepId}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {loadingFiles ? "Yükleniyor..." : "Yenile"}
              </button>
            </div>

            {filesError ? (
              <div className="mb-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                {filesError}
              </div>
            ) : null}

            {loadingFiles ? (
              <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                Liste yükleniyor...
              </div>
            ) : files.length === 0 ? (
              <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                Henüz dosya yok.
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((f) => {
                  const id = pickId(f) ?? `${Math.random()}`;
                  const turAd = pickAny(f, "TurAd", "turAd") ?? "-";
                  const sira = pickAny(f, "Sira", "sira") ?? "-";
                  const dosyaAdi = pickAny(f, "DosyaAdi", "dosyaAdi") ?? "-";
                  const url = pickAny(f, "Url", "url");

                  return (
                    <div
                      key={`${id}-${url}-${sira}`}
                      className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-zinc-800 dark:text-zinc-100">
                          {dosyaAdi}
                        </div>
                        <div className="mt-0.5 text-[10px] text-zinc-600 dark:text-zinc-400">
                          Tür: {turAd} • Sıra: {sira} • #{id}
                        </div>
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block truncate text-[10px] text-sky-700 underline dark:text-sky-300"
                            title={url}
                          >
                            {url}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
            Not: Dosya seçince otomatik upload edilir ve talebe bağlanır.
          </div>
        </div>
      </div>
    </div>
  );
}
