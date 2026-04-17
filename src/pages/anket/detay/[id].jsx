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

function boolText(v) {
  return v ? "Evet" : "Hayır";
}

export default function AnketDetayPage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [anket, setAnket] = useState(null);
  const [sorular, setSorular] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!router.isReady || !id) return;

    let cancelled = false;

    const loadDetail = async () => {
      try {
        setLoading(true);
        setMsg("");
        setCopied(false);

        const res = await getDataAsync(`anket/${id}`);
        if (cancelled) return;

        const a = res?.anket ?? res ?? null;
        const s = Array.isArray(res?.sorular)
          ? res.sorular
          : Array.isArray(a?.sorular)
          ? a.sorular
          : [];

        setAnket(a);
        setSorular(
          [...s].sort((x, y) => Number(x?.siraNo ?? 0) - Number(y?.siraNo ?? 0))
        );
      } catch (e) {
        console.error("ANKET DETAIL LOAD ERROR:", e);
        if (cancelled) return;

        const backendMsg = extractBackendMsg(e);
        setMsg(
          backendMsg
            ? `Anket detayı alınamadı: ${backendMsg}`
            : "Anket detayı alınamadı."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, id]);

  const publicGuid = useMemo(() => {
    return (
      anket?.guidLink ??
      anket?.GuidLink ??
      anket?.publicToken ??
      anket?.PublicToken ??
      null
    );
  }, [anket]);

  const publicLink = useMemo(() => {
    if (!publicGuid) return "";
    return `https://eosyonetim.tr/anketCevap/${publicGuid}`;
  }, [publicGuid]);

  const siteAd = useMemo(() => {
    return (
      anket?.siteAd ??
      anket?.SiteAd ??
      anket?.siteAdi ??
      anket?.SiteAdi ??
      "-"
    );
  }, [anket]);

  const soruCount = useMemo(() => sorular.length, [sorular]);

  const secimliSoruCount = useMemo(
    () => sorular.filter((x) => Number(x?.soruTipi) === 1 || Number(x?.soruTipi) === 2).length,
    [sorular]
  );

  const acikUcSoruCount = useMemo(
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

  const handleCopyLink = async () => {
    if (!publicLink) return;
    try {
      const full =
        typeof window !== "undefined"
          ? `${window.location.origin}${publicLink}`
          : publicLink;

      await navigator.clipboard.writeText(full);
      setCopied(true);
      setMsg("");
    } catch (e) {
      console.error("COPY LINK ERROR:", e);
      setMsg("Link kopyalanamadı.");
    }
  };

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
                Anket Yönetimi • Detay
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
                Anket Yönetimi • Detay
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900 dark:bg-zinc-900">
            <div className="text-base font-semibold text-red-700 dark:text-red-300">
              Anket detayı açılamadı
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
                Anket Yönetimi • Anket Detayı
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

        {copied && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-100">
            Link panoya kopyalandı.
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="text-lg font-semibold tracking-tight">
                {anket?.baslik ?? "-"}
              </div>
              
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Site:{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {siteAd}
                </span>
              </span>

              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Soru:{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {soruCount}
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
                  Durum Özeti
                </div>

                <div className="space-y-2 text-[13px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-500 dark:text-zinc-400">Aktif</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-100">
                      {boolText(anket?.aktifMi ?? anket?.AktifMi)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Yayında
                    </span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-100">
                      {boolText(anket?.yayinlandiMi ?? anket?.YayinlandiMi)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Tekrar Cevap
                    </span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-100">
                      {boolText(
                        anket?.tekrarCevaplanabilirMi ??
                          anket?.TekrarCevaplanabilirMi
                      )}
                    </span>
                  </div>

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

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
                <div className="mb-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  Yayın / Cevaplama Linki
                </div>
                <div className="break-all rounded-xl border border-emerald-200 bg-white px-3 py-3 text-[13px] text-zinc-800 dark:border-emerald-900 dark:bg-zinc-950 dark:text-zinc-100">
                  {publicLink || "-"}
                </div>
              </div>
            </div>

            <div className="xl:col-span-4">
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  disabled={!publicLink}
                  className="rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  Linki Kopyala
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!publicLink) return;
                    window.open(publicLink, "_blank", "noopener,noreferrer");
                  }}
                  disabled={!publicLink}
                  className="rounded-md bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Cevap Sayfasını Aç
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/anket/yeni")}
                  className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                >
                  Yeni Anket Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Toplam Soru
            </div>
            <div className="mt-2 text-2xl font-bold">{soruCount}</div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Seçimli Soru
            </div>
            <div className="mt-2 text-2xl font-bold">{secimliSoruCount}</div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Açık / Diğer
            </div>
            <div className="mt-2 text-2xl font-bold">{acikUcSoruCount}</div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Anket No
            </div>
            <div className="mt-2 text-2xl font-bold">{anket?.id ?? anket?.Id ?? "-"}</div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {sorular.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Bu ankette henüz soru görünmüyor.
            </div>
          ) : (
            sorular.map((soru, index) => {
              const secenekler = Array.isArray(soru?.secenekler)
                ? [...soru.secenekler].sort(
                    (a, b) => Number(a?.siraNo ?? 0) - Number(b?.siraNo ?? 0)
                  )
                : [];

              return (
                <div
                  key={soru?.id ?? `${index}`}
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

                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                          soru?.zorunluMu
                            ? "border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300"
                            : "border border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                        }`}
                      >
                        {soru?.zorunluMu ? "Zorunlu" : "Opsiyonel"}
                      </span>
                    </div>
                  </div>

                  {(Number(soru?.soruTipi) === 1 || Number(soru?.soruTipi) === 2) && (
                    <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        {soru?.minSecimSayisi ? (
                          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                            Min: {soru.minSecimSayisi}
                          </span>
                        ) : null}

                        {soru?.maxSecimSayisi ? (
                          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                            Max: {soru.maxSecimSayisi}
                          </span>
                        ) : null}

                        <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                          Seçenek: {secenekler.length}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {secenekler.length === 0 ? (
                          <div className="text-[12px] text-zinc-500 dark:text-zinc-400">
                            Seçenek bulunmuyor.
                          </div>
                        ) : (
                          secenekler.map((secenek, optIndex) => (
                            <div
                              key={secenek?.id ?? `${optIndex}`}
                              className="rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                            >
                              {optIndex + 1}. {secenek?.secenekMetni ?? "-"}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {(Number(soru?.soruTipi) === 3 || Number(soru?.soruTipi) === 4) && (
                    <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-200">
                      Bu soru metin tabanlıdır.
                      {soru?.maxMetinUzunlugu ? (
                        <span className="ml-2 text-[12px] text-zinc-500 dark:text-zinc-400">
                          Maksimum karakter: {soru.maxMetinUzunlugu}
                        </span>
                      ) : null}
                    </div>
                  )}

                  {Number(soru?.soruTipi) === 5 && (
                    <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-200">
                      Bu soru sayısal giriş tipindedir.
                    </div>
                  )}

                  {Number(soru?.soruTipi) === 6 && (
                    <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-200">
                      Bu soru tarih seçimi tipindedir.
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 border-t border-zinc-200 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          SAYGILARIMIZLA, <span className="font-semibold">EOS MANAGEMENT</span>
        </div>
      </div>
    </div>
  );
}