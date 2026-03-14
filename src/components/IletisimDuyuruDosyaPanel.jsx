import { useEffect, useMemo, useState } from "react";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

const UPLOAD_URL = "HttpUpload/upload-ftp";
const SAVE_URL_BASE = "IletisimDuyuruDosyaYukle";

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
  return pickAny(obj, "id", "Id", "duyuruId", "DuyuruId", "dosyaId", "DosyaId");
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

export default function IletisimDuyuruDosyaPanel({
  duyuruId,
  onStatusChange,
  disabled,
}) {
  const _duyuruId = useMemo(() => {
    const n = Number(duyuruId || 0);
    return n > 0 ? n : 0;
  }, [duyuruId]);

  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filesError, setFilesError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [pending, setPending] = useState([]);
  const [attaching, setAttaching] = useState(false);
  const [attachError, setAttachError] = useState("");

  useEffect(() => {
    if (typeof onStatusChange === "function") {
      onStatusChange({
        uploading,
        attaching,
        pendingCount: pending.length,
        hasDuyuruId: !!_duyuruId,
      });
    }
  }, [uploading, attaching, pending.length, _duyuruId, onStatusChange]);

  const loadFiles = async () => {
    if (!_duyuruId) return;
    try {
      setLoadingFiles(true);
      setFilesError("");
      const data = await getDataAsync(`${SAVE_URL_BASE}/${_duyuruId}`);
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Duyuru dosyaları alınırken hata:", err);
      setFilesError(err?.message || "Dosyalar alınırken bir hata oluştu.");
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (_duyuruId) loadFiles();
  }, [_duyuruId]);

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

  const attachToDuyuru = async (items) => {
    if (!_duyuruId) return;

    const body = (items || []).map((x) => ({
      url: x.url,
      dosyaAdi: x.dosyaAdi,
      tur: x.tur,
    }));

    if (!body.length) return;

    await postDataAsync(`${SAVE_URL_BASE}/${_duyuruId}`, body, {
      headers: { "Content-Type": "application/json" },
    });
  };

  useEffect(() => {
    const run = async () => {
      if (!_duyuruId || !pending.length || attaching) return;

      try {
        setAttachError("");
        setAttaching(true);
        await attachToDuyuru(pending);
        setPending([]);
        await loadFiles();
      } catch (err) {
        console.error("PENDING ATTACH ERROR:", err);
        setAttachError(
          err?.message || "Bekleyen dosyalar duyuruya bağlanırken hata oluştu."
        );
      } finally {
        setAttaching(false);
      }
    };

    run();
  }, [_duyuruId, pending.length]);

  const handlePickAndUpload = async (e, tur) => {
    const file = e?.target?.files?.[0];
    if (e?.target) e.target.value = "";
    if (!file) return;

    setUploadError("");
    setAttachError("");
    setUploading(true);

    try {
      if (tur === TUR.FOTO && !isProbablyImage(file)) {
        throw new Error("Lütfen fotoğraf dosyası seçin.");
      }
      if (tur === TUR.BELGE && !isProbablyPdfOrDoc(file)) {
        throw new Error("Lütfen belge seçin.");
      }

      const url = await uploadOnly(file);

      const item = {
        url,
        dosyaAdi: file.name,
        tur,
        createdAt: new Date().toISOString(),
      };

      if (_duyuruId) {
        setAttaching(true);
        try {
          await attachToDuyuru([item]);
          await loadFiles();
        } finally {
          setAttaching(false);
        }
      } else {
        setPending((prev) => [item, ...prev]);
      }
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      setUploadError(err?.message || "Yükleme sırasında hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Duyuru Dosyaları
          </div>
          <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            Fotoğraf / Belge yükleyebilirsiniz.
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
        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          {uploading ? "Yükleme yapılıyor..." : "Dosyalar duyuruya bağlanıyor..."}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Fotoğraf Yükle
          </div>

          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-sky-400 bg-white px-3 py-6 text-center text-[12px] font-semibold text-sky-700 hover:bg-sky-50 dark:bg-zinc-950 dark:hover:bg-zinc-900">
            {uploading ? "Yükleniyor..." : "Fotoğraf Seç"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={disabled || uploading || attaching}
              onChange={(e) => handlePickAndUpload(e, TUR.FOTO)}
            />
          </label>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            PDF / Belge Yükle
          </div>

          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-emerald-400 bg-white px-3 py-6 text-center text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50 dark:bg-zinc-950 dark:hover:bg-zinc-900">
            {uploading ? "Yükleniyor..." : "Belge Seç"}
            <input
              type="file"
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
          Bekleyen Yüklemeler
        </div>

        {pending.length === 0 ? (
          <div className="text-[11px] text-zinc-600 dark:text-zinc-400">Dosya yok.</div>
        ) : (
          <div className="space-y-2">
            {pending.map((p, idx) => {
              const turAd = p.tur === TUR.FOTO ? "Foto" : "Belge";
              return (
                <div
                  key={`${p.url}-${idx}`}
                  className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-100">
                      {p.dosyaAdi}
                    </div>
                    <div className="mt-0.5 text-[10px] text-zinc-600 dark:text-zinc-400">
                      Tür: {turAd}
                    </div>

                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block truncate text-[10px] text-sky-700 underline dark:text-sky-300"
                      title={p.url}
                    >
                      {p.url}
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPending((prev) => prev.filter((_, i) => i !== idx))}
                    disabled={disabled || uploading || attaching}
                    className="shrink-0 rounded-md border border-red-300 bg-white px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:bg-zinc-950 dark:text-red-300"
                  >
                    Kaldır
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-2 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
          Duyuruya Bağlı Dosyalar
        </div>

        {!_duyuruId ? (
          <div className="text-[11px] text-zinc-600 dark:text-zinc-400">--</div>
        ) : filesError ? (
          <div className="mb-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
            {filesError}
          </div>
        ) : loadingFiles ? (
          <div className="text-[11px] text-zinc-600 dark:text-zinc-400">Liste yükleniyor...</div>
        ) : files.length === 0 ? (
          <div className="text-[11px] text-zinc-600 dark:text-zinc-400">Henüz dosya yok.</div>
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
                  className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-100">{dosyaAdi}</div>
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
    </section>
  );
}