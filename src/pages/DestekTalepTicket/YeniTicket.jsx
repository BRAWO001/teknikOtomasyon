// pages/DestekTalepTicket/YeniTicket.jsx
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { postDataAsync } from "@/utils/apiService";
import TicketUploadPanel from "@/components/TicketUploadPanel";

/* ========================
   SABİTLER (ÇALIŞAN SİSTEMİ BOZMADAN)
======================== */
const SITE_OPTIONS = [{ id: 1, ad: "Yeni Tepe Etap 1" }];

const DEPARTMAN_OPTIONS = [
  "Ortak Alan - Tesis",
  "Arıza - Sorun Bildirimi",
  "Ortak Alan - Tesis Öneri",
  "Bireysel Ekstre - Bakiye Talebi",
  "Yönetimsel Konular Talep - İleti - Öneri",
  "Daire İçi Bireysel Teknik Destek Talebi",
  "Daire içi Temizlik Hizmeti Talebi",
];

const BLOK_OPTIONS = ["1C", "2B", "3D", "4A", "5E", "6J", "7F", "8I", "9G", "10H"];

const FIYAT_LISTESI_URL =
  "https://eosyonetim.com/uploads/tickets/file/Yeni%20Tepe%20Etap%201%20BI%CC%87REYSEL%20TALEPLERI%CC%87NI%CC%87Z%20I%CC%87C%CC%A7I%CC%87N%20EOS%20TEKNI%CC%87K%20FI%CC%87YAT%20LI%CC%87STESI%CC%87DI%CC%87R.pdf";

/* ========================
   Upload endpoints (Ticket için)
======================== */
const UPLOAD_URL = "HttpUpload/upload-ftp"; // FTP'ye yükle
const SAVE_URL_BASE = "DestekTalepDosyaEkle"; // Controllers/DestekTalepDosyaEkleController.cs

const TUR = { FOTO: 10, BELGE: 20 };

function safeTrim(v) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function extractBackendMsg(err) {
  const data = err?.response?.data;
  if (!data) return null;

  // aspnet validation
  if (data?.errors && typeof data.errors === "object") {
    const flat = Object.entries(data.errors)
      .flatMap(([k, arr]) => (Array.isArray(arr) ? arr.map((x) => `${k}: ${x}`) : []))
      .slice(0, 10);
    if (flat.length) return flat.join(" | ");
  }

  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.Message) return data.Message;
  if (data?.title) return data.title;

  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
}

