



//pages/teknik/isEmriDetay/[id].jsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { getDataAsync } from "../../../utils/apiService";

import BelgeFotoModals from "../../../components/BelgeFotoModals";
import PersonelDuzenleModals from "../../../components/PersonelDuzenleModals";
import NotEkleModals from "../../../components/NotEkleModals";
import MalzemeEkleModals from "../../../components/MalzemeEkleModals";
import IsEmriDurumGuncelleModals from "../../../components/IsEmriDurumGuncelleModals";

import IsEmriDetayHeader from "../../../components/isEmriDetay/IsEmriDetayHeader";
import IsEmriDetayTopGrid from "../../../components/isEmriDetay/IsEmriDetayTopGrid";
import IsEmriDetayNotlar from "../../../components/isEmriDetay/IsEmriDetayNotlar";
import IsEmriDetayDosyalar from "../../../components/isEmriDetay/IsEmriDetayDosyalar";
import IsEmriDetayPersoneller from "../../../components/isEmriDetay/IsEmriDetayPersoneller";
import IsEmriDetayMalzemeler from "../../../components/isEmriDetay/IsEmriDetayMalzemeler";
import IsEmriDetaySurecDurumlari from "@/components/isEmriDetay/IsEmriDetaySurecDurumlari";

// ✅ cookie okuma helper (client-side)
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((p) => p.trim());
  const found = parts.find((p) => p.startsWith(`${name}=`));
  if (!found) return null;
  return decodeURIComponent(found.split("=").slice(1).join("="));
}

