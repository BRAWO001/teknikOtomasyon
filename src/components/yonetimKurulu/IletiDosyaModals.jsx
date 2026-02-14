// src/components/yonetimKurulu/IletiDosyaModals.jsx
import { useEffect, useMemo, useState } from "react";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

/* ========================
   Upload endpoints (AYAR)
======================== */
const UPLOAD_URL = "HttpUpload/upload-ftp";
const SAVE_URL_BASE = "ProjeYKIletiDosyaYukle"; // ✅ backend controller adı
const TUR = { FOTO: 10, BELGE: 20 };

/* =========================
   helpers
========================= */
function pickAny(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return null;
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
  return ["jpg", "jpeg", "png", "webp", "heic", "gif"].includes(ext);
}
function isProbablyPdfOrDoc(file) {
  const t = String(file?.type || "").toLowerCase();
  if (t.includes("pdf")) return true;
  const ext = fileExt(file?.name);
  return ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(ext);
}
function isValidHttpUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
function isImageUrl(url, dosyaAdi) {
  const u = String(url || "");
  const n = String(dosyaAdi || "");
  const ext = fileExt(n) || fileExt(u.split("?")[0]);
  return ["jpg", "jpeg", "png", "webp", "gif", "heic"].includes(ext);
}
function isPdf(url, dosyaAdi) {
  const u = String(url || "");
  const n = String(dosyaAdi || "");
  const ext = fileExt(n) || fileExt(u.split("?")[0]);
  return ext === "pdf";
}
/* ========================= */

function DosyaTile({ d, forceMode }) {
  const url = pickAny(d, "Url", "url");
  const dosyaAdi = pickAny(d, "DosyaAdi", "dosyaAdi") ?? "-";
  const canOpen = url && isValidHttpUrl(url);

  const isImg = forceMode === "foto" ? true : isImageUrl(url, dosyaAdi);
  const pdf = isPdf(url, dosyaAdi);

  const open = () => {
    if (!canOpen) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      role={canOpen ? "button" : undefined}
      tabIndex={canOpen ? 0 : -1}
      onClick={open}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && open()}
      className={[
        "overflow-hidden rounded-xl border bg-white p-2 shadow-sm dark:bg-zinc-900",
        "border-zinc-200 dark:border-zinc-800",
        canOpen
          ? "cursor-pointer transition hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700"
          : "opacity-70",
      ].join(" ")}
      title={canOpen ? "Aç / İndir" : "Link yok"}
    >
      {isImg && canOpen ? (
        <div className="h-[88px] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={dosyaAdi} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-[88px] w-full items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 px-2 text-center text-[11px] font-extrabold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          {pdf ? "PDF" : isImg ? "GÖRSEL" : "BELGE"}
        </div>
      )}

      <div className="mt-1">
        <div className="line-clamp-1 text-[10px] text-zinc-900 dark:text-zinc-100">
          {dosyaAdi}
        </div>
      </div>
    </div>
  );
}

