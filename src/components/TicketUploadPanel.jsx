import { useEffect, useMemo, useState } from "react";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

/* ========================
   Upload endpoints
======================== */
const UPLOAD_URL = "HttpUpload/upload-ftp";
const SAVE_URL_BASE = "DestekTalepDosyaEkle"; // ✅ CONTROLLER ADI

const TUR = { FOTO: 10, BELGE: 20 };

/* ---------- helpers ---------- */
function pickAny(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return null;
}
function pickId(obj) {
  return pickAny(obj, "id", "Id", "dosyaId", "DosyaId");
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
  return ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(
    ext,
  );
}
function uniqKey() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function pushUniqueByUrl(arr, item) {
  if (!item?.url) return arr;
  if (arr.some((x) => x.url === item.url)) return arr;
  return [item, ...arr];
}
function extractBackendMsg(err) {
  const data = err?.response?.data;
  if (!data) return null;

  if (typeof data === "string") return data;
  if (data?.Message) return data.Message;
  if (data?.message) return data.message;
  if (data?.title) return data.title;

  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
}

/**
 * TicketDosyaPanel
 * - ticketId yokken: upload => pending (url hafızada)
 * - ticketId varken: upload => TEK POST ile DB (başarırsa pending'e girmez)
 * - attach fail olursa: batch pending'e atılır (kaybolmaz)
 */
