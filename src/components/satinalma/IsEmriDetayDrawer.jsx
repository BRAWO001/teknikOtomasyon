// src/components/satinalma/IsEmriDetayDrawer.jsx

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/router";

import {
  getDataAsync,
} from "@/utils/apiService";

// ======================================================
// SAFE TEXT
// ======================================================

function safeText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "-";
  }

  const text =
    String(value).trim();

  return text || "-";
}

// ======================================================
// TARİH
// ======================================================

function formatTR(iso) {
  if (!iso) return "-";

  try {
    const d = new Date(iso);

    // Türkiye UTC+3
    d.setHours(
      d.getHours() + 3
    );

    return d.toLocaleString(
      "tr-TR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  } catch {
    return "-";
  }
}

// ======================================================
// ERROR
// ======================================================

function extractBackendMsg(err) {
  const data =
    err?.response?.data;

  if (!data) {
    return null;
  }

  if (
    typeof data === "string"
  ) {
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

// ======================================================
// PERSONEL CARD
// ======================================================

function PersonelCard({
  item,
}) {
  const personel =
    item?.personel ??
    item?.Personel ??
    {};

  const ad =
    personel?.ad ??
    personel?.Ad ??
    "";

  const soyad =
    personel?.soyad ??
    personel?.Soyad ??
    "";

  const telefon =
    personel?.telefon ??
    personel?.Telefon ??
    "";

  const eposta =
    personel?.eposta ??
    personel?.Eposta ??
    "";

  const rol =
    item?.rolAd ??
    item?.RolAd ??
    "";

  const sira =
    item?.sira ??
    item?.Sira;

  const not =
    item?.not ??
    item?.Not ??
    "";

  const initials =
    `${
      ad?.charAt(0) || ""
    }${
      soyad?.charAt(0) || ""
    }`.toUpperCase();

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">

      <div className="flex items-start gap-3">

        {/* AVATAR */}

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-black text-white dark:bg-zinc-100 dark:text-zinc-900">
          {initials || "P"}
        </div>

        {/* PERSONEL */}

        <div className="min-w-0 flex-1">

          <div className="truncate text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
            {`${ad} ${soyad}`.trim() ||
              "Personel"}
          </div>

          {rol ? (
            <div className="mt-0.5 text-[9px] font-semibold text-zinc-500">
              {rol}
            </div>
          ) : null}

          {sira ? (
            <div className="mt-0.5 text-[9px] text-zinc-400">
              Görev sırası:{" "}
              {sira}
            </div>
          ) : null}
        </div>
      </div>

      {/* İLETİŞİM */}

      {telefon || eposta ? (
        <div className="mt-2 space-y-1 border-t border-zinc-100 pt-2 dark:border-zinc-800">

          {telefon ? (
            <div className="text-[9px] text-zinc-500">
              Tel: {telefon}
            </div>
          ) : null}

          {eposta ? (
            <div className="break-all text-[9px] text-zinc-500">
              {eposta}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* PERSONEL NOT */}

      {not ? (
        <div className="mt-2 rounded-lg bg-zinc-50 px-2 py-1.5 text-[9px] leading-4 text-zinc-500 dark:bg-zinc-950">
          {not}
        </div>
      ) : null}
    </div>
  );
}

// ======================================================
// COMPONENT
// ======================================================

export default function IsEmriDetayDrawer({
  open,
  isEmriId,
  onClose,
}) {
  const router =
    useRouter();

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ====================================================
  // İŞ EMRİ DETAY GET
  // ====================================================

  useEffect(() => {
    if (
      !open ||
      !isEmriId
    ) {
      return;
    }

    let cancelled =
      false;

    const loadDetail =
      async () => {
        try {
          setLoading(true);
          setError("");
          setData(null);

          const res =
            await getDataAsync(
              `satinalma-is-emri-esleme/is-emri/${isEmriId}`
            );

          if (!cancelled) {
            setData(res);
          }
        } catch (err) {
          console.error(
            "İş emri detay hata:",
            err
          );

          console.error(
            "BACKEND RESPONSE:",
            err?.response?.data
          );

          if (!cancelled) {
            setError(
              extractBackendMsg(
                err
              ) ||
                err?.message ||
                "İş emri detayları alınamadı."
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    isEmriId,
  ]);

  // ====================================================
  // ESC İLE KAPAT
  // ====================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (
      e
    ) => {
      if (
        e.key === "Escape"
      ) {
        onClose?.();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    open,
    onClose,
  ]);

  // ====================================================
  // BODY SCROLL KİLİTLE
  // ====================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    const oldOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        oldOverflow;
    };
  }, [open]);

  // ====================================================
  // İŞ EMRİ DETAY SAYFASINA GİT
  //
  // ÖRNEK:
  // /teknik/isEmriDetay/4324
  // ====================================================

  const handleGoToIsEmriDetay =
    () => {
      if (!isEmriId) {
        return;
      }

      router.push(
        `/teknik/isEmriDetay/${isEmriId}`
      );
    };

  if (!open) {
    return null;
  }

  // ====================================================
  // VALUES
  // ====================================================

  const kod =
    data?.kod ??
    data?.Kod;

  const kod2 =
    data?.kod_2 ??
    data?.Kod_2;

  const kod3 =
    data?.kod_3 ??
    data?.Kod_3;

  const baslik =
    data?.kisaBaslik ??
    data?.KisaBaslik;

  const aciklama =
    data?.aciklama ??
    data?.Aciklama;

  const aciklama2 =
    data?.aciklama_2 ??
    data?.Aciklama_2;

  const durum =
    data?.durumAd ??
    data?.DurumAd;

  const adres =
    data?.adresMetni ??
    data?.AdresMetni;

  const site =
    data?.site ??
    data?.Site ??
    {};

  const apt =
    data?.apt ??
    data?.Apt ??
    {};

  const siteAd =
    site?.ad ??
    site?.Ad;

  const aptAd =
    apt?.ad ??
    apt?.Ad;

  const personeller =
    data?.personeller ??
    data?.Personeller ??
    [];

  const notlar =
    data?.notlar ??
    data?.Notlar ??
    [];

  return (
    <div className="fixed inset-0 z-[110]">

      {/* ==================================================
          BACKDROP
      ================================================== */}

      <button
        type="button"
        aria-label="Kapat"
        onClick={() =>
          onClose?.()
        }
        className="absolute inset-0 h-full w-full cursor-default bg-black/40 backdrop-blur-[1px]"
      />

      {/* ==================================================
          DRAWER
      ================================================== */}

      <div className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-zinc-200 bg-zinc-50 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">

        {/* ================================================
            HEADER
        ================================================ */}

        <div className="shrink-0 border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">

          <div className="flex items-start justify-between gap-4">

            {/* SOL */}

            <div className="min-w-0">

              <div className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-zinc-400">
                TEKNİK İŞ EMRİ
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2">

                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                  {safeText(kod)}
                </h2>

                {durum ? (
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[9px] font-bold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                    {durum}
                  </span>
                ) : null}
              </div>

              {baslik ? (
                <div className="mt-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  {baslik}
                </div>
              ) : null}
            </div>

            {/* SAĞ BUTONLAR */}

            <div className="flex shrink-0 items-center gap-2">

              {/* DETAYA GİT */}

              <button
                type="button"
                onClick={
                  handleGoToIsEmriDetay
                }
                disabled={
                  !isEmriId
                }
                title="İş emri detay sayfasına git"
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-[10px] font-extrabold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <span>
                  Detaya Git
                </span>

                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 18l6-6-6-6"
                  />
                </svg>
              </button>

              {/* KAPAT */}

              <button
                type="button"
                onClick={() =>
                  onClose?.()
                }
                title="Kapat"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 text-sm font-bold text-zinc-500 transition hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* ================================================
            BODY
        ================================================ */}

        <div className="min-h-0 flex-1 overflow-y-auto p-4">

          {/* ==============================================
              LOADING
          ============================================== */}

          {loading ? (
            <div className="flex min-h-[350px] items-center justify-center">

              <div className="text-center">

                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100" />

                <div className="mt-3 text-[11px] font-semibold text-zinc-500">
                  İş emri detayları yükleniyor...
                </div>
              </div>
            </div>
          ) : null}

          {/* ==============================================
              ERROR
          ============================================== */}

          {!loading &&
          error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : null}

          {/* ==============================================
              CONTENT
          ============================================== */}

          {!loading &&
          !error &&
          data ? (
            <div className="space-y-4">

              {/* ==========================================
                  TEMEL BİLGİLER
              ========================================== */}

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">

                <div className="text-[10px] font-extrabold uppercase tracking-wide text-zinc-400">
                  İş Emri Bilgileri
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">

                  <div>
                    <div className="text-[9px] font-bold text-zinc-400">
                      İş Emri Kodu
                    </div>

                    <div className="mt-0.5 text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100">
                      {safeText(
                        kod
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] font-bold text-zinc-400">
                      Proje
                    </div>

                    <div className="mt-0.5 text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100">
                      {safeText(
                        siteAd
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] font-bold text-zinc-400">
                      Apartman
                    </div>

                    <div className="mt-0.5 text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100">
                      {safeText(
                        aptAd
                      )}
                    </div>
                  </div>

                  {kod2 ? (
                    <div>
                      <div className="text-[9px] font-bold text-zinc-400">
                        Kod 2
                      </div>

                      <div className="mt-0.5 text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100">
                        {kod2}
                      </div>
                    </div>
                  ) : null}

                  {kod3 ? (
                    <div>
                      <div className="text-[9px] font-bold text-zinc-400">
                        Kod 3
                      </div>

                      <div className="mt-0.5 text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100">
                        {kod3}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <div className="text-[9px] font-bold text-zinc-400">
                      Durum
                    </div>

                    <div className="mt-0.5 text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100">
                      {safeText(
                        durum
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ==========================================
                  TARİHLER
              ========================================== */}

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">

                <div className="text-[10px] font-extrabold uppercase tracking-wide text-zinc-400">
                  Tarihler
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">

                  <div>
                    <div className="text-[9px] text-zinc-400">
                      Oluşturma
                    </div>

                    <div className="mt-0.5 text-[10px] font-bold text-zinc-900 dark:text-zinc-100">
                      {formatTR(
                        data?.olusturmaTarihiUtc ??
                          data?.OlusturmaTarihiUtc
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] text-zinc-400">
                      Onay
                    </div>

                    <div className="mt-0.5 text-[10px] font-bold text-zinc-900 dark:text-zinc-100">
                      {formatTR(
                        data?.onayTarihiUtc ??
                          data?.OnayTarihiUtc
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] text-zinc-400">
                      Başlama
                    </div>

                    <div className="mt-0.5 text-[10px] font-bold text-zinc-900 dark:text-zinc-100">
                      {formatTR(
                        data?.baslamaTarihiUtc ??
                          data?.BaslamaTarihiUtc
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] text-zinc-400">
                      Bitiş
                    </div>

                    <div className="mt-0.5 text-[10px] font-bold text-zinc-900 dark:text-zinc-100">
                      {formatTR(
                        data?.bitisTarihiUtc ??
                          data?.BitisTarihiUtc
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ==========================================
                  AÇIKLAMA
              ========================================== */}

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">

                <div className="text-[10px] font-extrabold uppercase tracking-wide text-zinc-400">
                  Açıklama
                </div>

                <div className="mt-2 whitespace-pre-wrap break-words text-[11px] leading-5 text-zinc-700 dark:text-zinc-300">
                  {safeText(
                    aciklama
                  )}
                </div>

                {aciklama2 ? (
                  <>
                    <div className="my-3 border-t border-zinc-100 dark:border-zinc-800" />

                    <div className="text-[9px] font-bold text-zinc-400">
                      Ek Açıklama
                    </div>

                    <div className="mt-1 whitespace-pre-wrap break-words text-[11px] leading-5 text-zinc-700 dark:text-zinc-300">
                      {aciklama2}
                    </div>
                  </>
                ) : null}

                {adres ? (
                  <>
                    <div className="my-3 border-t border-zinc-100 dark:border-zinc-800" />

                    <div className="text-[9px] font-bold text-zinc-400">
                      Adres
                    </div>

                    <div className="mt-1 text-[11px] leading-5 text-zinc-700 dark:text-zinc-300">
                      {adres}
                    </div>
                  </>
                ) : null}
              </div>

              {/* ==========================================
                  PERSONELLER
              ========================================== */}

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">

                <div className="flex items-center justify-between gap-2">

                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wide text-zinc-400">
                      Görevli Personeller
                    </div>

                    <div className="mt-0.5 text-[9px] text-zinc-400">
                      İş emrinde görev alan personeller
                    </div>
                  </div>

                  <div className="rounded-full bg-zinc-100 px-2 py-1 text-[9px] font-extrabold text-zinc-500 dark:bg-zinc-800">
                    {Array.isArray(
                      personeller
                    )
                      ? personeller.length
                      : 0}
                  </div>
                </div>

                {Array.isArray(
                  personeller
                ) &&
                personeller.length >
                  0 ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">

                    {personeller.map(
                      (
                        item,
                        index
                      ) => (
                        <PersonelCard
                          key={
                            item?.id ??
                            item?.Id ??
                            index
                          }
                          item={item}
                        />
                      )
                    )}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-dashed border-zinc-300 px-3 py-5 text-center text-[10px] text-zinc-400 dark:border-zinc-700">
                    Görevli personel bulunamadı.
                  </div>
                )}
              </div>

              {/* ==========================================
                  NOTLAR
              ========================================== */}

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">

                <div className="flex items-center justify-between gap-2">

                  <div className="text-[10px] font-extrabold uppercase tracking-wide text-zinc-400">
                    İş Emri Notları
                  </div>

                  <div className="rounded-full bg-zinc-100 px-2 py-1 text-[9px] font-extrabold text-zinc-500 dark:bg-zinc-800">
                    {Array.isArray(
                      notlar
                    )
                      ? notlar.length
                      : 0}
                  </div>
                </div>

                {Array.isArray(
                  notlar
                ) &&
                notlar.length >
                  0 ? (
                  <div className="mt-3 space-y-2">

                    {notlar.map(
                      (
                        not,
                        index
                      ) => {
                        const personel =
                          not?.personel ??
                          not?.Personel ??
                          {};

                        const ad =
                          personel?.ad ??
                          personel?.Ad ??
                          "";

                        const soyad =
                          personel?.soyad ??
                          personel?.Soyad ??
                          "";

                        const metin =
                          not?.metin ??
                          not?.Metin;

                        const tarih =
                          not?.olusturmaTarihiUtc ??
                          not?.OlusturmaTarihiUtc;

                        return (
                          <div
                            key={
                              not?.id ??
                              not?.Id ??
                              index
                            }
                            className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950"
                          >

                            <div className="whitespace-pre-wrap break-words text-[10px] leading-5 text-zinc-700 dark:text-zinc-300">
                              {safeText(
                                metin
                              )}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 pt-2 text-[8px] text-zinc-400 dark:border-zinc-800">

                              <span>
                                {`${ad} ${soyad}`.trim() ||
                                  "-"}
                              </span>

                              <span>
                                {formatTR(
                                  tarih
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-dashed border-zinc-300 px-3 py-5 text-center text-[10px] text-zinc-400 dark:border-zinc-700">
                    İş emrine ait not bulunamadı.
                  </div>
                )}
              </div>

              {/* ==========================================
                  ALT DETAYA GİT BUTONU
              ========================================== */}

              <div className="pb-3">

                <button
                  type="button"
                  onClick={
                    handleGoToIsEmriDetay
                  }
                  className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-[11px] font-extrabold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  <span>
                    İş Emri Detayına Git
                  </span>

                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 18l6-6-6-6"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}