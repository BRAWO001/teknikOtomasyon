// pages/DestekTalepTicket/YeniTicket.jsx

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { postDataAsync } from "@/utils/apiService"; // projene göre path

const SITE_OPTIONS = [{ id: 1, ad: "Yeni Tepe Etap 1" }];

const DEPARTMAN_OPTIONS = [
  "Ortak Alan - Tesis",
  "Arıza - Sorun Bildirimi",
  "Ortak Alan - Tesis Öneri",
  "Bireysel Ekstre - Bakiye Talebi",
  "Yönetimsel konular talep - ileti - Öneri",
  "Daire içi bireysel teknik destek talebi",
  "Daire içi temizlik hizmeti talebi",
];

const BLOK_OPTIONS = ["1C", "2B", "3D", "4A", "5E", "6J", "7F", "8I", "9G", "10H"];

const FIYAT_LISTESI_URL =
  "https://eosyonetim.com/uploads/tickets/file/Yeni%20Tepe%20Etap%201%20BI%CC%87REYSEL%20TALEPLERI%CC%87NI%CC%87Z%20I%CC%87C%CC%A7I%CC%87N%20EOS%20TEKNI%CC%87K%20FI%CC%87YAT%20LI%CC%87STESI%CC%87DI%CC%87R.pdf";

// ✅ Upload endpoints (BelgeFotoModals mantığı)
const UPLOAD_URL = "HttpUpload/upload-ftp";
const SAVE_URL_BASE = "TicketDestekTalepDosyaEkle"; // Backend: POST TicketDestekTalepDosyaEkle/{ticketId}

// ✅ Tur kodları (mevcut mantık)
const TUR = {
  FOTO: 10,
  BELGE: 20,
};

function safeTrim(v) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

