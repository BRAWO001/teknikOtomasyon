import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { getDataAsync } from "../../../utils/apiService";
import { getCookie as getClientCookie } from "../../../utils/cookieService";

import PeyzajIsEmriDetayPublicKontrol from "../../../components/peyzajIsEmriDetay/PeyzajIsEmriDetayPublicKontrol";
import PeyzajIsEmriDetaySurecDurumlari from "../../../components/peyzajIsEmriDetay/PeyzajIsEmriDetaySurecDurumlari";
import PeyzajIsEmriDetayDosyalar from "../../../components/peyzajIsEmriDetay/PeyzajIsEmriDetayDosyalar";
import PeyzajIsEmriDetayYapilanIslemler from "../../../components/peyzajIsEmriDetay/PeyzajIsEmriDetayYapilanIslemler";
import PeyzajIsEmriDetayNotlar from "../../../components/peyzajIsEmriDetay/PeyzajIsEmriDetayNotlar";

import PeyzajYapilanIslemDuzenleModals from "../../../components/PeyzajYapilanIslemDuzenleModals";
import PeyzajNotEkleModals from "../../../components/PeyzajNotEkleModals";
import PeyzajIsEmriDurumGuncelleModals from "../../../components/PeyzajIsEmriDurumGuncelleModals";
import PeyzajBelgeFotoModals from "../../../components/PeyzajBelgeFotoModals";

function formatTR(date) {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleString("tr-TR");
  } catch {
    return "-";
  }
}

