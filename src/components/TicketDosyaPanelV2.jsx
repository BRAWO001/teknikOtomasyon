// src/components/TicketDosyaPanelV2.jsx
import { useEffect, useMemo, useState } from "react";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

const UPLOAD_URL = "HttpUpload/upload-ftp";
const SAVE_URL_BASE = "DestekTalepDosyaEkle";

const TUR = { FOTO: 10, BELGE: 20 };

function fileExtFromName(name) {
  const s = String(name || "");
  const idx = s.lastIndexOf(".");
  return idx >= 0 ? s.slice(idx + 1).toLowerCase() : "";
}
function fileExtFromUrl(url) {
  const s = String(url || "").split("?")[0].split("#")[0];
  const idx = s.lastIndexOf(".");
  return idx >= 0 ? s.slice(idx + 1).toLowerCase() : "";
}
function isProbablyImage(file) {
  const t = String(file?.type || "").toLowerCase();
  if (t.startsWith("image/")) return true;
  const ext = fileExtFromName(file?.name);
  return ["jpg", "jpeg", "png", "webp", "heic"].includes(ext);
}
function isProbablyPdfOrDoc(file) {
  const t = String(file?.type || "").toLowerCase();
  if (t.includes("pdf")) return true;
  const ext = fileExtFromName(file?.name);
  return ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(ext);
}
function isImageUrl(url) {
  const ext = fileExtFromUrl(url);
  return ["jpg", "jpeg", "png", "webp", "heic", "gif"].includes(ext);
}
function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
}
function formatTR(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return safeText(iso);
  }
}

