// pages/kasaKayitlari/[id].jsx

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { getDataAsync } from "@/utils/apiService";

function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
}

function formatDateTR(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("tr-TR", {
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

function moneyTR(val) {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return "-";

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(Number(val));
}

function joinPeople(list) {
  if (!Array.isArray(list) || list.length === 0) return "-";

  return list
    .map((x) => {
      const p = x?.personel ?? x?.Personel;
      const adSoyad =
        p?.adSoyad ??
        p?.AdSoyad ??
        `${p?.ad ?? p?.Ad ?? ""} ${p?.soyad ?? p?.Soyad ?? ""}`.trim();

      return adSoyad || "-";
    })
    .filter((x) => x && x !== "-")
    .join(" • ");
}

function InfoBox({ label, value, strong = false }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="mb-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div
        className={`text-xs text-zinc-800 dark:text-zinc-100 ${
          strong ? "font-extrabold" : "font-semibold"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default function KasaKayitDetayPage() {
  const router = useRouter();
  const { id } = router.query;

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDetail() {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const data = await getDataAsync(`kasa-kayit/${id}`);
      setRecord(data || null);
    } catch (err) {
      console.error("Kasa kayıt detay GET hata:", err);
      setError(err?.message || "Kasa kayıt detayı alınırken hata oluştu.");
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const kasa = record || {};
  const isEmri = kasa.isEmri ?? kasa.IsEmri ?? null;

  const malzemeler = isEmri?.malzemeler ?? isEmri?.Malzemeler ?? [];
  const personeller = isEmri?.personeller ?? isEmri?.Personeller ?? [];
  const notlar = isEmri?.notlar ?? isEmri?.Notlar ?? [];
  const dosyalar = isEmri?.dosyalar ?? isEmri?.Dosyalar ?? [];
  const malzemeOzet = isEmri?.malzemeOzet ?? isEmri?.MalzemeOzet ?? {};

  const kasaToplam = useMemo(() => {
    return (
      Number(kasa.alinanToplamTutar ?? kasa.AlinanToplamTutar ?? 0) || 0
    );
  }, [kasa]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-200">
        Kasa kaydı detayı yükleniyor...
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <div className="mb-1 font-semibold">Hata</div>
          <div>{error || "Kasa kaydı bulunamadı."}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{`Kasa Kaydı #${safeText(kasa.id ?? kasa.Id)}`}</title>
      </Head>

      <div className="min-h-screen bg-zinc-50 p-3 text-xs text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
        <div className="mx-auto w-full max-w-6xl space-y-3">
          <div className="sticky top-0 z-40 rounded-xl border border-zinc-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                  Kasa Kaydı Detayı
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Kayıt ID: {safeText(kasa.id ?? kasa.Id)} • İş Emri:{" "}
                  {safeText(kasa.isEmriKodu ?? kasa.IsEmriKodu)}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isEmri?.id || isEmri?.Id ? (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/teknik/isEmriDetay/${isEmri.id ?? isEmri.Id}`)
                    }
                    className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200"
                  >
                    İş Emrine Git
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  ← Geri
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  ⌂ Anasayfa
                </button>

                <button
                  type="button"
                  onClick={loadDetail}
                  className="rounded-md border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-900/30 dark:text-sky-200"
                >
                  Yenile
                </button>
              </div>
            </div>
          </div>

          <section className="grid gap-3 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-zinc-400">
                    Kasa Bilgileri
                  </div>
                  <div className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                    {safeText(kasa.baslik ?? kasa.Baslik)}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    {formatDateTR(
                      kasa.kasaKayitTarihiUtc ??
                        kasa.KasaKayitTarihiUtc ??
                        kasa.olusturmaTarihiUtc ??
                        kasa.OlusturmaTarihiUtc
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-50 px-4 py-3 text-right dark:bg-emerald-950/30">
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-200">
                    Alınan Toplam
                  </div>
                  <div className="text-lg font-extrabold text-emerald-800 dark:text-emerald-100">
                    {moneyTR(kasaToplam)}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoBox
                  label="İşçilik Tutarı"
                  value={moneyTR(kasa.iscilikTutari ?? kasa.IscilikTutari)}
                  strong
                />
                <InfoBox
                  label="Malzeme Tutarı"
                  value={moneyTR(kasa.malzemeTutari ?? kasa.MalzemeTutari)}
                  strong
                />
                <InfoBox
                  label="Teslim Edilen Personel"
                  value={safeText(
                    kasa.teslimEdilenPersonel ?? kasa.TeslimEdilenPersonel
                  )}
                />
                <InfoBox
                  label="Kaydı Yapan"
                  value={safeText(
                    kasa.kaydiYapanPersonel ??
                      kasa.KaydiYapanPersonel ??
                      kasa.not_2 ??
                      kasa.Not_2
                  )}
                />
                <InfoBox
                  label="İş Emri Kodu"
                  value={safeText(
                    kasa.isEmriKodu ?? kasa.IsEmriKodu ?? kasa.not_1 ?? kasa.Not_1
                  )}
                />
                <InfoBox
                  label="Oluşturma Tarihi"
                  value={formatDateTR(kasa.olusturmaTarihiUtc ?? kasa.OlusturmaTarihiUtc)}
                />
              </div>

              <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                <div className="mb-1 text-[11px] font-semibold text-zinc-500">
                  Açıklama
                </div>
                <div className="whitespace-pre-wrap text-xs text-zinc-700 dark:text-zinc-200">
                  {safeText(kasa.aciklama ?? kasa.Aciklama)}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                İş Emri Özeti
              </div>

              {isEmri ? (
                <div className="space-y-3">
                  <InfoBox label="Kod" value={safeText(isEmri.kod ?? isEmri.Kod)} />
                  <InfoBox
                    label="Başlık"
                    value={safeText(isEmri.kisaBaslik ?? isEmri.KisaBaslik)}
                  />
                  <InfoBox
                    label="Durum"
                    value={safeText(isEmri.durumAd ?? isEmri.DurumAd)}
                  />
                  <InfoBox
                    label="Personeller"
                    value={safeText(joinPeople(personeller))}
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  Bağlı iş emri bulunamadı.
                </div>
              )}
            </div>
          </section>

          {isEmri && (
            <section className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-3 text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                  İş Emri Malzemeleri
                </div>

                <div className="mb-3 grid gap-2 sm:grid-cols-2">
                  <InfoBox
                    label="Malzeme Toplam"
                    value={moneyTR(malzemeOzet.toplamTutar ?? malzemeOzet.ToplamTutar)}
                    strong
                  />
                  <InfoBox
                    label="Kalem Sayısı"
                    value={safeText(malzemeOzet.kalemSayisi ?? malzemeOzet.KalemSayisi)}
                  />
                </div>

                <div className="space-y-2">
                  {malzemeler.map((m) => (
                    <div
                      key={m.id ?? m.Id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-100 dark:bg-zinc-950/40 dark:ring-zinc-800"
                    >
                      <div>
                        <div className="font-semibold text-zinc-800 dark:text-zinc-100">
                          {safeText(m.malzemeAdi ?? m.MalzemeAdi)}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Adet: {safeText(m.adet ?? m.Adet)} • Kaynak:{" "}
                          {safeText(m.kaynakAd ?? m.KaynakAd)}
                        </div>
                      </div>

                      <div className="text-right font-extrabold text-zinc-900 dark:text-zinc-50">
                        {moneyTR(m.tutar ?? m.Tutar)}
                      </div>
                    </div>
                  ))}

                  {!malzemeler.length && (
                    <div className="rounded-xl border border-dashed border-zinc-200 p-3 text-center text-zinc-500 dark:border-zinc-800">
                      Malzeme kaydı yok.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-3 text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                  İş Emri Notları
                </div>

                <div className="space-y-2">
                  {notlar.map((n) => {
                    const p = n.personel ?? n.Personel;
                    const adSoyad =
                      p?.adSoyad ??
                      p?.AdSoyad ??
                      `${p?.ad ?? p?.Ad ?? ""} ${p?.soyad ?? p?.Soyad ?? ""}`.trim();

                    return (
                      <div
                        key={n.id ?? n.Id}
                        className="rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-100 dark:bg-zinc-950/40 dark:ring-zinc-800"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <div className="font-semibold text-zinc-800 dark:text-zinc-100">
                            {safeText(adSoyad)}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            {formatDateTR(n.olusturmaTarihiUtc ?? n.OlusturmaTarihiUtc)}
                          </div>
                        </div>
                        <div className="whitespace-pre-wrap text-[12px] text-zinc-700 dark:text-zinc-200">
                          {safeText(n.metin ?? n.Metin)}
                        </div>
                      </div>
                    );
                  })}

                  {!notlar.length && (
                    <div className="rounded-xl border border-dashed border-zinc-200 p-3 text-center text-zinc-500 dark:border-zinc-800">
                      Not kaydı yok.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {dosyalar.length > 0 && (
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                İş Emri Dosyaları
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {dosyalar.map((d) => (
                  <a
                    key={d.id ?? d.Id}
                    href={d.url ?? d.Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    📎 {safeText(d.dosyaAdi ?? d.DosyaAdi)}
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}