export default function IsEmriDetayPage() {
  const router = useRouter();
  const { id } = router.query;

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // KDV toggle
  const [kdvIncluded, setKdvIncluded] = useState(true);

  // ✅ PersonelId (durum güncelle butonu için)
  const [currentPersonelId, setCurrentPersonelId] = useState(null);

  // ✅ Durum/Progress
  const [localDurumKod, setLocalDurumKod] = useState(0);

  // Modals
  const [isBelgeModalOpen, setIsBelgeModalOpen] = useState(false);
  const [isPersonelModalOpen, setIsPersonelModalOpen] = useState(false);
  const [isNotModalOpen, setIsNotModalOpen] = useState(false);
  const [isMalzemeModalOpen, setIsMalzemeModalOpen] = useState(false);

  // ✅ Durum güncelle modal
  const [isDurumModalOpen, setIsDurumModalOpen] = useState(false);

  // ✅ Cookie’den currentPersonelId çek
  useEffect(() => {
    try {
      const raw = getCookie("PersonelUserInfo");
      if (!raw) return;
      const obj = JSON.parse(raw);
      const pid = obj?.id ?? obj?.Id ?? null;
      if (pid) setCurrentPersonelId(Number(pid));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getDataAsync(`is-emirleri/${id}`);
        setRecord(data || null);

        // ✅ ilk yüklemede durumKod'u localDurumKod'a al
        const rawDurumKod =
          data?.durumKod ??
          data?.DurumKod ??
          data?.emirleriDurumuKod ??
          data?.EmirleriDurumuKod ??
          data?.emirleriDurumu ??
          0;

        setLocalDurumKod(Number(rawDurumKod) || 0);
      } catch (err) {
        console.error("İş emri detay yüklenirken hata:", err);
        setError(err?.message || "İş emri detayları alınırken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // ✅ progress (0-100)
  const progress = useMemo(() => {
    return Math.max(0, Math.min(100, Number(localDurumKod) || 0));
  }, [localDurumKod]);

  // ✅ progress renkleri
  const progressClass = useMemo(() => {
    if (progress < 30) return "bg-red-500";
    if (progress < 75) return "bg-amber-500";
    return "bg-emerald-500";
  }, [progress]);

  const handleDurumUpdated = (newKod) => {
    setLocalDurumKod(Number(newKod) || 0);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
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
          <div className="mb-1 font-semibold">Hata</div>
          <div>{error || "İş emri bulunamadı."}</div>
        </div>
      </div>
    );
  }

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

  return (
    <div
      className="
        min-h-screen bg-zinc-50 text-xs text-zinc-800
        dark:bg-zinc-950 dark:text-zinc-100
        print:bg-white
      "
    >
      {/* ✅ ÜST BAR (MOBİL FULL WIDTH, SADECE PROGRESS + BUTON) */}
      <div className="sticky top-0 z-40 border-b border-zinc-200 bg-zinc-50/95 px-3 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85 print:hidden">
        <div className="mx-auto w-full max-w-6xl">
          {/* Progress satırı */}
          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full items-center justify-between">
              <div className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                %{progress}
              </div>

              {currentPersonelId ? (
                <button
                  type="button"
                  onClick={() => setIsDurumModalOpen(true)}
                  className="
                    rounded-full border border-zinc-300 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-700
                    hover:bg-zinc-100
                    dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800
                  "
                >
                  İş Durumunu Güncelle
                </button>
              ) : (
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400" />
              )}
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className={`h-full rounded-full ${progressClass}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* İstersen butonların durduğu mini satır (mobilde taşma olmaz) */}
            <div className="flex w-full items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (window.history.length > 1) {
                    router.back();
                  } else {
                    router.push("/");
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-200 px-3 py-1.5 text-[11px] font-semibold text-zinc-900 transition hover:bg-zinc-300 
               dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
              >
                {/* Sol Ok İkon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Geri
              </button>

              {/* Ana Sayfa Butonu */}
              <button
                type="button"
                onClick={() => router.push("/")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-200 px-3 py-1.5 text-[11px] font-semibold text-zinc-900 transition hover:bg-zinc-300 
               dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
              >
                {/* Home İkon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 10l9-7 9 7"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 21V12h6v9"
                  />
                </svg>
                Ana Sayfa
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-200 px-3 py-1.5 text-[11px] font-semibold text-zinc-900 transition hover:bg-zinc-300 
               dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
              >
                Yazdır
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Sayfa içerik padding: mobilde taşma/zoom hissi olmasın */}
      <div className="px-3 py-3">
        {/* ANA KART */}
        <div className="mx-auto w-full max-w-6xl rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 print:shadow-none print:border-0 print:rounded-none print:p-0">
          <IsEmriDetayHeader
            kod={kod}
            kod_2={kod_2}
            kod_3={kod_3}
            kisaBaslik={kisaBaslik}
            durumAd={durumAd}
            durumKod={durumKod}
            olusturmaTarihiUtc={olusturmaTarihiUtc}
            onayTarihiUtc={onayTarihiUtc}
            baslamaTarihiUtc={baslamaTarihiUtc}
            bitisTarihiUtc={bitisTarihiUtc}
          />

          <IsEmriDetayTopGrid
            site={site}
            apt={apt}
            ev={ev}
            konum={konum}
            evSahibi={evSahibi}
            kiraci={kiraci}
            aciklama={aciklama}
            aciklama_2={aciklama_2}
          />
          <IsEmriDetaySurecDurumlari record={record} />

          {/* ALT GRID */}
          <section className="mt-3 grid gap-3 lg:grid-cols-[1.7fr,1.3fr]">
            <IsEmriDetayNotlar
              notlar={notlar}
              onAddNote={() => setIsNotModalOpen(true)}
            />

            <div className="space-y-3">
              <IsEmriDetayDosyalar
                dosyalar={dosyalar}
                onAddFile={() => setIsBelgeModalOpen(true)}
              />
              <IsEmriDetayPersoneller
                personeller={personeller}
                onEdit={() => setIsPersonelModalOpen(true)}
              />
              <IsEmriDetayMalzemeler
                malzemeler={malzemeler}
                kdvIncluded={kdvIncluded}
                onToggleKdv={() => setKdvIncluded((v) => !v)}
                onAddMalzeme={() => setIsMalzemeModalOpen(true)}
              />
            </div>
          </section>
        </div>
      </div>

      {/* MODALLAR */}
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

      {/* ✅ DURUM GÜNCELLE MODALI */}
      <IsEmriDurumGuncelleModals
        isOpen={isDurumModalOpen}
        onClose={() => setIsDurumModalOpen(false)}
        isEmriId={isEmriId}
        isEmriKod={kod}
        currentDurumKod={localDurumKod}
        personelId={currentPersonelId}
        onUpdated={handleDurumUpdated}
      />
    </div>
  );
}