export default function YeniTicketPage() {
  const router = useRouter();

  // Form state
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

  // ✅ Çoklu dosya state’leri
  // [{ url, dosyaAdi, tur, yuklemeTarihiUtc }]
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const selectedSite = useMemo(
    () => SITE_OPTIONS.find((s) => s.id === Number(form.siteId)) || null,
    [form.siteId]
  );

  // ============================
  // PAYLOAD (Ticket Create)
  // ============================
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

  // ============================
  // VALIDATION
  // ============================
  const validate = () => {
    if (!form.siteId) return "Site seçmelisin.";
    if (!String(form.departman || "").trim()) return "Departman seçmelisin.";
    if (!String(form.adSoyad || "").trim()) return "Ad Soyad zorunlu.";
    if (!String(form.konu || "").trim()) return "Konu zorunlu.";
    if (!String(form.aciklama || "").trim()) return "Açıklama zorunlu.";
    return "";
  };

  // ============================
  // ✅ UPLOAD HELPERS
  // ============================
  const uploadOne = async (file) => {
    const fd = new FormData();
    fd.append("file", file);

    const uploadRes = await postDataAsync(UPLOAD_URL, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const url = uploadRes?.Url || uploadRes?.url;
    if (!url) throw new Error("Upload cevabında Url alanı bulunamadı.");

    return url;
  };

  const pushUniqueByUrl = (arr, item) => {
    if (!item?.url) return arr;
    if (arr.some((x) => x.url === item.url)) return arr;
    return [...arr, item];
  };

  // ✅ Foto: çoklu
  const handlePickPhotos = async (e) => {
    const list = e?.target?.files;
    e.target.value = "";
    if (!list || list.length === 0) return;

    setUploadErr("");
    setUploadingPhoto(true);

    try {
      const files = Array.from(list).filter(Boolean);

      for (const f of files) {
        const url = await uploadOne(f);
        const item = {
          url,
          dosyaAdi: f?.name || "foto",
          tur: TUR.FOTO,
          yuklemeTarihiUtc: new Date().toISOString(),
        };
        setUploadedPhotos((prev) => pushUniqueByUrl(prev, item));
      }
    } catch (err) {
      console.error("PHOTO UPLOAD ERROR:", err);
      setUploadErr(err?.message || "Fotoğraf yüklenirken hata oluştu.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ✅ Belge: çoklu
  const handlePickDocs = async (e) => {
    const list = e?.target?.files;
    e.target.value = "";
    if (!list || list.length === 0) return;

    setUploadErr("");
    setUploadingDoc(true);

    try {
      const files = Array.from(list).filter(Boolean);

      for (const f of files) {
        const url = await uploadOne(f);
        const item = {
          url,
          dosyaAdi: f?.name || "belge",
          tur: TUR.BELGE,
          yuklemeTarihiUtc: new Date().toISOString(),
        };
        setUploadedDocs((prev) => pushUniqueByUrl(prev, item));
      }
    } catch (err) {
      console.error("DOC UPLOAD ERROR:", err);
      setUploadErr(err?.message || "Belge yüklenirken hata oluştu.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const removeUploadedPhoto = (idx) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== idx));
  };
  const removeUploadedDoc = (idx) => {
    setUploadedDocs((prev) => prev.filter((_, i) => i !== idx));
  };

  // ============================
  // SUBMIT (tek akış)
  // 1) Ticket create
  // 2) Foto+Belge URL’lerini tek POST’ta ticket’a kaydet
  // ============================
  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    try {
      setLoading(true);

      // 1) Ticket oluştur
      const created = await postDataAsync("destek-talep-ticket", buildPayload());

      const ticketId = created?.id ?? created?.Id;
      if (!ticketId) throw new Error("Ticket oluşturuldu ama id dönmedi.");

      // 2) Dosyaları tek seferde kaydet
      const allFiles = [...uploadedPhotos, ...uploadedDocs];

      if (allFiles.length > 0) {
        const body = allFiles.map((p) => ({
          url: p.url,
          dosyaAdi: p.dosyaAdi,
          tur: p.tur, // 10 foto, 20 belge
        }));

        try {
          await postDataAsync(`${SAVE_URL_BASE}/${ticketId}`, body, {
            headers: { "Content-Type": "application/json" },
          });
        } catch (attachErr) {
          console.error("DOSYA EKLEME HATASI:", attachErr);
          setError(
            attachErr?.message ||
              "Ticket oluşturuldu fakat dosyalar kaydedilirken hata oluştu."
          );
        }
      }

      setResult(created);
    } catch (err) {
      console.error("Ticket oluşturulurken hata:", err);
      setError(err?.message || "Ticket oluşturulurken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Ticket oluşunca 1.5sn sonra yönlendir (istersen kaldır)
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => {
      router.push("/teknikMudur");
    }, 1500);
    return () => clearTimeout(t);
  }, [result, router]);

  const isAnyUploading = uploadingPhoto || uploadingDoc;

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-900 sm:px-6 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto max-w-3xl">
        {/* Header / Logo */}
        <div className="mb-5 flex flex-col items-center gap-3">
          <div className="relative h-14 w-48">
            <Image
              src="/eos_management_logo.png"
              alt="EOS Yönetim"
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Destek Talep Formu
            </h1>
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
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
            <Field label="Site">
              <select
                className="w-full rounded-lg border border-zinc-200 bg-white px-1 py-1 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.siteId}
                onChange={(e) => setField("siteId", e.target.value)}
              >
                <option value="">Seçiniz</option>
                {SITE_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.ad}
                  </option>
                ))}
              </select>

              {selectedSite && (
                <div className="mt-1 flex flex-col items-center text-center rounded-xl border border-zinc-200 bg-zinc-50 p-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-200">
                  <div className="font-semibold">
                    Bireysel Talepleriniz için EOS Teknik Fiyat Listesi
                  </div>

                  <div className="mt-1">
                    <a
                      href={FIYAT_LISTESI_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-lg bg-zinc-100 px-1 py-1 text-[12px] font-semibold text-black transition hover:bg-zinc-200 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                    >
                      Fiyat Listesi
                    </a>
                  </div>
                </div>
              )}
            </Field>

            <Field label="Departman">
              <select
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.departman}
                onChange={(e) => setField("departman", e.target.value)}
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
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.blok}
                onChange={(e) => setField("blok", e.target.value)}
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
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.daire}
                onChange={(e) => setField("daire", e.target.value)}
                placeholder="Örn: 12"
                min="1"
              />
            </Field>
          </div>

          {/* Ad Soyad + Tel + Eposta */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Ad Soyad">
              <input
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.adSoyad}
                onChange={(e) => setField("adSoyad", e.target.value)}
                placeholder="Örn: Ahmet Yılmaz"
              />
            </Field>

            <Field label="Telefon">
              <input
                inputMode="tel"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.tel}
                onChange={(e) => setField("tel", e.target.value)}
                placeholder="05xx..."
              />
            </Field>

            <Field label="E-posta">
              <input
                inputMode="email"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.eposta}
                onChange={(e) => setField("eposta", e.target.value)}
                placeholder="ornek@mail.com"
              />
            </Field>
          </div>

          {/* Konu + Açıklama */}
          <div className="mt-4 grid grid-cols-1 gap-4">
            <Field label="Konu">
              <input
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.konu}
                onChange={(e) => setField("konu", e.target.value)}
                placeholder="Örn: Su kaçağı"
              />
            </Field>

            <Field label="Açıklama">
              <textarea
                rows={6}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.aciklama}
                onChange={(e) => setField("aciklama", e.target.value)}
                placeholder="Detaylı açıklama..."
              />
            </Field>
          </div>

          {/* ✅ Foto + Belge Upload */}
          <div className="mt-4 grid grid-rows-1 gap-3 md:grid-rows-2">
            {/* Foto */}
            <UploadCard
              title="Fotoğraf Ekle"
              buttonText={uploadingPhoto ? "Yükleniyor..." : "Fotoğraf Seç"}
              disabled={uploadingPhoto || loading || !!result}
              accept="image/*"
              multiple
              onPick={handlePickPhotos}
              items={uploadedPhotos}
              onRemove={removeUploadedPhoto}
              badgeText={`${uploadedPhotos.length} adet`}
            />

            {/* Belge */}
            <UploadCard
              title="Belge Ekle"
              desc="PDF / Word / Excel vb."
              buttonText={uploadingDoc ? "Yükleniyor..." : "Belge Seç"}
              disabled={uploadingDoc || loading || !!result}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*"
              multiple
              onPick={handlePickDocs}
              items={uploadedDocs}
              onRemove={removeUploadedDoc}
              badgeText={`${uploadedDocs.length} adet`}
            />
          </div>

          {/* Upload error */}
          {uploadErr && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {uploadErr}
            </div>
          )}

          {/* Hata / Sonuç */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
              <div className="text-sm font-semibold">Ticket oluşturuldu ✅</div>

              <div className="mt-2 space-y-1 text-xs">
                {result?.ticketNo != null && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-emerald-800/80 dark:text-emerald-100/80">
                      Ticket No:
                    </span>
                    <span className="rounded-lg bg-emerald-600 px-2 py-1 text-sm font-extrabold text-white">
                      {String(result.ticketNo)}
                    </span>
                  </div>
                )}

                {result?.id != null && (
                  <div>
                    Ticket ID:{" "}
                    <span className="font-semibold">{String(result.id)}</span>
                  </div>
                )}

                <div className="pt-1 text-[11px] text-emerald-800/90 dark:text-emerald-100/90">
                  Lütfen{" "}
                  <span className="font-semibold">Ticket Numaranızı</span>{" "}
                  kaydedin.
                </div>

                <div className="text-[11px] text-emerald-800/80 dark:text-emerald-100/80">
                  1.5 saniye içinde yönlendirileceksiniz...
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            {!result && (
              <button
                type="submit"
                disabled={loading || isAnyUploading}
                className="w-full rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60 sm:w-auto dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
              >
                {loading
                  ? "Gönderiliyor..."
                  : isAnyUploading
                    ? "Dosyalar yükleniyor..."
                    : "Ticket Oluştur"}
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
      <div className="mb-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        {label}
      </div>
      {children}
    </label>
  );
}