export default function IletiDosyaModals({ isOpen, onClose, iletiId, iletiBaslik, onAfterSaved }) {
  const _iletiId = useMemo(() => {
    const n = Number(iletiId || 0);
    return n > 0 ? n : 0;
  }, [iletiId]);

  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filesError, setFilesError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [pending, setPending] = useState([]);
  const [attaching, setAttaching] = useState(false);
  const [attachError, setAttachError] = useState("");

  const loadFiles = async () => {
    if (!_iletiId) return;
    try {
      setLoadingFiles(true);
      setFilesError("");
      // ✅ DOĞRU: /api/ProjeYKIletiDosyaYukle/{iletiId}
      const data = await getDataAsync(`${SAVE_URL_BASE}/${_iletiId}`);
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("İleti dosyaları alınırken hata:", err);
      setFilesError(err?.message || "Dosyalar alınırken bir hata oluştu.");
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (isOpen && _iletiId) loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, _iletiId]);

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

  const attachToIleti = async (items) => {
    if (!_iletiId) return;
    const body = (items || []).map((x) => ({
      url: x.url,
      dosyaAdi: x.dosyaAdi,
      tur: x.tur,
    }));

    if (!body.length) return;

    // ✅ DOĞRU: /api/ProjeYKIletiDosyaYukle/{iletiId}
    await postDataAsync(`${SAVE_URL_BASE}/${_iletiId}`, body, {
      headers: { "Content-Type": "application/json" },
    });
  };

  useEffect(() => {
    const run = async () => {
      if (!_iletiId) return;
      if (!pending.length) return;
      if (attaching) return;

      try {
        setAttachError("");
        setAttaching(true);
        await attachToIleti(pending);
        setPending([]);
        await loadFiles();
        if (typeof onAfterSaved === "function") onAfterSaved();
      } catch (err) {
        console.error("PENDING ATTACH ERROR:", err);
        setAttachError(err?.message || "Bekleyen dosyalar bağlanırken hata oluştu.");
      } finally {
        setAttaching(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_iletiId, pending.length]);

  const handlePickAndUpload = async (e, tur) => {
    const file = e?.target?.files?.[0];
    if (e?.target) e.target.value = "";
    if (!file) return;

    setUploadError("");
    setAttachError("");
    setUploading(true);

    try {
      if (tur === TUR.FOTO && !isProbablyImage(file)) {
        throw new Error("Lütfen fotoğraf dosyası seçin (jpg/png/heic vb.).");
      }
      if (tur === TUR.BELGE && !isProbablyPdfOrDoc(file)) {
        throw new Error("Lütfen belge seçin (pdf/doc/xls vb.).");
      }

      const url = await uploadOnly(file);

      const item = {
        url,
        dosyaAdi: file.name,
        tur,
        createdAt: new Date().toISOString(),
      };

      setPending((prev) => [item, ...prev]);
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      setUploadError(err?.message || "Yükleme sırasında hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  const dosyaOzet = useMemo(() => {
    const foto = [];
    const belge = [];

    (files || []).forEach((d) => {
      const turKod = Number(pickAny(d, "TurKod", "turKod", "Tur", "tur")) || 0;
      const url = pickAny(d, "Url", "url");
      const dosyaAdi = pickAny(d, "DosyaAdi", "dosyaAdi");

      if (turKod === 10) foto.push(d);
      else if (turKod === 20) belge.push(d);
      else {
        if (isImageUrl(url, dosyaAdi)) foto.push(d);
        else belge.push(d);
      }
    });

    return { foto, belge, total: (files || []).length };
  }, [files]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-3">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">İleti Dosyaları</div>
            <div className="mt-1 line-clamp-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              {iletiBaslik ? iletiBaslik : `İleti #${_iletiId}`} • Toplam: {dosyaOzet.total}
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[12px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Kapat ✕
          </button>
        </div>

        <div className="space-y-3 p-5">
          {uploadError ? (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700">{uploadError}</div>
          ) : null}

          {attachError ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">{attachError}</div>
          ) : null}

          {(uploading || attaching) && (
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              {uploading ? "Yükleme yapılıyor..." : "Dosyalar iletiye bağlanıyor..."}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Fotoğraf Yükle</div>

              <label className="flex cursor-pointer items-center justify-center rounded-lg border border-sky-400 bg-white px-3 py-6 text-center text-[12px] font-semibold text-sky-700 hover:bg-sky-50 dark:bg-zinc-900">
                {uploading ? "Yükleniyor..." : "Fotoğraf Seç"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading || attaching}
                  onChange={(e) => handlePickAndUpload(e, TUR.FOTO)}
                />
              </label>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">PDF / Belge Yükle</div>

              <label className="flex cursor-pointer items-center justify-center rounded-lg border border-emerald-400 bg-white px-3 py-6 text-center text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50 dark:bg-zinc-900">
                {uploading ? "Yükleniyor..." : "Belge Seç"}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/pdf"
                  className="hidden"
                  disabled={uploading || attaching}
                  onChange={(e) => handlePickAndUpload(e, TUR.BELGE)}
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
            {filesError ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">{filesError}</div>
            ) : loadingFiles ? (
              <div className="text-[12px] text-zinc-600 dark:text-zinc-300">Liste yükleniyor...</div>
            ) : files.length === 0 ? (
              <div className="text-[12px] text-zinc-600 dark:text-zinc-300">Henüz dosya yok.</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100">Fotoğraflar</div>
                  {dosyaOzet.foto.length === 0 ? (
                    <div className="mt-1 text-[12px] text-zinc-600 dark:text-zinc-300">Fotoğraf yok.</div>
                  ) : (
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                      {dosyaOzet.foto.map((d) => (
                        <DosyaTile
                          key={`${pickAny(d, "Id", "id")}-${pickAny(d, "Url", "url")}-${pickAny(d, "Sira", "sira")}`}
                          d={d}
                          forceMode="foto"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100">Belgeler</div>
                  {dosyaOzet.belge.length === 0 ? (
                    <div className="mt-1 text-[12px] text-zinc-600 dark:text-zinc-300">Belge yok.</div>
                  ) : (
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                      {dosyaOzet.belge.map((d) => (
                        <DosyaTile
                          key={`${pickAny(d, "Id", "id")}-${pickAny(d, "Url", "url")}-${pickAny(d, "Sira", "sira")}`}
                          d={d}
                          forceMode="belge"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
            Route: <b>/api/{SAVE_URL_BASE}/{_iletiId}</b>
          </div>
        </div>
      </div>
    </div>
  );
}
