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

        setAnket(res?.anket ?? null);
        setSorular(Array.isArray(res?.sorular) ? res.sorular : []);
        setKatilimcilar(Array.isArray(res?.katilimcilar) ? res.katilimcilar : []);
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
    const guid =
      anket?.guidLink ??
      anket?.GuidLink ??
      anket?.publicToken ??
      anket?.PublicToken ??
      null;

    if (!guid) return "";
    return `/anketCevap/${guid}`;
  }, [anket]);

  const toplamKatilimci = useMemo(
    () =>
      Number(
        anket?.toplamKatilimci ??
          anket?.ToplamKatilimci ??
          katilimcilar?.length ??
          0
      ),
    [anket, katilimcilar]
  );

  const toplamSoru = useMemo(
    () =>
      Number(
        anket?.toplamSoru ??
          anket?.ToplamSoru ??
          sorular?.length ??
          0
      ),
    [anket, sorular]
  );

  const secimliSoruSayisi = useMemo(
    () =>
      sorular.filter(
        (x) => Number(x?.soruTipi) === 1 || Number(x?.soruTipi) === 2
      ).length,
    [sorular]
  );

  const metinSoruSayisi = useMemo(
    () =>
      sorular.filter(
        (x) =>
          Number(x?.soruTipi) === 3 ||
          Number(x?.soruTipi) === 4 ||
          Number(x?.soruTipi) === 5 ||
          Number(x?.soruTipi) === 6
      ).length,
    [sorular]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
            <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-zinc-200 dark:bg-white dark:ring-zinc-200">
              <Image
                src="/eos_management_logo.png"
                alt="EOS Management"
                width={160}
                height={44}
                priority
                className="h-10 w-auto object-contain"
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

        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-24 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-24 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (msg && !anket) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
            <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-zinc-200 dark:bg-white dark:ring-zinc-200">
              <Image
                src="/eos_management_logo.png"
                alt="EOS Management"
                width={160}
                height={44}
                priority
                className="h-10 w-auto object-contain"
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

        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900 dark:bg-zinc-900">
            <div className="text-base font-semibold text-red-700 dark:text-red-300">
              Rapor açılamadı
            </div>
            <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              {msg}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => router.reload()}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Tekrar Dene
              </button>
              <button
                type="button"
                onClick={() => router.push("/anket")}
                className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                Listeye Dön
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-zinc-200 dark:bg-white dark:ring-zinc-200">
              <Image
                src="/eos_management_logo.png"
                alt="EOS Management"
                width={160}
                height={44}
                priority
                className="h-10 w-auto object-contain"
              />
            </div>

            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-bold tracking-wide">
                EOS MANAGEMENT
              </div>
              <div className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                Anket Yönetimi • Rapor
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              ← Geri
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {msg && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
            {msg}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="text-lg font-semibold tracking-tight">
                {anket?.baslik ?? "-"}
              </div>
              <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                Katılımcı bazlı ve soru bazlı raporlama ekranı
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Site:{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {anket?.siteAd ?? anket?.SiteAd ?? "-"}
                </span>
              </span>

              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Yayında:{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {boolText(anket?.yayinlandiMi ?? anket?.YayinlandiMi)}
                </span>
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
                <div className="mb-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                  Anket Açıklaması
                </div>
                <div className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-100">
                  {anket?.aciklama?.trim() ? anket.aciklama : "-"}
                </div>
              </div>
            </div>

            <div className="xl:col-span-4">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
                <div className="mb-3 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                  Genel Bilgi
                </div>

                <div className="space-y-2 text-[13px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Oluşturma
                    </span>
                    <span className="font-medium text-right text-zinc-800 dark:text-zinc-100">
                      {formatDateTR(
                        anket?.olusturmaTarihiUtc ?? anket?.OlusturmaTarihiUtc
                      )}
                    </span>
                  </div>

                  
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Toplam Katılımcı
            </div>
            <div className="mt-2 text-2xl font-bold">{toplamKatilimci}</div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Toplam Soru
            </div>
            <div className="mt-2 text-2xl font-bold">{toplamSoru}</div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Seçimli Soru
            </div>
            <div className="mt-2 text-2xl font-bold">{secimliSoruSayisi}</div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Açık / Diğer
            </div>
            <div className="mt-2 text-2xl font-bold">{metinSoruSayisi}</div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {sorular.map((soru, index) => {
            const toplamCevaplayan = Number(
              soru?.toplamCevaplayan ?? soru?.ToplamCevaplayan ?? 0
            );
            const tip = Number(soru?.soruTipi);

            const secenekler = Array.isArray(soru?.secenekler) ? soru.secenekler : [];
            const metinCevaplar = Array.isArray(soru?.metinCevaplar)
              ? soru.metinCevaplar
              : [];
            const sayiCevaplar = Array.isArray(soru?.sayiCevaplar)
              ? soru.sayiCevaplar
              : [];
            const tarihCevaplar = Array.isArray(soru?.tarihCevaplar)
              ? soru.tarihCevaplar
              : [];

            return (
              <div
                key={soru?.id ?? index}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {index + 1}. {soru?.baslik ?? "-"}
                    </div>

                    {soru?.aciklama ? (
                      <div className="mt-1 text-[12px] text-zinc-600 dark:text-zinc-400">
                        {soru.aciklama}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                      {getSoruTipLabel(soru?.soruTipi)}
                    </span>

                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                      Cevaplayan: {toplamCevaplayan}
                    </span>
                  </div>
                </div>

                {(tip === 1 || tip === 2) && (
                  <div className="mt-4 space-y-3">
                    {secenekler.length === 0 ? (
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300">
                        Seçenek verisi bulunmuyor.
                      </div>
                    ) : (
                      secenekler.map((secenek) => {
                        const oySayisi = Number(
                          secenek?.oySayisi ?? secenek?.OySayisi ?? 0
                        );
                        const yuzde = percent(oySayisi, toplamCevaplayan || toplamKatilimci);

                        return (
                          <div
                            key={secenek?.id}
                            className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/30"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                                {secenek?.secenekMetni ?? "-"}
                              </div>
                              <div className="text-[12px] text-zinc-600 dark:text-zinc-300">
                                {oySayisi} oy • %{yuzde}
                              </div>
                            </div>

                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                              <div
                                className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                                style={{ width: `${yuzde}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {(tip === 3 || tip === 4) && (
                  <div className="mt-4 space-y-3">
                    {metinCevaplar.length === 0 ? (
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300">
                        Metin cevabı bulunmuyor.
                      </div>
                    ) : (
                      metinCevaplar.map((item, idx) => (
                        <div
                          key={item?.katilimciId ?? idx}
                          className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30"
                        >
                          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                              {item?.adSoyad ?? "-"}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {formatDateTR(item?.cevapTarihiUtc)}
                            </div>
                          </div>

                          <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-200">
                            {item?.cevap ?? "-"}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {tip === 5 && (
                  <div className="mt-4 space-y-3">
                    {sayiCevaplar.length === 0 ? (
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300">
                        Sayısal cevap bulunmuyor.
                      </div>
                    ) : (
                      sayiCevaplar.map((item, idx) => (
                        <div
                          key={item?.katilimciId ?? idx}
                          className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/30"
                        >
                          <div>
                            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                              {item?.adSoyad ?? "-"}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {formatDateTR(item?.cevapTarihiUtc)}
                            </div>
                          </div>

                          <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            {item?.cevap ?? "-"}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {tip === 6 && (
                  <div className="mt-4 space-y-3">
                    {tarihCevaplar.length === 0 ? (
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300">
                        Tarih cevabı bulunmuyor.
                      </div>
                    ) : (
                      tarihCevaplar.map((item, idx) => (
                        <div
                          key={item?.katilimciId ?? idx}
                          className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/30"
                        >
                          <div>
                            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                              {item?.adSoyad ?? "-"}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {formatDateTR(item?.cevapTarihiUtc)}
                            </div>
                          </div>

                          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {item?.cevap ? formatDateTR(item.cevap) : "-"}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-base font-semibold">Katılımcılar</div>
          <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            Kim ne zaman cevap verdiğini takip etmek için özet liste
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Ad Soyad
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Telefon
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Eposta
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Cevap Sayısı
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Katılım
                  </th>
                </tr>
              </thead>
              <tbody>
                {katilimcilar.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300"
                    >
                      Katılımcı verisi bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  katilimcilar.map((k, idx) => (
                    <tr
                      key={k?.katilimciId ?? idx}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/30"
                    >
                      <td className="px-3 py-3 text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {k?.adSoyad ?? "-"}
                      </td>
                      <td className="px-3 py-3 text-sm text-zinc-700 dark:text-zinc-200">
                        {k?.telefon ?? "-"}
                      </td>
                      <td className="px-3 py-3 text-sm text-zinc-700 dark:text-zinc-200">
                        {k?.eposta ?? "-"}
                      </td>
                      <td className="px-3 py-3 text-sm text-zinc-700 dark:text-zinc-200">
                        {k?.cevapSayisi ?? 0}
                      </td>
                      <td className="px-3 py-3 text-sm text-zinc-700 dark:text-zinc-200">
                        {formatDateTR(k?.katilimTarihiUtc)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 border-t border-zinc-200 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          SAYGILARIMIZLA, <span className="font-semibold">EOS MANAGEMENT</span>
        </div>
      </div>
    </div>
  );
}