export default function YeniTicketPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    siteId: "",
    departman: "",
    blok: "",
    daire: "",
    adSoyad: "",
    eposta: "",
    tel: "",
    konu: "",
    aciklama: "",
    not_1: "",
    not_2: "",
    not_3: "",
  });

  // ✅ TicketUploadPanel "hafızada" dosya tutar (upload yapmaz)
  // allFiles: [{ tur, dosyaAdi, file }]
  const [panelFiles, setPanelFiles] = useState({ photos: [], docs: [], allFiles: [] });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // upload progress
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [uploadingName, setUploadingName] = useState("");

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const selectedSite = useMemo(
    () => SITE_OPTIONS.find((s) => s.id === Number(form.siteId)) || null,
    [form.siteId]
  );

  const buildPayload = () => ({
    siteId: form.siteId ? Number(form.siteId) : null,
    departman: safeTrim(form.departman),
    blok: safeTrim(form.blok),
    daire: safeTrim(form.daire),
    adSoyad: safeTrim(form.adSoyad),
    eposta: safeTrim(form.eposta),
    tel: safeTrim(form.tel),
    konu: safeTrim(form.konu),
    aciklama: safeTrim(form.aciklama),
    tarihUtc: null,
    not_1: safeTrim(form.not_1),
    not_2: safeTrim(form.not_2),
    not_3: safeTrim(form.not_3),
  });

  const validate = () => {
    if (!form.siteId) return "Site seçmelisin.";
    if (!String(form.departman || "").trim()) return "Departman seçmelisin.";
    if (!String(form.adSoyad || "").trim()) return "Ad Soyad zorunlu.";
    if (!String(form.konu || "").trim()) return "Konu zorunlu.";
    if (!String(form.aciklama || "").trim()) return "Açıklama zorunlu.";
    return "";
  };

  // ✅ TEK DOSYA upload (FTP) — multipart
  // ⚠️ Content-Type'ı elle VERME! boundary bozuluyor.
  const uploadOnly = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await postDataAsync(UPLOAD_URL, formData);
    const url = uploadRes?.Url || uploadRes?.url;

    if (!url) {
      // bazen backend farklı döner
      throw new Error(`Upload cevabında Url alanı yok: ${file?.name || "-"}`);
    }
    return url;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const v = validate();
    if (v) return setError(v);

    const picked = panelFiles?.allFiles || [];

    try {
      setLoading(true);
      setUploadTotal(picked.length);
      setUploadingCount(0);
      setUploadingName("");

      // 1) Ticket oluştur
      const created = await postDataAsync("destek-talep-ticket", buildPayload());
      const ticketId = created?.id ?? created?.Id;
      if (!ticketId) throw new Error("Ticket oluşturuldu ama id dönmedi.");

      // 2) Seçilen dosyaları sırayla FTP’ye yükle
      const uploadedItems = [];

      for (let i = 0; i < picked.length; i++) {
        const p = picked[i];
        const file = p?.file;
        if (!file) continue;

        setUploadingName(p?.dosyaAdi || file.name || "");
        // progress: dosyaya başlamadan önce göstermek istersen:
        // setUploadingCount(i);

        const url = await uploadOnly(file);

        uploadedItems.push({
          url,
          dosyaAdi: p?.dosyaAdi || file.name,
          tur: p?.tur === TUR.BELGE ? TUR.BELGE : TUR.FOTO,
        });

        setUploadingCount(i + 1);
      }

      // 3) Upload bitince: DB’ye tek seferde yaz (array body)
      if (uploadedItems.length > 0) {
        await postDataAsync(`${SAVE_URL_BASE}/${ticketId}`, uploadedItems, {
          headers: { "Content-Type": "application/json" },
        });
      }

      setResult(created);
    } catch (err) {
      console.error("Ticket oluşturulurken hata:", err);

      const backendMsg = extractBackendMsg(err);
      const status = err?.response?.status;

      if (status === 401) {
        setError("Yetkisiz (401). Upload veya ticket endpoint token istiyor olabilir.");
      } else if (status === 403) {
        setError("Erişim reddedildi (403). Endpoint yetki istiyor olabilir.");
      } else {
        setError(backendMsg || err?.message || "Ticket oluşturulurken bir hata oluştu.");
      }
    } finally {
      setLoading(false);
      setUploadingName("");
    }
  };

  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => router.push("/teknikMudur"), 1500);
    return () => clearTimeout(t);
  }, [result, router]);

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-900 sm:px-6 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex flex-col items-center gap-3">
          <div className="relative h-14 w-48">
            <Image src="/eos_management_logo.png" alt="EOS Yönetim" fill className="object-contain" priority />
          </div>

          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Destek Talep Formu</h1>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
              Talebinizi iletin, ekibimiz en kısa sürede dönüş sağlayacaktır.
            </p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900"
        >
          {/* Site + Departman */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Site">
              <select
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.siteId}
                onChange={(e) => setField("siteId", e.target.value)}
                disabled={loading || !!result}
              >
                <option value="">Seçiniz</option>
                {SITE_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.ad}
                  </option>
                ))}
              </select>

              {selectedSite && (
                <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-200">
                  <div className="font-semibold">Bireysel Talepleriniz için EOS Teknik Fiyat Listesi</div>
                  <div className="mt-2">
                    <a
                      href={FIYAT_LISTESI_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-lg bg-zinc-100 px-3 py-2 text-[12px] font-semibold text-black transition hover:bg-zinc-200 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                    >
                      Fiyat Listesi
                    </a>
                  </div>
                </div>
              )}
            </Field>

            <Field label="Departman">
              <select
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.departman}
                onChange={(e) => setField("departman", e.target.value)}
                disabled={loading || !!result}
              >
                <option value="">Seçiniz</option>
                {DEPARTMAN_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Blok + Daire */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Blok">
              <select
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.blok}
                onChange={(e) => setField("blok", e.target.value)}
                disabled={loading || !!result}
              >
                <option value="">Seçiniz</option>
                {BLOK_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Daire">
              <input
                type="number"
                inputMode="numeric"
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.daire}
                onChange={(e) => setField("daire", e.target.value)}
                placeholder="Örn: 12"
                min="1"
                disabled={loading || !!result}
              />
            </Field>
          </div>

          {/* Ad Soyad + Tel + Eposta */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Ad Soyad">
              <input
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.adSoyad}
                onChange={(e) => setField("adSoyad", e.target.value)}
                placeholder="Örn: Ahmet Yılmaz"
                disabled={loading || !!result}
              />
            </Field>

            <Field label="Telefon">
              <input
                inputMode="tel"
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.tel}
                onChange={(e) => setField("tel", e.target.value)}
                placeholder="05xx..."
                disabled={loading || !!result}
              />
            </Field>

            <Field label="E-posta">
              <input
                inputMode="email"
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.eposta}
                onChange={(e) => setField("eposta", e.target.value)}
                placeholder="ornek@mail.com"
                disabled={loading || !!result}
              />
            </Field>
          </div>

          {/* Konu + Açıklama */}
          <div className="mt-4 grid grid-cols-1 gap-4">
            <Field label="Konu">
              <input
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.konu}
                onChange={(e) => setField("konu", e.target.value)}
                placeholder="Örn: Su kaçağı"
                disabled={loading || !!result}
              />
            </Field>

            <Field label="Açıklama">
              <textarea
                rows={6}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.aciklama}
                onChange={(e) => setField("aciklama", e.target.value)}
                placeholder="Detaylı açıklama..."
                disabled={loading || !!result}
              />
            </Field>
          </div>

          {/* ✅ Upload Panel: hafızada tutar, submitte upload */}
          <TicketUploadPanel
            disabled={loading || !!result}
            maxPhotos={20}
            maxDocs={20}
            onChange={setPanelFiles}
            showDebug
            compressPhotos
          />

          {/* ✅ Upload progress */}
          {loading && uploadTotal > 0 ? (
            <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              Dosyalar yükleniyor: <b>{uploadingCount}</b> / <b>{uploadTotal}</b>
              {uploadingName ? <div className="mt-1 text-[12px] opacity-80">Şu an: {uploadingName}</div> : null}
            </div>
          ) : null}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
              <div className="text-sm font-semibold">Ticket oluşturuldu ✅</div>
            </div>
          )}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            {!result && (
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60 sm:w-auto dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
              >
                {loading ? "Gönderiliyor..." : "Talep Oluştur"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">{label}</div>
      {children}
    </label>
  );
}