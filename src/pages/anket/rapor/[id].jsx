




import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";

function extractBackendMsg(err) {
  const data = err?.response?.data;
  if (!data) return null;

  if (data?.errors && typeof data.errors === "object") {
    const flat = Object.entries(data.errors)
      .flatMap(([k, arr]) =>
        Array.isArray(arr) ? arr.map((x) => `${k}: ${x}`) : []
      )
      .slice(0, 10);

    if (flat.length) return flat.join(" | ");
  }

  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;

  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
}

function pick(obj, ...keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

function arr(obj, ...keys) {
  const v = pick(obj, ...keys);
  return Array.isArray(v) ? v : [];
}

function formatDateTR(value) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("tr-TR");
  } catch {
    return "-";
  }
}

function formatDateOnlyTR(value) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("tr-TR");
  } catch {
    return "-";
  }
}

function getSoruTipLabel(v) {
  const n = Number(v);
  if (n === 1) return "Tek Seçim";
  if (n === 2) return "Çoklu Seçim";
  if (n === 3) return "Kısa Metin";
  if (n === 4) return "Uzun Metin";
  if (n === 5) return "Sayı";
  if (n === 6) return "Tarih";
  return "Bilinmiyor";
}

function percent(numerator, denominator) {
  const n = Number(numerator || 0);
  const d = Number(denominator || 0);
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function boolText(v) {
  return v ? "Evet" : "Hayır";
}

function normId(v) {
  if (v === undefined || v === null) return "";
  return String(v);
}

function getKatilimciId(x) {
  return pick(x, "katilimciId", "KatilimciId");
}

function getAdSoyad(x) {
  return pick(x, "adSoyad", "AdSoyad") || "-";
}

function getTelefon(x) {
  return pick(x, "telefon", "Telefon") || "-";
}

function getEposta(x) {
  return pick(x, "eposta", "Eposta") || "-";
}

function getCevapTarihi(x) {
  return pick(x, "cevapTarihiUtc", "CevapTarihiUtc");
}

function getKatilimTarihi(x) {
  return pick(x, "katilimTarihiUtc", "KatilimTarihiUtc");
}

function getSoruId(soru) {
  return pick(soru, "id", "Id");
}

function getSoruBaslik(soru) {
  return pick(soru, "baslik", "Baslik") || "-";
}

function getSoruAciklama(soru) {
  return pick(soru, "aciklama", "Aciklama") || "";
}

function getSoruTipi(soru) {
  return Number(pick(soru, "soruTipi", "SoruTipi") || 0);
}

function getSecenekId(secenek) {
  return pick(secenek, "id", "Id");
}

function getSecenekMetni(secenek) {
  return pick(secenek, "secenekMetni", "SecenekMetni") || "-";
}

function getOySayisi(secenek) {
  return Number(pick(secenek, "oySayisi", "OySayisi") || 0);
}

function getCevapValue(item) {
  const v = pick(item, "cevap", "Cevap");
  if (v === undefined || v === null || v === "") return "-";
  return v;
}

function buildParticipantAnswers(sorular, katilimcilar) {
  return katilimcilar.map((katilimci) => {
    const kid = normId(getKatilimciId(katilimci));

    const cevaplar = sorular.map((soru) => {
      const tip = getSoruTipi(soru);
      const soruBaslik = getSoruBaslik(soru);

      if (tip === 1 || tip === 2) {
        const secenekler = arr(soru, "secenekler", "Secenekler");
        const secimler = [];

        secenekler.forEach((secenek) => {
          const cevaplayanlar = arr(secenek, "cevaplayanlar", "Cevaplayanlar");
          const bulundu = cevaplayanlar.some(
            (c) => normId(getKatilimciId(c)) === kid
          );

          if (bulundu) {
            secimler.push(getSecenekMetni(secenek));
          }
        });

        return {
          soruId: getSoruId(soru),
          soruBaslik,
          soruTipi: tip,
          cevap: secimler.length ? secimler.join(", ") : "-",
        };
      }

      if (tip === 3 || tip === 4) {
        const list = arr(soru, "metinCevaplar", "MetinCevaplar");
        const item = list.find((x) => normId(getKatilimciId(x)) === kid);

        return {
          soruId: getSoruId(soru),
          soruBaslik,
          soruTipi: tip,
          cevap: item ? getCevapValue(item) : "-",
        };
      }

      if (tip === 5) {
        const list = arr(soru, "sayiCevaplar", "SayiCevaplar");
        const item = list.find((x) => normId(getKatilimciId(x)) === kid);

        return {
          soruId: getSoruId(soru),
          soruBaslik,
          soruTipi: tip,
          cevap: item ? getCevapValue(item) : "-",
        };
      }

      if (tip === 6) {
        const list = arr(soru, "tarihCevaplar", "TarihCevaplar");
        const item = list.find((x) => normId(getKatilimciId(x)) === kid);
        const v = item ? getCevapValue(item) : "-";

        return {
          soruId: getSoruId(soru),
          soruBaslik,
          soruTipi: tip,
          cevap: v === "-" ? "-" : formatDateOnlyTR(v),
        };
      }

      return {
        soruId: getSoruId(soru),
        soruBaslik,
        soruTipi: tip,
        cevap: "-",
      };
    });

    return {
      katilimci,
      cevaplar,
    };
  });
}

export default function AnketRaporPage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [anket, setAnket] = useState(null);
  const [sorular, setSorular] = useState([]);
  const [katilimcilar, setKatilimcilar] = useState([]);

  useEffect(() => {
    if (!router.isReady || !id) return;

    let cancelled = false;

    const loadReport = async () => {
      try {
        setLoading(true);
        setMsg("");

        const res = await getDataAsync(`anket/${id}/rapor`);
        if (cancelled) return;

        setAnket(res?.anket ?? res?.Anket ?? null);
        setSorular(
          Array.isArray(res?.sorular)
            ? res.sorular
            : Array.isArray(res?.Sorular)
            ? res.Sorular
            : []
        );
        setKatilimcilar(
          Array.isArray(res?.katilimcilar)
            ? res.katilimcilar
            : Array.isArray(res?.Katilimcilar)
            ? res.Katilimcilar
            : []
        );
      } catch (e) {
        console.error("ANKET RAPOR LOAD ERROR:", e);
        if (cancelled) return;

        const backendMsg = extractBackendMsg(e);
        setMsg(
          backendMsg
            ? `Rapor alınamadı: ${backendMsg}`
            : "Rapor alınamadı."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadReport();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, id]);

  const publicLink = useMemo(() => {
    const guid = pick(
      anket,
      "guidLink",
      "GuidLink",
      "publicToken",
      "PublicToken"
    );

    if (!guid) return "";
    return `/anketCevap/${guid}`;
  }, [anket]);

  const toplamKatilimci = useMemo(
    () =>
      Number(
        pick(anket, "toplamKatilimci", "ToplamKatilimci") ??
          katilimcilar?.length ??
          0
      ),
    [anket, katilimcilar]
  );

  const toplamSoru = useMemo(
    () =>
      Number(
        pick(anket, "toplamSoru", "ToplamSoru") ?? sorular?.length ?? 0
      ),
    [anket, sorular]
  );

  const secimliSoruSayisi = useMemo(
    () => sorular.filter((x) => getSoruTipi(x) === 1 || getSoruTipi(x) === 2).length,
    [sorular]
  );

  const metinSoruSayisi = useMemo(
    () =>
      sorular.filter((x) => {
        const t = getSoruTipi(x);
        return t === 3 || t === 4 || t === 5 || t === 6;
      }).length,
    [sorular]
  );

  const katilimciCevapRaporu = useMemo(
    () => buildParticipantAnswers(sorular, katilimcilar),
    [sorular, katilimcilar]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2">
            <div className="rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-zinc-200 dark:bg-white dark:ring-zinc-200">
              <Image
                src="/eos_management_logo.png"
                alt="EOS Management"
                width={145}
                height={40}
                priority
                className="h-9 w-auto object-contain"
              />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wide">EOS MANAGEMENT</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Anket Raporu
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-3 py-5">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="animate-pulse space-y-3">
              <div className="h-5 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-20 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-20 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (msg && !anket) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="mx-auto max-w-4xl px-3 py-6">
          <div className="rounded-xl border border-red-200 bg-white p-4 shadow-sm dark:border-red-900 dark:bg-zinc-900">
            <div className="text-base font-semibold text-red-700 dark:text-red-300">
              Rapor açılamadı
            </div>
            <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
              {msg}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => router.reload()}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Tekrar Dene
              </button>
              <button
                type="button"
                onClick={() => router.push("/anket")}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                Listeye Dön
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const anketBaslik = pick(anket, "baslik", "Baslik") || "-";
  const anketAciklama = pick(anket, "aciklama", "Aciklama") || "";
  const siteAd = pick(anket, "siteAd", "SiteAd") || "-";
  const yayinlandiMi = pick(anket, "yayinlandiMi", "YayinlandiMi");
  const aktifMi = pick(anket, "aktifMi", "AktifMi");
  const tekrarCevaplanabilirMi = pick(
    anket,
    "tekrarCevaplanabilirMi",
    "TekrarCevaplanabilirMi"
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-zinc-200 dark:bg-white dark:ring-zinc-200">
              <Image
                src="/eos_management_logo.png"
                alt="EOS Management"
                width={145}
                height={40}
                priority
                className="h-9 w-auto object-contain"
              />
            </div>

            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-bold tracking-wide">
                EOS MANAGEMENT
              </div>
              <div className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                Anket Yönetimi • Detaylı Rapor
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {publicLink ? (
              <button
                type="button"
                onClick={() => window.open(publicLink, "_blank", "noopener,noreferrer")}
                className="h-8 rounded-md border border-blue-200 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200"
              >
                Cevap Linki
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => router.back()}
              className="h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              ← Geri
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 py-4">
        {msg && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[12px] text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
            {msg}
          </div>
        )}

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="text-lg font-bold tracking-tight">
                {anketBaslik}
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                Soru bazlı cevap özeti + katılımcı bazlı cevap detayları
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 xl:justify-end">
              <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Site: <b>{siteAd}</b>
              </span>
              <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Aktif: <b>{boolText(aktifMi)}</b>
              </span>
              <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Yayında: <b>{boolText(yayinlandiMi)}</b>
              </span>
              <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Tekrar: <b>{boolText(tekrarCevaplanabilirMi)}</b>
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/30">
                <div className="mb-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                  Anket Açıklaması
                </div>
                <div className="whitespace-pre-wrap text-[13px] leading-5 text-zinc-800 dark:text-zinc-100">
                  {anketAciklama?.trim() ? anketAciklama : "-"}
                </div>
              </div>
            </div>

            <div className="xl:col-span-4">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/30">
                <div className="mb-2 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                  Genel Bilgi
                </div>

                <div className="space-y-1.5 text-[12px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400">Oluşturma</span>
                    <span className="text-right font-medium">
                      {formatDateTR(
                        pick(anket, "olusturmaTarihiUtc", "OlusturmaTarihiUtc")
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400">Güncelleme</span>
                    <span className="text-right font-medium">
                      {formatDateTR(
                        pick(anket, "guncellemeTarihiUtc", "GuncellemeTarihiUtc")
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400">Public Link</span>
                    <span className="max-w-[210px] truncate text-right font-medium">
                      {publicLink || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Toplam Katılımcı
            </div>
            <div className="mt-1 text-xl font-bold">{toplamKatilimci}</div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Toplam Soru
            </div>
            <div className="mt-1 text-xl font-bold">{toplamSoru}</div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Seçimli Soru
            </div>
            <div className="mt-1 text-xl font-bold">{secimliSoruSayisi}</div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Açık / Sayı / Tarih
            </div>
            <div className="mt-1 text-xl font-bold">{metinSoruSayisi}</div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <div className="text-base font-bold">Soru Bazlı Cevap Raporu</div>
              
            </div>
          </div>

          <div className="space-y-3">
            {sorular.length === 0 ? (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300">
                Soru verisi bulunmuyor.
              </div>
            ) : (
              sorular.map((soru, index) => {
                const toplamCevaplayan = Number(
                  pick(soru, "toplamCevaplayan", "ToplamCevaplayan") || 0
                );
                const tip = getSoruTipi(soru);

                const secenekler = arr(soru, "secenekler", "Secenekler");
                const metinCevaplar = arr(soru, "metinCevaplar", "MetinCevaplar");
                const sayiCevaplar = arr(soru, "sayiCevaplar", "SayiCevaplar");
                const tarihCevaplar = arr(soru, "tarihCevaplar", "TarihCevaplar");

                return (
                  <div
                    key={getSoruId(soru) ?? index}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/30"
                  >
                    <div className="flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {index + 1}. {getSoruBaslik(soru)}
                        </div>

                        {getSoruAciklama(soru) ? (
                          <div className="mt-0.5 text-[12px] leading-5 text-zinc-600 dark:text-zinc-400">
                            {getSoruAciklama(soru)}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                          {getSoruTipLabel(tip)}
                        </span>

                        <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                          Cevaplayan: {toplamCevaplayan}
                        </span>
                      </div>
                    </div>

                    {(tip === 1 || tip === 2) && (
                      <div className="mt-2 space-y-2">
                        {secenekler.length === 0 ? (
                          <div className="rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[13px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                            Seçenek verisi bulunmuyor.
                          </div>
                        ) : (
                          secenekler.map((secenek) => {
                            const oySayisi = getOySayisi(secenek);
                            const yuzde = percent(
                              oySayisi,
                              toplamCevaplayan || toplamKatilimci
                            );
                            const cevaplayanlar = arr(
                              secenek,
                              "cevaplayanlar",
                              "Cevaplayanlar"
                            );

                            return (
                              <div
                                key={getSecenekId(secenek)}
                                className="rounded-lg border border-zinc-200 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-950"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-[13px] font-bold text-zinc-800 dark:text-zinc-100">
                                    {getSecenekMetni(secenek)}
                                  </div>
                                  <div className="shrink-0 text-[12px] text-zinc-600 dark:text-zinc-300">
                                    {oySayisi} oy • %{yuzde}
                                  </div>
                                </div>

                                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                                  <div
                                    className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                                    style={{ width: `${yuzde}%` }}
                                  />
                                </div>

                                <div className="mt-2">
                                  <div className="mb-1 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                                    Bu seçeneği işaretleyenler
                                  </div>

                                  {cevaplayanlar.length === 0 ? (
                                    <div className="rounded-md border border-dashed border-zinc-200 px-2 py-1.5 text-[12px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                                      Cevaplayan bulunmuyor.
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 gap-1.5 md:grid-cols-8 xl:grid-cols-8">
                                      {cevaplayanlar.map((k, i) => (
                                        <div
                                          key={`${getKatilimciId(k)}-${i}`}
                                          className="rounded-md border border-zinc-200 bg-zinc-50 px-1 py-1 dark:border-zinc-800 dark:bg-zinc-900/60"
                                        >
                                          <div className="truncate text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
                                            {getAdSoyad(k)}
                                          </div>
                                          <div className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                                            {getTelefon(k)} 
                                          </div>
                                          
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {(tip === 3 || tip === 4) && (
                      <div className="mt-2 space-y-1.5">
                        {metinCevaplar.length === 0 ? (
                          <div className="rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[13px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                            Metin cevabı bulunmuyor.
                          </div>
                        ) : (
                          metinCevaplar.map((item, idx) => (
                            <div
                              key={pick(item, "cevapId", "CevapId") ?? `${getKatilimciId(item)}-${idx}`}
                              className="rounded-lg border border-zinc-200 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-950"
                            >
                              <div className="flex flex-col gap-0.5 md:flex-row md:items-center md:justify-between">
                                <div className="text-[13px] font-bold text-zinc-800 dark:text-zinc-100">
                                  {getAdSoyad(item)}
                                </div>
                                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                  {formatDateTR(getCevapTarihi(item))}
                                </div>
                              </div>

                              <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                {getTelefon(item)} • {getEposta(item)}
                              </div>

                              <div className="mt-1.5 whitespace-pre-wrap rounded-md bg-zinc-50 px-2 py-1.5 text-[13px] leading-5 text-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-200">
                                {getCevapValue(item)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {tip === 5 && (
                      <div className="mt-2 space-y-1.5">
                        {sayiCevaplar.length === 0 ? (
                          <div className="rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[13px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                            Sayısal cevap bulunmuyor.
                          </div>
                        ) : (
                          sayiCevaplar.map((item, idx) => (
                            <div
                              key={pick(item, "cevapId", "CevapId") ?? `${getKatilimciId(item)}-${idx}`}
                              className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 dark:border-zinc-800 dark:bg-zinc-950"
                            >
                              <div className="min-w-0">
                                <div className="truncate text-[13px] font-bold text-zinc-800 dark:text-zinc-100">
                                  {getAdSoyad(item)}
                                </div>
                                <div className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                                  {getTelefon(item)} • {getEposta(item)}
                                </div>
                                <div className="text-[10px] text-zinc-400">
                                  {formatDateTR(getCevapTarihi(item))}
                                </div>
                              </div>

                              <div className="shrink-0 text-base font-bold text-zinc-900 dark:text-zinc-100">
                                {getCevapValue(item)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {tip === 6 && (
                      <div className="mt-2 space-y-1.5">
                        {tarihCevaplar.length === 0 ? (
                          <div className="rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[13px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                            Tarih cevabı bulunmuyor.
                          </div>
                        ) : (
                          tarihCevaplar.map((item, idx) => (
                            <div
                              key={pick(item, "cevapId", "CevapId") ?? `${getKatilimciId(item)}-${idx}`}
                              className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 dark:border-zinc-800 dark:bg-zinc-950"
                            >
                              <div className="min-w-0">
                                <div className="truncate text-[13px] font-bold text-zinc-800 dark:text-zinc-100">
                                  {getAdSoyad(item)}
                                </div>
                                <div className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                                  {getTelefon(item)} • {getEposta(item)}
                                </div>
                                <div className="text-[10px] text-zinc-400">
                                  {formatDateTR(getCevapTarihi(item))}
                                </div>
                              </div>

                              <div className="shrink-0 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                {formatDateOnlyTR(getCevapValue(item))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2">
            <div className="text-base font-bold">
              Katılımcı Bazlı Cevap Detayı
            </div>
            
          </div>

          <div className="space-y-2">
            {katilimciCevapRaporu.length === 0 ? (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300">
                Katılımcı verisi bulunmuyor.
              </div>
            ) : (
              katilimciCevapRaporu.map((row, idx) => {
                const k = row.katilimci;

                return (
                  <div
                    key={getKatilimciId(k) ?? idx}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/30"
                  >
                    <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {getAdSoyad(k)}
                        </div>
                        <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                          {getTelefon(k)} 
                        </div>
                      </div>

                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Katılım: {formatDateTR(getKatilimTarihi(k))}
                      </div>
                    </div>

                    <div className="mt-2 overflow-x-auto">
                      <table className="min-w-full border-separate border-spacing-y-1">
                        <thead>
                          <tr>
                            <th className="w-[48px] px-2 py-1 text-left text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                              No
                            </th>
                            <th className="px-2 py-1 text-left text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                              Soru
                            </th>
                            <th className="w-[120px] px-2 py-1 text-left text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                              Tip
                            </th>
                            <th className="px-2 py-1 text-left text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                              Verilen Cevap
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {row.cevaplar.map((c, cidx) => (
                            <tr key={`${c.soruId}-${cidx}`}>
                              <td className="rounded-l-md border-y border-l border-zinc-200 bg-white px-2 py-1.5 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                                {cidx + 1}
                              </td>
                              <td className="border-y border-zinc-200 bg-white px-2 py-1.5 text-[12px] font-medium text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                                {c.soruBaslik}
                              </td>
                              <td className="border-y border-zinc-200 bg-white px-2 py-1.5 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                                {getSoruTipLabel(c.soruTipi)}
                              </td>
                              <td className="rounded-r-md border-y border-r border-zinc-200 bg-white px-2 py-1.5 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                                <span className="whitespace-pre-wrap">
                                  {c.cevap}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-base font-bold">Katılımcı Özeti</div>
          

          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-1">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    Ad Soyad
                  </th>
                  <th className="px-2 py-1 text-left text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    Telefon
                  </th>
                  <th className="px-2 py-1 text-left text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    Eposta
                  </th>
                  <th className="px-2 py-1 text-left text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    Cevap
                  </th>
                  <th className="px-2 py-1 text-left text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    Katılım
                  </th>
                </tr>
              </thead>
              <tbody>
                {katilimcilar.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300"
                    >
                      Katılımcı verisi bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  katilimcilar.map((k, idx) => (
                    <tr key={getKatilimciId(k) ?? idx}>
                      <td className="rounded-l-md border-y border-l border-zinc-200 bg-zinc-50 px-2 py-1.5 text-[12px] font-bold text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-100">
                        {getAdSoyad(k)}
                      </td>
                      <td className="border-y border-zinc-200 bg-zinc-50 px-2 py-1.5 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-200">
                        {getTelefon(k)}
                      </td>
                      <td className="border-y border-zinc-200 bg-zinc-50 px-2 py-1.5 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-200">
                        {getEposta(k)}
                      </td>
                      <td className="border-y border-zinc-200 bg-zinc-50 px-2 py-1.5 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-200">
                        {pick(k, "cevapSayisi", "CevapSayisi") ?? 0}
                      </td>
                      <td className="rounded-r-md border-y border-r border-zinc-200 bg-zinc-50 px-2 py-1.5 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-200">
                        {formatDateTR(getKatilimTarihi(k))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 border-t border-zinc-200 pt-2 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          SAYGILARIMIZLA, <span className="font-semibold">EOS MANAGEMENT</span>
        </div>
      </div>
    </div>
  );
}