export default function TicketDosyaPanel({
  ticketId,
  onStatusChange,
  disabled,
}) {
  const _ticketId = useMemo(() => {
    const n = Number(ticketId || 0);
    return n > 0 ? n : 0;
  }, [ticketId]);

  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filesError, setFilesError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [pending, setPending] = useState([]); // [{key,url,dosyaAdi,tur,createdAt}]
  const [attaching, setAttaching] = useState(false);
  const [attachError, setAttachError] = useState("");

  const busy = uploading || attaching;

  useEffect(() => {
    onStatusChange?.({
      uploading,
      attaching,
      pendingCount: pending.length,
      hasTicketId: !!_ticketId,
    });
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
      console.error("TICKET FILES GET ERROR:", err);
      setFilesError(
        extractBackendMsg(err) || err?.message || "Dosyalar alınamadı.",
      );
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (_ticketId) loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_ticketId]);

  // ✅ BURASI EN KRİTİK DÜZELTME:
  // Content-Type'ı ELLE VERME! (boundary bozulur, foto "gitmiyor" olur)
  const uploadOnly = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    // ❌ headers: { "Content-Type": "multipart/form-data" } YOK!
    const uploadRes = await postDataAsync(UPLOAD_URL, formData);

    const url = uploadRes?.Url || uploadRes?.url;
    if (!url)
      throw new Error(`Upload cevabında Url alanı yok: ${file?.name || "-"}`);
    return url;
  };

  const attachToTicket = async (items) => {
    if (!_ticketId) return;

    const body = (items || []).map((x) => ({
      url: x.url,
      dosyaAdi: x.dosyaAdi,
      tur: x.tur, // 10/20 -> enum bind olur
    }));

    if (!body.length) return;

    await postDataAsync(`${SAVE_URL_BASE}/${_ticketId}`, body, {
      headers: { "Content-Type": "application/json" },
    });
  };

  // ✅ ticketId sonradan geldiyse pending’i otomatik DB’ye yaz (TEK POST)
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
        setAttachError(
          extractBackendMsg(err) ||
            err?.message ||
            "Bekleyen dosyalar kaydedilemedi.",
        );
      } finally {
        setAttaching(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_ticketId, pending]); // ✅ sadece length değil, pending’in kendisi

  // ✅ çoklu seç -> upload (sırayla) -> ticket varsa tek attach
  const handlePickAndUpload = async (e, tur) => {
    const list = e?.target?.files;
    if (e?.target) e.target.value = "";
    if (!list || list.length === 0) return;

    setUploadError("");
    setAttachError("");

    const filesArr = Array.from(list).filter(Boolean);

    // validasyon
    if (tur === TUR.FOTO) {
      const bad = filesArr.find((f) => !isProbablyImage(f));
      if (bad)
        return setUploadError(`Fotoğraf dışında dosya seçilmiş: ${bad.name}`);
    }
    if (tur === TUR.BELGE) {
      const bad = filesArr.find((f) => !isProbablyPdfOrDoc(f));
      if (bad)
        return setUploadError(`Belge dışında dosya seçilmiş: ${bad.name}`);
    }

    setUploading(true);

    try {
      // 1) FTP upload (sırayla)
      const uploadedItems = [];
      for (const f of filesArr) {
        const url = await uploadOnly(f);
        uploadedItems.push({
          key: uniqKey(),
          url,
          dosyaAdi: f.name,
          tur,
          createdAt: new Date().toISOString(),
        });
      }

      // 2) ticketId varsa: TEK POST DB’ye yaz
      if (_ticketId) {
        setAttaching(true);
        try {
          await attachToTicket(uploadedItems);
          await loadFiles();
        } catch (err) {
          // attach patlarsa kaybolmasın: pending’e at
          console.error("ATTACH ERROR:", err);
          setAttachError(
            extractBackendMsg(err) ||
              err?.message ||
              "DB kaydı sırasında hata oluştu.",
          );
          setPending((prev) => {
            let next = prev;
            for (const it of uploadedItems) next = pushUniqueByUrl(next, it);
            return next;
          });
        } finally {
          setAttaching(false);
        }
      } else {
        // 3) ticketId yoksa: pending’e yaz
        setPending((prev) => {
          let next = prev;
          for (const it of uploadedItems) next = pushUniqueByUrl(next, it);
          return next;
        });
      }
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      setUploadError(
        extractBackendMsg(err) ||
          err?.message ||
          "Yükleme sırasında hata oluştu.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Ticket Dosyaları
          </div>
          <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            Dosya seçince FTP’ye yükler. TicketId varsa DB’ye kaydeder.
          </div>
        </div>

        {_ticketId ? (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-[2px] text-[11px] font-semibold text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-100">
            TicketId: {_ticketId}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-amber-50 px-2 py-[2px] text-[11px] font-semibold text-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
            TicketId bekleniyor…
          </span>
        )}
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

      {busy ? (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          {uploading ? "Yükleme yapılıyor (FTP)..." : "Kaydediliyor (DB)..."}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Fotoğraf (çoklu)
          </div>

          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-sky-400 bg-white px-3 py-6 text-center text-[12px] font-semibold text-sky-700 hover:bg-sky-50 dark:bg-zinc-950 dark:hover:bg-zinc-900">
            {busy ? "İşlem sürüyor..." : "Fotoğraf Seç & Yükle"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={disabled || busy}
              onChange={(e) => handlePickAndUpload(e, TUR.FOTO)}
            />
          </label>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Belge (çoklu)
          </div>

          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-emerald-400 bg-white px-3 py-6 text-center text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50 dark:bg-zinc-950 dark:hover:bg-zinc-900">
            {busy ? "İşlem sürüyor..." : "Belge Seç & Yükle"}
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/pdf"
              multiple
              className="hidden"
              disabled={disabled || busy}
              onChange={(e) => handlePickAndUpload(e, TUR.BELGE)}
            />
          </label>
        </div>
      </div>

      {/* Pending */}
      <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-2 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
          Bekleyen URL’ler: {pending.length}
        </div>

        {pending.length === 0 ? (
          <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
            Dosya yok.
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((p, idx) => {
              const turAd = p.tur === TUR.FOTO ? "Foto" : "Belge";
              return (
                <div
                  key={`${p.url}-${p.key || idx}`}
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
                    onClick={() =>
                      setPending((prev) => prev.filter((_, i) => i !== idx))
                    }
                    disabled={disabled || busy}
                    className="shrink-0 rounded-md border border-red-300 bg-white px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:bg-zinc-950 dark:text-red-300 dark:hover:bg-red-900/20"
                    title="Pending’den kaldırır (FTP’den silmez)"
                  >
                    Kaldır
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DB files */}
      <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-2 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
          Ticket’a kayıtlı dosyalar
        </div>

        {!_ticketId ? (
          <div className="text-[11px] text-zinc-600 dark:text-zinc-400">--</div>
        ) : filesError ? (
          <div className="mb-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
            {filesError}
          </div>
        ) : loadingFiles ? (
          <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
            Liste yükleniyor...
          </div>
        ) : files.length === 0 ? (
          <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
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
                  className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] dark:border-zinc-800 dark:bg-zinc-900"
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
    </section>
  );
}
