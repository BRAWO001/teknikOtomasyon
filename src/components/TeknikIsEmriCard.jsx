// src/components/TeknikIsEmriCard.jsx

import { useState } from "react";
import Link from "next/link";
import BelgeFotoModals from "./BelgeFotoModals";
import PersonelDuzenleModals from "./PersonelDuzenleModals";
import NotEkleModals from "./NotEkleModals";
import MalzemeEkleModals from "./MalzemeEkleModals";
import IsEmriDurumGuncelleModals from "./IsEmriDurumGuncelleModals";

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

// basit foto dosya tipi kontrolü
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

export default function TeknikIsEmriCard({ data, currentPersonelId }) {
  const {
    id,
    kod,
    kod_2,
    kod_3, // ACIL / DISIS vb.
    kisaBaslik,
    aciklama,
    olusturmaTarihiUtc,
    konum,
    site,
    apt,
    ev,
    dosyalar = [],
    personeller = [],
    notlar = [],
    malzemeler = [],
  } = data;

  // 🔹 Backend'ten gelen durum kodu -> yüzde gibi kullanacağız
  const rawDurumKod =
    data.durumKod ??
    data.DurumKod ??
    data.emirleriDurumuKod ??
    data.EmirleriDurumuKod ??
    data.emirleriDurumu ??
    0;

  const [localDurumKod, setLocalDurumKod] = useState(
    Number(rawDurumKod) || 0
  );

  const progress = Math.max(
    0,
    Math.min(100, Number(localDurumKod) || 0)
  );

  const isAcil = kod_3 === "ACIL";
  const people = personeller.slice(0, 5);
  const notesPreview = notlar.slice(0, 2);
  const malzemelerPreview = malzemeler.slice(0, 2);

  // 🔹 KDV toggle (varsayılan: %20 KDV dahil)
  const [kdvIncluded, setKdvIncluded] = useState(true);

  // 🔹 Modal state'leri
  const [isBelgeModalOpen, setIsBelgeModalOpen] = useState(false);
  const [isPersonelModalOpen, setIsPersonelModalOpen] = useState(false);
  const [isNotModalOpen, setIsNotModalOpen] = useState(false);
  const [isMalzemeModalOpen, setIsMalzemeModalOpen] = useState(false);
  const [isDurumModalOpen, setIsDurumModalOpen] = useState(false);

  // 🔹 Dosyalar için hesaplamalar (foto önce)
  const allDosyalar = dosyalar || [];
  const toplamDosyaAdet = allDosyalar.length;

  const photoFiles = allDosyalar.filter(
    (f) =>
      f.turAd === "Foto" ||
      isImageFile(f.url || "") ||
      isImageFile(f.dosyaAdi || "")
  );

  const nonPhotoFiles = allDosyalar.filter((f) => !photoFiles.includes(f));
  const dosyalarPreview = [...photoFiles, ...nonPhotoFiles].slice(0, 2);

  // 🔹 Malzemeler için toplam hesapları
  const toplamMalzemeAdet = malzemeler.length;

  const toplamNetTutar = malzemeler.reduce((acc, m) => {
    const birim = Number(m.birimFiyat ?? 0);
    const adet = Number(m.adet ?? 0);
    return acc + birim * adet;
  }, 0);

  const toplamTutarGosterilen = kdvIncluded
    ? toplamNetTutar * 1.2
    : toplamNetTutar;

  // 🔹 kod_3 label (ACIL / DIŞ İŞ)
  let kod3Label = null;
  let kod3Class = "";
  if (kod_3) {
    if (kod_3 === "ACIL") {
      kod3Label = "ACİL";
      kod3Class =
        "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900";
    } else {
      // diğer tüm kod_3 değerlerini DIŞ İŞ olarak göster
      kod3Label = "DIŞ İŞ";
      kod3Class =
        "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900";
    }
  }

  // Modal'dan durum güncellendiğinde lokal state'i güncelle
  const handleDurumUpdated = (newKod) => {
    setLocalDurumKod(Number(newKod) || 0);
  };

  return (
    <>
      <article
        className={`min-w-[320px] max-w-[360px] flex-shrink-0 overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md
  ${
    isAcil
      ? "border-red-200 bg-white dark:border-red-900 dark:bg-zinc-900"
      : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
  }`}
      >
        {/* ÜST STRİP */}
        <div
          className={`h-1 w-full ${
            isAcil ? "bg-red-500" : "bg-zinc-900 dark:bg-zinc-50"
          }`}
        />

        {/* DURUM / PROGRESS BAR */}
        <div className="px-3 pt-2">
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500 dark:text-zinc-400">
              İş İlerleme Durumu
            </span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-100">
              {progress}%{" "}
              {progress === 100 && (
                <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                  Tamamlandı
                </span>
              )}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full ${
                progress < 30
                  ? "bg-red-500"
                  : progress < 75
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Eğer personel ekranındaysa durum güncelle butonu */}
          {currentPersonelId && (
            <div className="mt-1.5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDurumModalOpen(true)}
                className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                İş Durumunu Güncelle
              </button>
            </div>
          )}
        </div>

        <div className="p-3 pt-2">
          {/* KOD + SİTE ADI EN ÜSTE */}
          <div className="flex items-start justify-between gap-2">
            <div>
              {site?.ad && (
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {site.ad}
                </div>
              )}

              <div className="flex items-center gap-1">
                <div className="text-base font-semibold tracking-[0.08em] text-zinc-900 dark:text-zinc-50">
                  {kod}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1">
              {/* TARİH */}
              {olusturmaTarihiUtc && (
                <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="font-medium">
                    {formatTR(olusturmaTarihiUtc)}
                  </span>
                </div>
              )}

              {/* KOD_3 – ACİL / DIŞ İŞ */}
              {kod3Label && (
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ${kod3Class}`}
                >
                  {kod3Label}
                </span>
              )}
            </div>
          </div>

          {/* BAŞLIK */}
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
            {kisaBaslik}
          </h3>

          {/* KONUM / SİTE / EV + AÇIKLAMA */}
          <div className="mt-2 rounded-xl border border-zinc-100 bg-white text-[13px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            <div className="flex flex-wrap items-center gap-1.5">
              {site?.ad && <span className="font-semibold">{site.ad}</span>}

              {apt?.ad && (
                <>
                  <span className="text-zinc-400 dark:text-zinc-500">•</span>
                  <span className="font-medium">{apt.ad}</span>
                </>
              )}

              {ev?.kapiNo && (
                <>
                  <span className="text-zinc-400 dark:text-zinc-500">•</span>
                  <span>
                    Kapı: <span className="font-semibold">{ev.kapiNo}</span>
                  </span>
                </>
              )}
            </div>

            {(ev?.pkNo || konum?.adresMetni) && (
              <div className="mt-1 space-y-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                {ev?.pkNo && (
                  <div>
                    PK: <span className="font-medium">{ev.pkNo}</span>
                  </div>
                )}
                {konum?.adresMetni && (
                  <div className="line-clamp-2">{konum.adresMetni}</div>
                )}
              </div>
            )}

            {/* AÇIKLAMA METNİ */}
            {aciklama && (
              <div className="mt-2 rounded-lg bg-zinc-50 p-2 text-[12px] text-zinc-700 ring-1 ring-zinc-100 dark:bg-zinc-950/40 dark:text-zinc-200 dark:ring-zinc-800">
                <div className="mb-0.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                  Açıklama
                </div>
                <div className="line-clamp-6">{aciklama}</div>
              </div>
            )}
          </div>

          {/* BELGELER / FOTOĞRAFLAR */}
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                Belgeler / Fotoğraflar
              </div>
              <div className="flex items-center gap-1.5">
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Toplam:{" "}
                  <span className="font-semibold">{toplamDosyaAdet}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBelgeModalOpen(true)}
                  className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Belge / Foto ekle
                </button>
              </div>
            </div>

            {toplamDosyaAdet === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-200 p-2 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                Dosya eklenmemiş.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-1.5">
                  {dosyalarPreview.map((f, idx) => {
                    const name = f.dosyaAdi || f.url || `Dosya #${idx + 1}`;
                    const turLabel =
                      f.turAd || (isImageFile(name) ? "Foto" : "Belge");
                    const isPhoto =
                      turLabel === "Foto" ||
                      isImageFile(f.url || "") ||
                      isImageFile(f.dosyaAdi || "");

                    return (
                      <a
                        key={f.id ?? idx}
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative block aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 text-[11px] text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900"
                      >
                        {isPhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={f.url}
                            alt={name}
                            className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
                            <div className="flex h-8 w-7 items-center justify-center rounded-md border border-zinc-300 bg-white text-[10px] font-semibold dark:border-zinc-600 dark:bg-zinc-900">
                              PDF
                            </div>
                            <div className="line-clamp-2 px-1.5 text-center text-[10px]">
                              {name}
                            </div>
                          </div>
                        )}

                        <div className="pointer-events-none absolute left-1 top-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                          {isPhoto ? "Foto" : "Belge"}
                        </div>

                        {isPhoto && (
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                            <div className="line-clamp-2 text-[10px] font-medium text-white">
                              {name}
                            </div>
                          </div>
                        )}
                      </a>
                    );
                  })}
                </div>

                {toplamDosyaAdet > 2 && (
                  <div className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                    + {toplamDosyaAdet - 2} dosya daha…
                  </div>
                )}
              </>
            )}
          </div>

          {/* PERSONELLER */}
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                Paylaşım / Personeller
              </div>
              <button
                type="button"
                onClick={() => setIsPersonelModalOpen(true)}
                className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Personel düzenle
              </button>
            </div>

            {people.length === 0 ? (
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Personel atanmadı.
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {people.map((p) => {
                  const fullName = `${p?.personel?.ad ?? ""} ${
                    p?.personel?.soyad ?? ""
                  }`.trim();
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200"
                      title={p?.not || ""}
                    >
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-zinc-900 text-[9px] font-semibold text-white dark:bg-zinc-50 dark:text-black">
                        {initials(fullName)}
                      </span>
                      <span className="max-w-[120px] truncate font-medium">
                        {fullName}
                      </span>
                      <span className="text-zinc-400">•</span>
                      <span className="truncate text-zinc-500 dark:text-zinc-400">
                        {p.rolAd}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* MALZEMELER */}
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Malzeme / İşçilik
                </div>
                <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Genel Tutar:{" "}
                    <span className="font-semibold">
                      ₺ {toplamTutarGosterilen.toFixed(2)}
                    </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Adet:{" "}
                  <span className="font-semibold">{toplamMalzemeAdet}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setKdvIncluded((v) => !v)}
                  className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {kdvIncluded ? "KDV %20 dahil" : "KDV hariç"}
                </button>

                <button
                  type="button"
                  onClick={() => setIsMalzemeModalOpen(true)}
                  className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Ekle
                </button>
              </div>
            </div>

            {toplamMalzemeAdet === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-200 p-2 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                Malzeme eklenmemiş.
              </div>
            ) : (
              <div className="space-y-1.5">
                {malzemelerPreview.map((m, idx) => {
                  const netUnit = Number(m.birimFiyat ?? 0);
                  const unit = kdvIncluded ? netUnit * 1.2 : netUnit;
                  const adet = Number(m.adet ?? 0);
                  const total = unit * adet;

                  return (
                    <div
                      key={m.id ?? idx}
                      className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 p-2.5 text-[11px] ring-1 ring-zinc-100 dark:bg-zinc-950/40 dark:text-zinc-200 dark:ring-zinc-800"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-zinc-800 dark:text-zinc-200">
                          {m.malzemeAdi ?? m.ad ?? "Malzeme"}
                        </div>
                        <div className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                          Adet:{" "}
                          <span className="font-semibold">{adet || "-"}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-zinc-50 dark:text-black">
                          ₺ {unit.toFixed(2)}
                        </span>
                        <span className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                          Tutar: ₺ {total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {toplamMalzemeAdet > 2 && (
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    + {toplamMalzemeAdet - 2} malzeme daha…
                  </div>
                )}
              </div>
            )}
          </div>

          {/* NOTLAR (ilk 2) */}
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                Son Notlar
              </div>
              <button
                type="button"
                onClick={() => setIsNotModalOpen(true)}
                className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Not ekle
              </button>
            </div>

            {notesPreview.length === 0 ? (
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Not yok.
              </div>
            ) : (
              <div className="space-y-1.5">
                {notesPreview.map((n) => {
                  const fullName = `${n?.personel?.ad ?? ""} ${
                    n?.personel?.soyad ?? ""
                  }`.trim();

                  return (
                    <div
                      key={n.id}
                      className="rounded-lg bg-zinc-50 p-2.5 text-[11px] text-zinc-700 ring-1 ring-zinc-100 dark:bg-zinc-950/40 dark:text-zinc-200 dark:ring-zinc-800"
                    >
                      <div className="mb-0.5 flex items-center justify-between gap-2">
                        <span className="max-w-[160px] truncate font-semibold">
                          {fullName}
                        </span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          {formatTR(n.olusturmaTarihiUtc)}
                        </span>
                      </div>
                      <div className="line-clamp-2 text-zinc-600 dark:text-zinc-300">
                        {n.metin}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ALT AKSİYON */}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Malzeme:{" "}
              <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                {toplamMalzemeAdet}
              </span>
            </div>

            <Link
              href={`/teknik/isEmriDetay/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
            >
              İş Emri Detay →
            </Link>
          </div>
        </div>
      </article>

      {/* MODALLAR */}
      <BelgeFotoModals
        isOpen={isBelgeModalOpen}
        onClose={() => setIsBelgeModalOpen(false)}
        isEmriId={id}
        isEmriKod={kod}
      />

      <PersonelDuzenleModals
        isOpen={isPersonelModalOpen}
        onClose={() => setIsPersonelModalOpen(false)}
        isEmriId={id}
        isEmriKod={kod}
      />

      <NotEkleModals
        isOpen={isNotModalOpen}
        onClose={() => setIsNotModalOpen(false)}
        isEmriId={id}
        isEmriKod={kod}
        personelId={currentPersonelId}
      />

      <MalzemeEkleModals
        isOpen={isMalzemeModalOpen}
        onClose={() => setIsMalzemeModalOpen(false)}
        isEmriId={id}
        isEmriKod={kod}
      />

      <IsEmriDurumGuncelleModals
        isOpen={isDurumModalOpen}
        onClose={() => setIsDurumModalOpen(false)}
        isEmriId={id}
        isEmriKod={kod}
        currentDurumKod={localDurumKod}
        personelId={currentPersonelId}
        onUpdated={handleDurumUpdated}
      />
    </>
  );
}
