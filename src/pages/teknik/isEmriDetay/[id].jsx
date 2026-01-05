// src/pages/teknik/isEmriDetay/[id].jsx

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getDataAsync } from "../../../utils/apiService";

import BelgeFotoModals from "../../../components/BelgeFotoModals";
import PersonelDuzenleModals from "../../../components/PersonelDuzenleModals";
import NotEkleModals from "../../../components/NotEkleModals";
import MalzemeEkleModals from "../../../components/MalzemeEkleModals";

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
    return "-";
  }
}

function initials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

function isImageFile(urlOrName = "") {
  const lower = urlOrName.toLowerCase();
  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".webp")
  );
}

// ⭐ Malzeme kaynağı (enum) metne çevir
function formatKaynak(kaynakKod, kaynakAd) {
  // Öncelik: kaynakAd (string)
  if (kaynakAd) {
    const lower = kaynakAd.toLowerCase();

    if (lower.includes("depo")) return "Depo";
    if (lower.includes("yenialim") || lower.includes("yeni")) return "Yeni Alım";
    if (lower.includes("isverentemini") || lower.includes("işveren"))
      return "İşveren Temini";

    // Tanıyamazsa olduğu gibi göster
    return kaynakAd;
  }

  // Sonra: kaynakKod (sayı)
  if (kaynakKod !== null && kaynakKod !== undefined) {
    const num = Number(kaynakKod);
    if (num === 10) return "Depo";
    if (num === 20) return "Yeni Alım";
    if (num === 30) return "İşveren Temini";
    return String(kaynakKod);
  }

  return "-";
}