function UploadCard({
  title,
  desc,
  buttonText,
  disabled,
  accept,
  multiple,
  onPick,
  items,
  onRemove,
  badgeText,
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950/40">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold">{title}</div>
            <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              {badgeText}
            </span>
          </div>
          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
            {desc}
          </div>
        </div>

        <label
          className={[
            "group inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-2 py-1 text-xs font-semibold",
            "border shadow-sm transition-all duration-200",
            "focus-within:ring-2 focus-within:ring-zinc-900 focus-within:ring-offset-2 focus-within:ring-offset-white",
            "dark:focus-within:ring-zinc-100 dark:focus-within:ring-offset-zinc-900",
            disabled
              ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400 shadow-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
              : [
                  "border-zinc-200/70 bg-gradient-to-b from-white to-zinc-50 text-zinc-900",
                  "hover:from-zinc-50 hover:to-zinc-100 hover:shadow-md",
                  "active:scale-[0.99]",
                  "dark:border-zinc-700/70 dark:from-zinc-900 dark:to-zinc-950 dark:text-zinc-50",
                  "dark:hover:from-zinc-900 dark:hover:to-zinc-900/60",
                ].join(" "),
          ].join(" ")}
        >
          <span
            className={[
              "inline-flex h-4 w-4 items-center justify-center rounded-lg border",
              disabled
                ? "border-zinc-200 bg-white text-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-600"
                : "border-zinc-200 bg-white text-zinc-800 group-hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100",
            ].join(" ")}
            aria-hidden="true"
          >
            ⬆️
          </span>

          <span className="whitespace-nowrap">{buttonText}</span>

          <input
            type="file"
            className="hidden"
            accept={accept}
            multiple={multiple}
            onChange={onPick}
            disabled={disabled}
          />
        </label>
      </div>

      {items?.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-2">
          {items.map((p, idx) => (
            <div
              key={`${p.url}-${idx}`}
              className="flex items-start justify-between gap-2 rounded-xl border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="min-w-0">
                <div className="truncate font-semibold">{p.dosyaAdi}</div>
                <div className="mt-1 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                  {p.url}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRemove?.(idx)}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Sil
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}