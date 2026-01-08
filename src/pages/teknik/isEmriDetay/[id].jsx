




import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getDataAsync } from "../../../utils/apiService";

import BelgeFotoModals from "../../../components/BelgeFotoModals";
import PersonelDuzenleModals from "../../../components/PersonelDuzenleModals";
import NotEkleModals from "../../../components/NotEkleModals";
import MalzemeEkleModals from "../../../components/MalzemeEkleModals";

import IsEmriDetayHeader from "../../../components/isEmriDetay/IsEmriDetayHeader";
import IsEmriDetayTopGrid from "../../../components/isEmriDetay/IsEmriDetayTopGrid";
import IsEmriDetayNotlar from "../../../components/isEmriDetay/IsEmriDetayNotlar";
import IsEmriDetayDosyalar from "../../../components/isEmriDetay/IsEmriDetayDosyalar";
import IsEmriDetayPersoneller from "../../../components/isEmriDetay/IsEmriDetayPersoneller";
import IsEmriDetayMalzemeler from "../../../components/isEmriDetay/IsEmriDetayMalzemeler";

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

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
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
          <div className="font-semibold mb-1">Hata</div>
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
    <div className="min-h-screen bg-zinc-50 p-3 text-xs text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 print:bg-white print:p-0">
      {/* ÜST BAR */}
      <div className="mb-3 flex items-center justify-between gap-2 print:hidden">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Teknik İş Emri Detayı
          </div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {kod} — {kisaBaslik}
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          Ana Sayfa
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          Yazdır (A4)
        </button>
      </div>

      {/* ANA KART */}
      <div className="mx-auto max-w-6xl rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 print:shadow-none print:border-0 print:rounded-none print:p-0">
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
    </div>
  );
}