export default function IsEmriDetayPage() {
  const router = useRouter();
  const { id } = router.query;

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // KDV toggle
  const [kdvIncluded, setKdvIncluded] = useState(true);

  // Modals
  const [isBelgeModalOpen, setIsBelgeModalOpen] = useState(false);
  const [isPersonelModalOpen, setIsPersonelModalOpen] = useState(false);
  const [isNotModalOpen, setIsNotModalOpen] = useState(false);
  const [isMalzemeModalOpen, setIsMalzemeModalOpen] = useState(false);

  // Veri çekme
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        // API: GET api/is-emirleri/{id}
        const data = await getDataAsync(`is-emirleri/${id}`);
        setRecord(data || null);
      } catch (err) {
        console.error("İş emri detay yüklenirken hata:", err);
        setError(err?.message || "İş emri detayları alınırken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-200">
        İş emri detayları yükleniyor...
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <div className="font-semibold mb-1">Hata</div>
          <div>{error || "İş emri bulunamadı."}</div>
        </div>
      </div>
    );
  }

  // ===========================
  //  RECORD DESTRUCTURE
  // ===========================
  const {
    id: isEmriId,
    kod,
    kod_2,
    kod_3,
    kisaBaslik,
    aciklama,
    aciklama_2,
    durumKod,
    durumAd,
    olusturmaTarihiUtc,
    onayTarihiUtc,
    baslamaTarihiUtc,
    bitisTarihiUtc,
    konum,
    site,
    apt,
    ev,
    evSahibi,
    kiraci,
    dosyalar = [],
    personeller = [],
    malzemeler = [],
    notlar = [],
  } = record;

  const isAcil = kod_3 === "ACIL";

  // Dosya grupları
  const photoFiles = dosyalar.filter(
    (f) =>
      f.turAd === "Foto" ||
      isImageFile(f.url || "") ||
      isImageFile(f.dosyaAdi || "")
  );
  const belgeFiles = dosyalar.filter((f) => !photoFiles.includes(f));

  // Malzeme toplamlar
  const toplamNetTutar = malzemeler.reduce((acc, m) => {
    const birim = Number(m.birimFiyat ?? 0);
    const adet = Number(m.adet ?? 0);
    return acc + birim * adet;
  }, 0);
  const toplamTutarGosterilen = kdvIncluded
    ? toplamNetTutar * 1.2
    : toplamNetTutar;

  // Kod_3 label
  let kod3Label = null;
  let kod3Class = "";
  if (kod_3) {
    if (kod_3 === "ACIL") {
      kod3Label = "ACİL";
      kod3Class =
        "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900";
    } else {
      kod3Label = "DIŞ İŞ";
      kod3Class =
        "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900";
    }
  }

  const toplamMalzemeAdet = malzemeler.length;

  return (
    <div className="min-h-screen bg-zinc-50 p-3 text-xs text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 print:bg-white print:p-0">
      {/* ÜST BAR (ekranda görünsün, yazdırmada gizlenebilir) */}
      <div className="mb-3 flex items-center justify-between gap-2 print:hidden">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Teknik İş Emri Detayı
          </div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {kod} — {kisaBaslik}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
          >
            Yazdır (A4)
          </button>
        </div>
      </div>

      {/* ANA KART */}
      <div className="mx-auto max-w-6xl rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 print:shadow-none print:border-0 print:rounded-none print:p-0">
        {/* HEADER BLOK */}
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-[0.08em] text-zinc-900 dark:text-zinc-50">
                {kod}
              </span>
              {kod_2 && (
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900">
                  {kod_2}
                </span>
              )}
              {kod3Label && (
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ${kod3Class}`}
                >
                  {kod3Label}
                </span>
              )}
            </div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {kisaBaslik}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Durum:{" "}
              <span className="font-semibold">
                {durumAd} ({durumKod})
              </span>
            </div>
          </div>

          {/* TARİHLER BLOĞU */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-zinc-600 dark:text-zinc-300">
            <div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Oluşturma
              </div>
              <div className="font-medium">{formatTR(olusturmaTarihiUtc)}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Onay
              </div>
              <div className="font-medium">
                {onayTarihiUtc ? formatTR(onayTarihiUtc) : "-"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Başlangıç
              </div>
              <div className="font-medium">
                {baslamaTarihiUtc ? formatTR(baslamaTarihiUtc) : "-"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Bitiş
              </div>
              <div className="font-medium">
                {bitisTarihiUtc ? formatTR(bitisTarihiUtc) : "-"}
              </div>
            </div>
          </div>
        </header>

        {/* ÜST GRID: KONUM / KİŞİLER / AÇIKLAMA  → yan yana kutucuklar */}
        <section className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {/* Konum / adres */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Konum / Adres
            </div>
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {site?.ad && (
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {site.ad}
                  </span>
                )}
                {apt?.ad && (
                  <>
                    <span className="text-zinc-400">•</span>
                    <span className="font-medium">{apt.ad}</span>
                  </>
                )}
                {ev?.kapiNo && (
                  <>
                    <span className="text-zinc-400">•</span>
                    <span>
                      Kapı: <span className="font-semibold">{ev.kapiNo}</span>
                    </span>
                  </>
                )}
                {ev?.pkNo && (
                  <>
                    <span className="text-zinc-400">•</span>
                    <span>
                      PK: <span className="font-semibold">{ev.pkNo}</span>
                    </span>
                  </>
                )}
              </div>

              {konum?.adresMetni && (
                <div className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                  {konum.adresMetni}
                </div>
              )}

              {(konum?.enlem || konum?.boylam) && (
                <div className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                  Koordinat: {konum?.enlem ?? "-"} / {konum?.boylam ?? "-"}
                </div>
              )}
            </div>
          </div>

          {/* Ev Sahibi / Kiracı */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            <div className="mb-1 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Kişiler
              </div>
            </div>

            <div className="space-y-1">
              <div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Ev Sahibi
                </div>
                {evSahibi ? (
                  <div className="font-medium">
                    {evSahibi.adSoyad}{" "}
                    {evSahibi.telefon && (
                      <span className="text-[10px] text-zinc-500">
                        — {evSahibi.telefon}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Tanımlı değil.
                  </div>
                )}
              </div>

              <div className="pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-700">
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Kiracı
                </div>
                {kiraci ? (
                  <div className="font-medium">
                    {kiraci.adSoyad}{" "}
                    {kiraci.telefon && (
                      <span className="text-[10px] text-zinc-500">
                        — {kiraci.telefon}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Tanımlı değil.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Açıklama kartı – üst grid içinde yan yana */}
          {(aciklama || aciklama_2) && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Açıklama
              </div>
              {aciklama && (
                <div className="text-[11px] leading-snug">{aciklama}</div>
              )}
              {aciklama_2 && (
                <div className="mt-1 text-[11px] leading-snug text-zinc-600 dark:text-zinc-300">
                  {aciklama_2}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ALT GRID: SOL (NOTLAR) / SAĞ (DOSYA + PERSONEL + MALZEME) */}
        <section className="mt-3 grid gap-3 lg:grid-cols-[1.7fr,1.3fr]">
          {/* SOL BLOK – NOTLAR (2’li grid) */}
          <div className="rounded-xl border border-zinc-200 bg-white p-3 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                Tüm Notlar
              </div>
              <button
                type="button"
                onClick={() => setIsNotModalOpen(true)}
                className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 print:hidden"
              >
                Not ekle
              </button>
            </div>

            {notlar.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-200 p-2 text-[11px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                Bu iş emri için not eklenmemiş.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {notlar.map((n) => {
                  const fullName = `${n?.personel?.ad ?? ""} ${
                    n?.personel?.soyad ?? ""
                  }`.trim();
                  return (
                    <div
                      key={n.id}
                      className="rounded-lg bg-zinc-50 p-2 text-[11px] text-zinc-700 ring-1 ring-zinc-100 dark:bg-zinc-950/40 dark:text-zinc-200 dark:ring-zinc-800"
                    >
                      <div className="mb-0.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-zinc-900 text-[9px] font-semibold text-white dark:bg-zinc-50 dark:text-black">
                            {fullName ? initials(fullName) : "?"}
                          </span>
                          <span className="max-w-[200px] truncate font-semibold">
                            {fullName || "Bilinmeyen Personel"}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          {formatTR(n.olusturmaTarihiUtc)}
                        </span>
                      </div>
                      <div className="text-[11px] leading-snug text-zinc-700 dark:text-zinc-200">
                        {n.metin}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SAĞ BLOK – Belgeler / Personel / Malzeme (alt alta ama her biri kart) */}
          <div className="space-y-3">
            {/* Belgeler / Fotoğraflar */}
            <div className="rounded-xl border border-zinc-200 bg-white p-3 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                  Belgeler / Fotoğraflar
                </div>
                <button
                  type="button"
                  onClick={() => setIsBelgeModalOpen(true)}
                  className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 print:hidden"
                >
                  Belge / Foto ekle
                </button>
              </div>

              {/* Fotoğraflar küçük thumbnail (A4 için) */}
              {photoFiles.length > 0 && (
                <div className="mb-1">
                  <div className="mb-1 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Fotoğraflar
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {photoFiles.map((f) => (
                      <div
                        key={f.id}
                        className="overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 text-[10px] dark:border-zinc-700 dark:bg-zinc-950/40"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={f.url}
                          alt={f.dosyaAdi || "Fotoğraf"}
                          className="h-30 w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Belgeler - sadece isim listesi */}
              {belgeFiles.length > 0 && (
                <div className="mt-1">
                  <div className="mb-1 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Belgeler
                  </div>
                  <ul className="space-y-0.5">
                    {belgeFiles.map((f) => (
                      <li
                        key={f.id}
                        className="truncate text-[11px] text-zinc-700 dark:text-zinc-200"
                      >
                        • {f.dosyaAdi || f.url || `Belge #${f.id}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {photoFiles.length === 0 && belgeFiles.length === 0 && (
                <div className="rounded-lg border border-dashed border-zinc-200 p-2 text-[11px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  Dosya eklenmemiş.
                </div>
              )}
            </div>

            {/* Personeller – 4’lü yan yana grid */}
            <div className="rounded-xl border border-zinc-200 bg-white p-3 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                  Paylaşım / Personeller
                </div>
                <button
                  type="button"
                  onClick={() => setIsPersonelModalOpen(true)}
                  className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 print:hidden"
                >
                  Personel düzenle
                </button>
              </div>

              {personeller.length === 0 ? (
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Personel atanmadı.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
                  {personeller.map((p) => {
                    const fullName = `${p?.personel?.ad ?? ""} ${
                      p?.personel?.soyad ?? ""
                    }`.trim();
                    return (
                      <div
                        key={p.id}
                        className="flex flex-col gap-1 rounded-lg bg-zinc-50 px-2 py-1 text-[11px] ring-1 ring-zinc-100 dark:bg-zinc-950/40 dark:text-zinc-200 dark:ring-zinc-800"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-zinc-900 text-[9px] font-semibold text-white dark:bg-zinc-50 dark:text-black">
                            {initials(fullName || `P${p.id}`)}
                          </span>
                          <span className="truncate font-medium">
                            {fullName || `Personel #${p.personelId}`}
                          </span>
                        </div>
                        <div className="flex flex-col text-[10px] text-zinc-500 dark:text-zinc-400">
                          <span>{p.rolAd}</span>
                          {p.not && (
                            <span className="truncate max-w-full">{p.not}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Malzeme / İşçilik */}
            <div className="rounded-xl border border-zinc-200 bg-white p-3 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                    Malzeme / İşçilik
                  </div>
                  <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Genel Tutar:{" "}
                    <span className="font-semibold">
                      ₺ {toplamTutarGosterilen.toFixed(2)}
                    </span>{" "}
                    <span className="text-[10px]">
                      ({kdvIncluded ? "KDV %20 dahil" : "KDV hariç"})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 print:hidden">
                  <button
                    type="button"
                    onClick={() => setKdvIncluded((v) => !v)}
                    className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {kdvIncluded ? "KDV hariç göster" : "KDV dahil göster"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMalzemeModalOpen(true)}
                    className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Malzeme ekle
                  </button>
                </div>
              </div>

              {malzemeler.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-200 p-2 text-[11px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  Malzeme eklenmemiş.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-[10px]">
                    <thead>
                      <tr className="border-b border-zinc-200 text-[10px] uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                        <th className="pb-1 pr-2 text-left">Malzeme</th>
                        {/* ⭐ Yeni sütun: Kaynak */}
                        <th className="pb-1 px-2 text-left">Kaynak</th>
                        <th className="pb-1 px-2 text-right">Adet</th>
                        <th className="pb-1 px-2 text-right">Birim Fiyat</th>
                        <th className="pb-1 px-2 text-right">Tutar (net)</th>
                        <th className="pb-1 pl-2 text-right">Tutar (KDV)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {malzemeler.map((m) => {
                        const net = Number(m.birimFiyat ?? 0);
                        const adet = Number(m.adet ?? 0);
                        const netTutar = net * adet;
                        const kdvTutar = netTutar * 1.2;

                        // 🔹 JSON'dan gelen alanlar:
                        const kaynakKod = m.kaynakKod ?? m.KaynakKod;
                        const kaynakAd = m.kaynakAd ?? m.KaynakAd;

                        return (
                          <tr
                            key={m.id}
                            className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                          >
                            <td className="py-1 pr-2 text-left">
                              <div className="max-w-[160px] truncate font-medium">
                                {m.malzemeAdi}
                              </div>
                            </td>

                            {/* ⭐ Kaynak sütunu */}
                            <td className="py-1 px-2 text-left">
                              {formatKaynak(kaynakKod, kaynakAd)}
                            </td>

                            <td className="py-1 px-2 text-right">{adet}</td>
                            <td className="py-1 px-2 text-right">
                              ₺ {net.toFixed(2)}
                            </td>
                            <td className="py-1 px-2 text-right">
                              ₺ {netTutar.toFixed(2)}
                            </td>
                            <td className="py-1 pl-2 text-right">
                              ₺ {kdvTutar.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                Toplam kalem:{" "}
                <span className="font-semibold">{toplamMalzemeAdet}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* MODALLAR (print'te görünmez ama normalde çalışıyor) */}
      <BelgeFotoModals
        isOpen={isBelgeModalOpen}
        onClose={() => setIsBelgeModalOpen(false)}
        isEmriId={isEmriId}
        isEmriKod={kod}
      />

      <PersonelDuzenleModals
        isOpen={isPersonelModalOpen}
        onClose={() => setIsPersonelModalOpen(false)}
        isEmriId={isEmriId}
        isEmriKod={kod}
      />

      <NotEkleModals
        isOpen={isNotModalOpen}
        onClose={() => setIsNotModalOpen(false)}
        isEmriId={isEmriId}
        isEmriKod={kod}
      />

      <MalzemeEkleModals
        isOpen={isMalzemeModalOpen}
        onClose={() => setIsMalzemeModalOpen(false)}
        isEmriId={isEmriId}
        isEmriKod={kod}
      />
    </div>
  );
}
