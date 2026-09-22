import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";

import IsEmriEslemeDrawer from "@/components/satinalma/IsEmriEslemeDrawer";
import IsEmriDetayDrawer from "@/components/satinalma/IsEmriDetayDrawer";

function formatTR(iso) {
  if (!iso) return "-";

  try {
    const d = new Date(iso);

    // Türkiye UTC+3 düzeltmesi
    d.setHours(d.getHours() + 3);

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

function safeText(v) {
  if (v === null || v === undefined) return "-";

  const s = String(v).trim();

  return s.length ? s : "-";
}

function extractBackendMsg(err) {
  const data = err?.response?.data;

  if (!data) return null;

  if (typeof data === "string") {
    return data;
  }

  return (
    data?.message ||
    data?.Message ||
    data?.error ||
    data?.Error ||
    null
  );
}

export default function SatinalmaHeaderCard({
  seriNo,
  tarih,
  talepCinsi,
  site,
  talepEden,
  aciklama,
  id,

  // Teknik Açıklama (Not_4)
  teknikAciklama,
}) {
  const router = useRouter();

  // =====================================================
  // SATIN ALMA / İŞ EMRİ EŞLEME
  // =====================================================

  const [eslemeLoading, setEslemeLoading] =
    useState(false);

  const [eslemeError, setEslemeError] =
    useState("");

  const [esleme, setEsleme] =
    useState(null);

  // Eşleme drawer
  const [
    isEmriEslemeDrawerOpen,
    setIsEmriEslemeDrawerOpen,
  ] = useState(false);

  // İş emri detay drawer
  const [
    isEmriDetayDrawerOpen,
    setIsEmriDetayDrawerOpen,
  ] = useState(false);

  const [
    selectedIsEmriId,
    setSelectedIsEmriId,
  ] = useState(null);

  // =====================================================
  // NORMAL BİLGİLER
  // =====================================================

  const talepEdenAd = talepEden
    ? `${talepEden.ad ?? talepEden.Ad ?? ""} ${
        talepEden.soyad ?? talepEden.Soyad ?? ""
      }`.trim()
    : "";

  const siteAd = site
    ? site.ad ?? site.Ad ?? ""
    : "";

  // =====================================================
  // MEVCUT EŞLEME GET
  // =====================================================

  const loadIsEmriEsleme =
    useCallback(async () => {
      if (!id) {
        setEsleme(null);
        return;
      }

      try {
        setEslemeLoading(true);
        setEslemeError("");

        const res =
          await getDataAsync(
            `satinalma-is-emri-esleme/satinalma/${id}`
          );

        const eslemeVar =
          res?.eslemeVar ??
          res?.EslemeVar ??
          false;

        const mevcutEsleme =
          res?.esleme ??
          res?.Esleme ??
          null;

        if (eslemeVar && mevcutEsleme) {
          setEsleme(mevcutEsleme);
        } else {
          setEsleme(null);
        }
      } catch (err) {
        console.error(
          "Satın alma iş emri eşleme bilgisi alınamadı:",
          err
        );

        console.error(
          "BACKEND RESPONSE:",
          err?.response?.data
        );

        setEsleme(null);

        setEslemeError(
          extractBackendMsg(err) ||
            err?.message ||
            "İş emri eşleme bilgisi alınamadı."
        );
      } finally {
        setEslemeLoading(false);
      }
    }, [id]);

  useEffect(() => {
    loadIsEmriEsleme();
  }, [loadIsEmriEsleme]);

  // =====================================================
  // EŞLENMİŞ İŞ EMRİ
  // =====================================================

  const eslenenIsEmri =
    esleme?.isEmri ??
    esleme?.IsEmri ??
    null;

  const eslenenIsEmriId =
    eslenenIsEmri?.id ??
    eslenenIsEmri?.Id ??
    esleme?.isEmriId ??
    esleme?.IsEmriId ??
    null;

  const eslenenIsEmriKod =
    eslenenIsEmri?.kod ??
    eslenenIsEmri?.Kod ??
    "";

  const eslenenIsEmriBaslik =
    eslenenIsEmri?.kisaBaslik ??
    eslenenIsEmri?.KisaBaslik ??
    "";

  const eslenenIsEmriDurum =
    eslenenIsEmri?.durumAd ??
    eslenenIsEmri?.DurumAd ??
    "";

  // =====================================================
  // HIZLI İŞ EMRİ OLUŞTUR
  // =====================================================

  const handleNewIsEmri = () => {
    window.open(
      "/teknikIsEmriEkle",
      "_blank",
      "noopener,noreferrer"
    );
  };

  // =====================================================
  // İŞ EMRİ EŞLE DRAWER AÇ
  // =====================================================

  const handleOpenEsleme = () => {
    if (!id) return;

    setIsEmriEslemeDrawerOpen(true);
  };

  // =====================================================
  // İŞ EMRİ DETAY DRAWER AÇ
  // =====================================================

  const handleOpenIsEmriDetay = () => {
    if (!eslenenIsEmriId) return;

    setSelectedIsEmriId(
      eslenenIsEmriId
    );

    setIsEmriDetayDrawerOpen(true);
  };

  // =====================================================
  // EŞLEME BAŞARILI OLDUĞUNDA
  // Drawer componentinden çağıracağız.
  // =====================================================

  const handleEslemeSuccess =
    async () => {
      setIsEmriEslemeDrawerOpen(
        false
      );

      await loadIsEmriEsleme();
    };

  return (
    <>
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-[12px] leading-relaxed shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

        {/* ==================================================
            ÜST BAŞLIK
        ================================================== */}

        <div className="mb-3 flex items-center justify-evenly gap-2">

          <div className="text-[12px] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            {id}. Talep Bilgileri
          </div>

          {siteAd ? (
            <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-extrabold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              Proje : {safeText(siteAd)}
            </span>
          ) : null}
        </div>

        {/* ==================================================
            SATIRLAR
        ================================================== */}

        <div className="space-y-1.5">

          <div>
            <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
              Tarih:
            </span>{" "}

            <span className="text-zinc-900 dark:text-zinc-100">
              {formatTR(tarih)}
            </span>
          </div>

          <div>
            <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
              Talep Cinsi:
            </span>{" "}

            <span className="text-zinc-900 dark:text-zinc-100">
              {safeText(talepCinsi)}
            </span>
          </div>

          <div>
            <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
              Talep Eden:
            </span>{" "}

            <span className="text-zinc-900 dark:text-zinc-100">
              {safeText(talepEdenAd)}
            </span>
          </div>

          <div>
            <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
              Talep Açıklama:
            </span>{" "}

            <span className="text-zinc-900 dark:text-zinc-100">
              {safeText(aciklama)}
            </span>
          </div>
        </div>

        {/* ==================================================
            TEKNİK AÇIKLAMA
        ================================================== */}

        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">

          <div className="flex flex-wrap items-center justify-between gap-2">

            <div className="flex items-center gap-2">
              <div className="text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100">
                Teknik Açıklama
              </div>
            </div>

            <button
              type="button"
              onClick={handleNewIsEmri}
              className="group inline-flex h-5 cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-1 text-[10px] font-extrabold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
              title="Hızlı iş emri oluştur"
            >
              <svg
                className="h-3.5 w-3.5 text-white/90"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>

              Hızlı İş Emri Oluştur
            </button>
          </div>

          <div className="mt-2 whitespace-pre-wrap break-words rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[12px] text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
            {safeText(teknikAciklama)}
          </div>
        </div>

        {/* ==================================================
            GÖREVLENDİRME / İŞ EMRİ EŞLEME
        ================================================== */}

        <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">

          {/* BAŞLIK */}

          <div className="flex flex-wrap items-center justify-between gap-2">

            <div>
              <div className="text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100">
                Görevlendirme
              </div>

              
            </div>

            {/* EŞLEME YOKSA */}

            {!eslemeLoading &&
            !esleme ? (
              <button
                type="button"
                onClick={handleOpenEsleme}
                className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg bg-zinc-900 px-2.5 text-[10px] font-extrabold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>

                İş Emri Eşle
              </button>
            ) : null}

            {/* EŞLEME VARSA DEĞİŞTİR */}

            {!eslemeLoading &&
            esleme ? (
              <button
                type="button"
                onClick={handleOpenEsleme}
                className="inline-flex h-7 cursor-pointer items-center rounded-lg border border-zinc-200 bg-white px-2.5 text-[9px] font-extrabold text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Eşlemeyi Değiştir
              </button>
            ) : null}
          </div>

          {/* ================================================
              LOADING
          ================================================ */}

          {eslemeLoading ? (
            <div className="mt-3 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-[10px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              İş emri eşleme bilgisi kontrol ediliyor...
            </div>
          ) : null}

          {/* ================================================
              ERROR
          ================================================ */}

          {!eslemeLoading &&
          eslemeError ? (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {eslemeError}
            </div>
          ) : null}

          {/* ================================================
              EŞLEME YOK
          ================================================ */}

          {!eslemeLoading &&
          !esleme &&
          !eslemeError ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-3 dark:border-zinc-700 dark:bg-zinc-900">

              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm text-zinc-400 dark:bg-zinc-800">
                ○
              </div>

              <div>
                <div className="text-[10px] font-extrabold text-zinc-700 dark:text-zinc-300">
                  İş Emri Eşlenmedi
                </div>

                <div className="mt-0.5 text-[9px] text-zinc-400">
                  Bu satın alma için henüz teknik görevlendirme bulunmuyor.
                </div>
              </div>
            </div>
          ) : null}

          {/* ================================================
              EŞLEME VAR
          ================================================ */}

          {!eslemeLoading &&
          esleme ? (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">

              <div className="flex items-start gap-3">

                {/* CHECK */}

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  ✓
                </div>

                {/* CONTENT */}

                <div className="min-w-0 flex-1">

                  <div className="text-[9px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    Görevlendirme Var
                  </div>

                  {/* İŞ EMRİ KODU */}

                  <button
                    type="button"
                    onClick={
                      handleOpenIsEmriDetay
                    }
                    className="mt-1 inline-flex cursor-pointer items-center gap-1.5 text-left text-[13px] font-black text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition hover:text-emerald-700 dark:text-zinc-100 dark:decoration-zinc-600 dark:hover:text-emerald-400"
                    title="İş emri detaylarını görüntüle"
                  >
                    {safeText(
                      eslenenIsEmriKod
                    )}

                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>

                  {/* BAŞLIK */}

                  {eslenenIsEmriBaslik ? (
                    <div className="mt-1 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
                      {eslenenIsEmriBaslik}
                    </div>
                  ) : null}

                  {/* DURUM */}

                  {eslenenIsEmriDurum ? (
                    <div className="mt-2">
                      <span className="inline-flex rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:border-emerald-900 dark:bg-zinc-900 dark:text-emerald-300">
                        {eslenenIsEmriDurum}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ====================================================
          İŞ EMRİ EŞLEME DRAWER

          Bir sonraki adımda componenti oluşturduğumuzda
          aşağıdaki bloğu aktif edeceğiz.
      ==================================================== */}

     
      <IsEmriEslemeDrawer
        open={isEmriEslemeDrawerOpen}
        satinAlmaId={id}
        site={site}
        mevcutEsleme={esleme}
        onClose={() =>
          setIsEmriEslemeDrawerOpen(false)
        }
        onSuccess={
          handleEslemeSuccess
        }
      />
      

      {/* ====================================================
          İŞ EMRİ DETAY DRAWER

          Bir sonraki adımda componenti oluşturduğumuzda
          aşağıdaki bloğu aktif edeceğiz.
      ==================================================== */}

      
      <IsEmriDetayDrawer
        open={isEmriDetayDrawerOpen}
        isEmriId={selectedIsEmriId}
        onClose={() => {
          setIsEmriDetayDrawerOpen(false);
          setSelectedIsEmriId(null);
        }}
      />
    
    </>
  );
}