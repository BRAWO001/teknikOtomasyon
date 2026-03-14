// pages/Duyuru/[token].jsx
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { getDataAsync } from "@/utils/apiService";

const TUR = {
  FOTO: 10,
  BELGE: 20,
};

function pick(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return safeText(value);

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function isImageUrl(url) {
  const s = String(url || "").toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"].some((x) =>
    s.includes(x)
  );
}

export default function DuyuruDetayPage() {
  const router = useRouter();
  const { token } = router.query;

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [duyuru, setDuyuru] = useState(null);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;
    if (!token) return;

    let cancelled = false;

    const loadDuyuru = async () => {
      try {
        setLoading(true);
        setErrorText("");

        const data = await getDataAsync(`IletisimDuyuru/public/${token}`);
        if (cancelled) return;

        setDuyuru(data || null);
      } catch (err) {
        console.error("DUYURU GET ERROR:", err);
        if (cancelled) return;

        setErrorText(
          err?.response?.data ||
            err?.message ||
            "Duyuru bilgisi alınırken bir hata oluştu."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDuyuru();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, token]);

  const site = useMemo(() => {
    return pick(duyuru, "Site", "site") || null;
  }, [duyuru]);

  const dosyalar = useMemo(() => {
    const list = pick(duyuru, "Dosyalar", "dosyalar");
    return Array.isArray(list) ? list : [];
  }, [duyuru]);

  const fotoList = useMemo(() => {
    return dosyalar.filter((d) => {
      const turKod = Number(pick(d, "TurKod", "turKod", "Tur", "tur"));
      const url = pick(d, "Url", "url");
      return turKod === TUR.FOTO || isImageUrl(url);
    });
  }, [dosyalar]);

  const belgeList = useMemo(() => {
    return dosyalar.filter((d) => {
      const turKod = Number(pick(d, "TurKod", "turKod", "Tur", "tur"));
      const url = pick(d, "Url", "url");
      return turKod === TUR.BELGE || !isImageUrl(url);
    });
  }, [dosyalar]);

  const duyuruBaslik = pick(duyuru, "DuyuruBaslik", "duyuruBaslik");
  const duyuruAciklama = pick(duyuru, "DuyuruAciklama", "duyuruAciklama");
  const tarihUtc = pick(duyuru, "TarihUtc", "tarihUtc");
  const durum = pick(duyuru, "Durum", "durum");
  const siteBazliNo = pick(duyuru, "SiteBazliNo", "siteBazliNo");
  const publicToken = pick(duyuru, "PublicToken", "publicToken");
  const siteName = safeText(pick(site, "Ad", "ad"));

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {activeImage && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-3 sm:p-5"
          onClick={() => setActiveImage(null)}
        >
          <div
            className="relative max-h-[95vh] max-w-[96vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveImage(null)}
              className="absolute right-2 top-2 z-10 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-900 shadow-md hover:bg-zinc-100"
            >
              Kapat
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage}
              alt="Duyuru görseli"
              className="max-h-[95vh] max-w-[96vw] rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-zinc-200">
              <Image
                src="/eos_management_logo.png"
                alt="EOS Management"
                width={160}
                height={44}
                priority
                className="h-8 w-auto object-contain sm:h-10"
              />
            </div>

            <div className="min-w-0">
              <div className="truncate text-sm font-bold tracking-wide text-zinc-900 dark:text-zinc-50">
                EOS MANAGEMENT
              </div>
              <div className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                Kurumsal Duyuru Detayı
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[12px] font-medium shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            ← Geri
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
        {loading ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-sm text-zinc-600 dark:text-zinc-300">
              Duyuru yükleniyor...
            </div>
          </div>
        ) : errorText ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm dark:border-red-900 dark:bg-red-950/30">
            <div className="text-sm font-semibold text-red-700 dark:text-red-200">
              Duyuru alınamadı
            </div>
            <div className="mt-2 text-sm text-red-600 dark:text-red-300">
              {safeText(errorText)}
            </div>
          </div>
        ) : !duyuru ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-sm text-zinc-600 dark:text-zinc-300">
              Duyuru bulunamadı.
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
            {/* Sol Alan */}
            <div className="space-y-4 sm:space-y-5">
              <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-white px-4 py-4 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900 sm:px-6">
                  <div className="flex flex-wrap items-center gap-2">
                    

                    
                  </div>

                  <h1 className="mt-3 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
                    {safeText(duyuruBaslik)}
                  </h1>

                  <div className="mt-3 flex flex-col gap-1 text-[12px] text-zinc-500 dark:text-zinc-400 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1">
                    <span>Tarih: {formatDate(tarihUtc)}</span>
                    <span>Site: {siteName}</span>
                    <span>Bu Duyuruda <strong>{fotoList.length}</strong> Görsel ve <strong>{belgeList.length}</strong> Belge Var.</span>
                    
                  </div>
                </div>

                <div className="px-4 py-4 sm:px-6 sm:py-5">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
                    <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Duyuru Açıklaması
                    </div>

                    <div className="whitespace-pre-wrap break-words text-[12px] leading-7 text-zinc-700 dark:text-zinc-200">
                      {safeText(duyuruAciklama)}
                    </div>
                  </div>
                </div>
              </section>

              {/* Görseller */}
              <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      Görseller
                    </div>
                    <div className="mt-1 text-[12px] text-zinc-500 dark:text-zinc-400">
                      Duyuruya ait yüklenmiş fotoğraflar.
                    </div>
                  </div>

                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    {fotoList.length} görsel
                  </span>
                </div>

                {fotoList.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                    Görsel bulunamadı.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {fotoList.map((f, index) => {
                      const id = pick(f, "Id", "id") ?? index;
                      const url = pick(f, "Url", "url");
                      const dosyaAdi =
                        pick(f, "DosyaAdi", "dosyaAdi") ||
                        `Görsel ${index + 1}`;

                      return (
                        <div
                          key={`${id}-${url}-${index}`}
                          className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                        >
                          <button
                            type="button"
                            onClick={() => setActiveImage(url)}
                            className="block w-full"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={dosyaAdi}
                              className="h-52 w-full object-cover transition duration-200 hover:scale-[1.015] sm:h-56"
                            />
                          </button>

                          <div className="space-y-2 p-3">
                            <div
                              className="truncate text-[12px] font-semibold text-zinc-800 dark:text-zinc-100"
                              title={dosyaAdi}
                            >
                              {dosyaAdi}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setActiveImage(url)}
                                className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-[11px] font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-200"
                              >
                                Görseli Büyüt
                              </button>

                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                              >
                                Yeni Sekmede Aç
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Belgeler */}
              <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      Belgeler
                    </div>
                    <div className="mt-1 text-[12px] text-zinc-500 dark:text-zinc-400">
                      PDF ve diğer belge dosyaları.
                    </div>
                  </div>

                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    {belgeList.length} belge
                  </span>
                </div>

                {belgeList.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                    Belge bulunamadı.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {belgeList.map((b, index) => {
                      const id = pick(b, "Id", "id") ?? index;
                      const url = pick(b, "Url", "url");
                      const dosyaAdi =
                        pick(b, "DosyaAdi", "dosyaAdi") ||
                        `Belge ${index + 1}`;
                      const sira = pick(b, "Sira", "sira");
                      const turAd = pick(b, "TurAd", "turAd");

                      return (
                        <div
                          key={`${id}-${url}-${index}`}
                          className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {dosyaAdi}
                            </div>

                            <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                              Tür: {safeText(turAd)} • Sıra: {safeText(sira)}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                            >
                              Belgeyi Aç
                            </a>

                            <a
                              href={url}
                              download
                              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                            >
                              İndir
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

          </div>
        )}

        <footer className="mt-8 border-t border-zinc-200 pt-3 text-center text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          SAYGILARIMIZLA, <span className="font-semibold">EOS MANAGEMENT</span>
        </footer>
      </main>
    </div>
  );
}