export default function TicketDosyaPanelV2({ ticketId, disabled, onChanged }) {
  const _ticketId = useMemo(() => {
    const n = Number(ticketId || 0);
    return n > 0 ? n : 0;
  }, [ticketId]);

  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filesError, setFilesError] = useState("");

  const [busy, setBusy] = useState(false);
  const [busyInfo, setBusyInfo] = useState("");
  const [error, setError] = useState("");

  const [previewUrl, setPreviewUrl] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  const loadFiles = async () => {
    if (!_ticketId) return;
    try {
      setLoadingFiles(true);
      setFilesError("");
      const data = await getDataAsync(`${SAVE_URL_BASE}/${_ticketId}`);
      const list = Array.isArray(data) ? data : [];
      setFiles(list);
      if (typeof onChanged === "function") onChanged(list);
    } catch (e) {
      console.error("DOSYA LIST ERROR:", e);
      setFilesError(e?.message || "Dosyalar alınamadı.");
      setFiles([]);
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

    // ✅ Content-Type header verme (axios boundary)
    const uploadRes = await postDataAsync(UPLOAD_URL, formData);

    const url = uploadRes?.Url || uploadRes?.url;
    if (!url) throw new Error("Upload cevabında Url alanı yok.");
    return url;
  };

  const attachBatch = async (items) => {
    if (!_ticketId) throw new Error("ticketId yok.");

    const body = (items || []).map((x) => ({
      url: x.url,
      dosyaAdi: null,
      tur: x.tur,
    }));

    if (!body.length) return;

    await postDataAsync(`${SAVE_URL_BASE}/${_ticketId}`, body, {
      headers: { "Content-Type": "application/json" },
    });
  };

  const validateFiles = (arr, tur) => {
    if (!arr.length) return;
    if (tur === TUR.FOTO) {
      const bad = arr.find((f) => !isProbablyImage(f));
      if (bad) throw new Error(`Sadece fotoğraf seç: ${bad?.name || "-"}`);
    }
    if (tur === TUR.BELGE) {
      const bad = arr.find((f) => !isProbablyPdfOrDoc(f));
      if (bad) throw new Error(`Sadece belge seç: ${bad?.name || "-"}`);
    }
  };

  const handlePickAndUpload = async (e, tur) => {
    const selectedFiles = Array.from(e?.target?.files || []);
    if (e?.target) e.target.value = "";
    if (!selectedFiles.length) return;

    if (!_ticketId) {
      setError("TicketId yok. Önce ticketId gelmeli.");
      return;
    }

    try {
      setError("");
      validateFiles(selectedFiles, tur);

      setBusy(true);
      setBusyInfo(`Yükleniyor: 0 / ${selectedFiles.length}`);

      const items = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const f = selectedFiles[i];
        setBusyInfo(`Yükleniyor: ${i + 1}/${selectedFiles.length} • ${f?.name || ""}`);
        const url = await uploadOnly(f);
        items.push({ url, tur });
      }

      setBusyInfo("Kaydediliyor...");
      await attachBatch(items);

      setBusyInfo("");
      await loadFiles();
    } catch (e2) {
      console.error("UPLOAD/ATTACH ERROR:", e2);
      setError(e2?.response?.data?.message || e2?.message || "Dosya eklenemedi.");
    } finally {
      setBusy(false);
      setBusyInfo("");
    }
  };

  const normalized = useMemo(() => {
    const list = Array.isArray(files) ? files : [];

    const mapped = list.map((d) => {
      const id =
        d?.id ??
        d?.Id ??
        d?.dosyaId ??
        d?.DosyaId ??
        `${d?.url}-${Math.random()}`;
      const url = d?.url ?? d?.Url ?? "";
      const ad = d?.dosyaAdi ?? d?.DosyaAdi ?? "Dosya";
      const tur = d?.tur ?? d?.Tur ?? null;
      const turAd = d?.turAd ?? d?.TurAd ?? "";
      const dt = formatTR(d?.yuklemeTarihiUtc ?? d?.YuklemeTarihiUtc);

      const img =
        Number(tur) === TUR.FOTO ||
        String(turAd || "").toLowerCase().includes("foto") ||
        isImageUrl(url);

      return { id: String(id), url: String(url), ad: String(ad), tur, turAd, dt, img };
    });

    return {
      photos: mapped.filter((x) => x.img),
      docs: mapped.filter((x) => !x.img),
    };
  }, [files]);

  const disabledActions = disabled || busy || loadingFiles || !_ticketId;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Preview modal */}
      {previewUrl ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-3"
          onClick={() => setPreviewUrl("")}
          role="button"
          tabIndex={0}
        >
          <div
            className="w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
            role="button"
            tabIndex={0}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[12px] font-extrabold text-zinc-900 dark:text-zinc-50">
                  {safeText(previewTitle)}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Fotoğraf önizleme
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-[12px] font-semibold shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800"
                >
                  Yeni Sekme
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewUrl("")}
                  className="h-9 rounded-xl bg-zinc-900 px-3 text-[12px] font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                >
                  Kapat
                </button>
              </div>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={previewTitle || "Foto"}
              className="max-h-[75vh] w-full rounded-xl object-contain"
            />
          </div>
        </div>
      ) : null}

      {/* header */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div>
          <div className="text-[13px] font-extrabold text-zinc-900 dark:text-zinc-100">
            Dosyalar
          </div>
          
        </div>

        <button
          type="button"
          onClick={loadFiles}
          disabled={disabledActions}
          className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-[12px] font-semibold shadow-sm hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800"
        >
          Yenile
        </button>
      </div>

      {/* status */}
      <div className="px-4 pt-3">
        {filesError ? (
          <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100">
            {filesError}
          </div>
        ) : null}

        {error ? (
          <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
            {error}
          </div>
        ) : null}

        {busy ? (
          <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            {busyInfo || "İşlem sürüyor..."}
          </div>
        ) : null}
      </div>

      {/* upload row compact */}
      <div className="px-4 pb-4 pt-3">
        <div className="grid gap-2 md:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12px] font-extrabold text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900">
            <span>Fotoğraf Yükle</span>
            <span className="rounded-lg bg-sky-600 px-2 py-1 text-[10px] font-extrabold text-white">
              Seç
            </span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              disabled={disabledActions}
              onChange={(e) => handlePickAndUpload(e, TUR.FOTO)}
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12px] font-extrabold text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900">
            <span>Belge Yükle</span>
            <span className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-extrabold text-white">
              Seç
            </span>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/pdf"
              className="hidden"
              disabled={disabledActions}
              onChange={(e) => handlePickAndUpload(e, TUR.BELGE)}
            />
          </label>
        </div>

        {/* lists */}
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {/* Photos smaller */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[12px] font-extrabold">Fotoğraflar</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {normalized.photos.length}
              </div>
            </div>

            {loadingFiles ? (
              <div className="text-[12px] text-zinc-500 dark:text-zinc-400">
                Yükleniyor...
              </div>
            ) : normalized.photos.length === 0 ? (
              <div className="text-[12px] text-zinc-500 dark:text-zinc-400">
                Fotoğraf yok.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-6">
                {normalized.photos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPreviewTitle(p.ad);
                      setPreviewUrl(p.url);
                    }}
                    className="group overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                    title={p.ad}
                  >
                    <div className="relative aspect-square w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt={p.ad}
                        className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Docs compact */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[12px] font-extrabold">Belgeler</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {normalized.docs.length}
              </div>
            </div>

            {loadingFiles ? (
              <div className="text-[12px] text-zinc-500 dark:text-zinc-400">
                Yükleniyor...
              </div>
            ) : normalized.docs.length === 0 ? (
              <div className="text-[12px] text-zinc-500 dark:text-zinc-400">
                Belge yok.
              </div>
            ) : (
              <div className="space-y-2">
                {normalized.docs.map((d) => (
                  <a
                    key={d.id}
                    href={d.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12px] hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                    title={d.ad}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-extrabold">{safeText(d.ad)}</div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {safeText(d.turAd)} • {d.dt}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-lg bg-zinc-900 px-2 py-1 text-[10px] font-extrabold text-white dark:bg-zinc-50 dark:text-black">
                      Aç
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}