export default function PeyzajIsEmriDetayPage() {
  const router = useRouter();
  const { id } = router.query;

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [currentPersonelId, setCurrentPersonelId] = useState(null);

  const [isYapilanIslemModalOpen, setIsYapilanIslemModalOpen] = useState(false);
  const [isNotModalOpen, setIsNotModalOpen] = useState(false);
  const [isDurumModalOpen, setIsDurumModalOpen] = useState(false);
  const [isBelgeFotoModalOpen, setIsBelgeFotoModalOpen] = useState(false);

  const [copyMessage, setCopyMessage] = useState("");

  const savedWindowScrollYRef = useRef(0);

  useEffect(() => {
    try {
      const raw = getClientCookie("PersonelUserInfo");
      if (!raw) return;

      const obj = JSON.parse(raw);
      const personel = obj?.personel ?? obj;

      const pid =
        personel?.id ??
        personel?.Id ??
        obj?.id ??
        obj?.Id ??
        null;

      if (pid != null) setCurrentPersonelId(Number(pid));
    } catch {
      // ignore
    }
  }, []);

  const preservePageScroll = () => {
    if (typeof window === "undefined") return;
    savedWindowScrollYRef.current = window.scrollY || window.pageYOffset || 0;
  };

  const restorePageScroll = () => {
    if (typeof window === "undefined") return;
    const y = Number(savedWindowScrollYRef.current || 0);

    requestAnimationFrame(() => {
      window.scrollTo(0, y);
      requestAnimationFrame(() => {
        window.scrollTo(0, y);
      });
    });
  };

  const loadRecord = async (options = {}) => {
    const { preserveScroll = false, silent = false } = options;

    if (!id) return;

    if (preserveScroll) {
      preservePageScroll();
    }

    try {
      if (!silent || !record) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const data = await getDataAsync(`peyzaj-is-emri-formu/${id}`);
      setRecord(data || null);
    } catch (err) {
      console.error("Peyzaj iş emri detay yüklenirken hata:", err);
      setError(
        err?.message || "Peyzaj iş emri detayları alınırken bir hata oluştu."
      );
    } finally {
      if (!silent || !record) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }

      if (preserveScroll) {
        restorePageScroll();
      }
    }
  };

  useEffect(() => {
    if (!id) return;
    loadRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const progress = useMemo(() => {
    const value = record?.durumKod ?? record?.DurumKod ?? 0;
    return Math.max(0, Math.min(100, Number(value) || 0));
  }, [record]);

  const progressClass = useMemo(() => {
    if (progress < 30) return "bg-red-500";
    if (progress < 75) return "bg-amber-500";
    return "bg-emerald-500";
  }, [progress]);

  if (loading && !record) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-200">
        Peyzaj iş emri detayları yükleniyor...
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <div className="mb-1 font-semibold">Hata</div>
          <div>{error || "Peyzaj iş emri bulunamadı."}</div>
        </div>
      </div>
    );
  }

  const {
    id: peyzajIsEmriId,
    kod,
    kod_2,
    kod_3,
    kisaBaslik,
    aciklama,
    durumKod,
    durumAd,
    olusturmaTarihiUtc,
    bitisTarihiUtc,
    site,
    apt,
    publicAdi,
    publicSoyadi,
    publicTel,
    publicOnayDurumu,
    peyzajPublicTokenUrl,
    dosyalar = [],
    yapilanIslemler = [],
    notlar = [],
  } = record;

  const publicFullLink = peyzajPublicTokenUrl
    ? `https://eosyonetim.tr/peyzaj/public-kontrol/${peyzajPublicTokenUrl}`
    : "";

  const handleCopyPublicLink = async () => {
    if (!publicFullLink) return;

    try {
      await navigator.clipboard.writeText(publicFullLink);
      setCopyMessage("Link kopyalandı.");
      setTimeout(() => setCopyMessage(""), 1800);
    } catch (err) {
      console.error("Link kopyalanamadı:", err);
      setCopyMessage("Kopyalama başarısız.");
      setTimeout(() => setCopyMessage(""), 1800);
    }
  };

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

  return (
    <div className="min-h-screen bg-zinc-50 text-xs text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto w-full max-w-6xl px-3 py-2">
        <div className="border-b border-zinc-200 bg-zinc-50 px-0 py-2 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                  %{progress}
                </div>

                {refreshing ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200">
                    Güncelleniyor...
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Ana Sayfa
                </button>

                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Geri
                </button>

                {currentPersonelId ? (
                  <button
                    type="button"
                    onClick={() => setIsDurumModalOpen(true)}
                    className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    İş Durumunu Güncelle
                  </button>
                ) : null}
              </div>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className={`h-full rounded-full ${progressClass}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 py-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                <div>Oluşturma:</div>
                <div>{formatTR(olusturmaTarihiUtc)}</div>

                <div>Bitiş:</div>
                <div>{formatTR(bitisTarihiUtc)}</div>

                <div>Site:</div>
                <div>{site?.ad || "-"}</div>

                <div>Apartman:</div>
                <div>{apt?.ad || "-"}</div>
              </div>
            </header>

            {aciklama && (
              <div className="mt-3 rounded-xl bg-zinc-50 p-3 text-[12px] text-zinc-700 ring-1 ring-zinc-100 dark:bg-zinc-950/40 dark:text-zinc-200 dark:ring-zinc-800">
                {aciklama}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleCopyPublicLink}
              disabled={!publicFullLink}
              className="w-full rounded-xl border border-zinc-300 bg-emerald-100 px-3 py-2 text-[11px] font-semibold text-zinc-700 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-emerald-900 dark:text-zinc-200 dark:hover:bg-emerald-800"
              title={publicFullLink || "Public link bulunamadı"}
            >
              {publicFullLink ? "Linki Kopyala" : "Link Bulunamadı"}
            </button>

            {copyMessage && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                {copyMessage}
              </div>
            )}
          </div>

          <PeyzajIsEmriDetayPublicKontrol
            publicAdi={publicAdi}
            publicSoyadi={publicSoyadi}
            publicTel={publicTel}
            publicOnayDurumu={publicOnayDurumu}
            publicTokenUrl={peyzajPublicTokenUrl}
          />

          <PeyzajIsEmriDetaySurecDurumlari
            record={record}
            onUpdated={async () => {
              await loadRecord({ preserveScroll: true, silent: true });
            }}
          />

          <PeyzajIsEmriDetayYapilanIslemler
            yapilanIslemler={yapilanIslemler}
            onEdit={() => setIsYapilanIslemModalOpen(true)}
          />

          <PeyzajIsEmriDetayNotlar
            notlar={notlar}
            onAddNote={() => setIsNotModalOpen(true)}
          />

          <PeyzajIsEmriDetayDosyalar
            dosyalar={dosyalar}
            onAddFile={() => setIsBelgeFotoModalOpen(true)}
          />

          <PeyzajYapilanIslemDuzenleModals
            isOpen={isYapilanIslemModalOpen}
            onClose={() => setIsYapilanIslemModalOpen(false)}
            peyzajIsEmriId={peyzajIsEmriId}
            peyzajIsEmriKod={kod}
          />

          <PeyzajNotEkleModals
            isOpen={isNotModalOpen}
            onClose={() => setIsNotModalOpen(false)}
            isEmriId={peyzajIsEmriId}
            isEmriKod={kod}
          />

          <PeyzajIsEmriDurumGuncelleModals
            isOpen={isDurumModalOpen}
            onClose={() => setIsDurumModalOpen(false)}
            isEmriId={peyzajIsEmriId}
            isEmriKod={kod}
            currentDurumKod={Number(durumKod) || 0}
            personelId={currentPersonelId}
            onUpdated={async () => {
              await loadRecord({ preserveScroll: true, silent: true });
            }}
          />

          <PeyzajBelgeFotoModals
            isOpen={isBelgeFotoModalOpen}
            onClose={async () => {
              setIsBelgeFotoModalOpen(false);
              await loadRecord({ preserveScroll: true, silent: true });
            }}
            peyzajIsEmriId={peyzajIsEmriId}
            peyzajIsEmriKod={kod}
          />
        </div>
      </div>
    </div>
  );
}