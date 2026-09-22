import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

const ANKET_TIPLERI = {
  DAIRE_SAKINI: 10,
  ORTAK_ALAN: 20,
};

const PUAN_SECENEKLERI = [
  {
    puan: 1,
    emoji: "😠",
    text: "Çok Kötü",
  },
  {
    puan: 2,
    emoji: "😞",
    text: "Kötü",
  },
  {
    puan: 3,
    emoji: "😐",
    text: "Orta",
  },
  {
    puan: 4,
    emoji: "🙂",
    text: "İyi",
  },
  {
    puan: 5,
    emoji: "😄",
    text: "Çok İyi",
  },
];

const DAIRE_SAKINI_SORULARI = [
  {
    key: "randevuPuani",
    baslik:
      "Personelimiz randevu saatine uygun geldi mi?",
  },
  {
    key: "isKalitesiPuani",
    baslik:
      "Yapılan işin kalitesini nasıl değerlendirirsiniz?",
  },
  {
    key: "iletisimGenelGorunumPuani",
    baslik:
      "Teknik personelimizin iletişimini ve genel görünümünü nasıl değerlendirirsiniz?",
  },
  {
    key: "konuyaHakimiyetPuani",
    baslik:
      "Personelimizin konuya hakimiyeti, araç-gereç yeterliliği ve konu hakkında sizi bilgilendirmesini nasıl değerlendirirsiniz?",
  },
  {
    key: "tamamlanmaMemnuniyetPuani",
    baslik:
      "İşin tamamlanma süreci ve sonucundan ne kadar memnun kaldınız?",
  },
];

const ORTAK_ALAN_SORULARI = [
  {
    key: "randevuPuani",
    baslik:
      "Personelimiz randevu saatine uygun geldi mi?",
  },
  {
    key: "isKalitesiPuani",
    baslik:
      "Yapılan işin kalitesini nasıl değerlendirirsiniz?",
  },
  {
    key: "isDisipliniPuani",
    baslik:
      "Teknik personelin iş disiplini ve yaklaşımını nasıl değerlendirirsiniz?",
  },
  {
    key: "ihtiyaciKarsilamaPuani",
    baslik:
      "Yapılan çalışmanın ihtiyacı karşılama düzeyini nasıl değerlendirirsiniz?",
  },
];

function extractBackendMsg(err) {
  const data = err?.response?.data;

  if (!data) return null;

  if (
    data?.errors &&
    typeof data.errors === "object"
  ) {
    const flat = Object.entries(data.errors)
      .flatMap(([key, arr]) =>
        Array.isArray(arr)
          ? arr.map(
              (x) => `${key}: ${x}`
            )
          : []
      )
      .slice(0, 10);

    if (flat.length) {
      return flat.join(" | ");
    }
  }

  if (typeof data === "string") {
    return data;
  }

  return (
    data?.message ||
    data?.Message ||
    data?.error ||
    data?.Error ||
    data?.title ||
    null
  );
}

function safeText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "-";
  }

  const text = String(value).trim();

  return text.length
    ? text
    : "-";
}

function PuanSecimi({
  value,
  onChange,
  disabled,
}) {
  return (
    <div className="mt-5">
      <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
        {PUAN_SECENEKLERI.map(
          (item) => {
            const selected =
              Number(value) ===
              item.puan;

            return (
              <button
                key={item.puan}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange(
                    item.puan
                  )
                }
                className={`group flex min-h-[82px] flex-col items-center justify-center rounded-xl border px-1 py-3 transition-all disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[95px] ${
                  selected
                    ? "scale-[1.03] border-zinc-900 bg-zinc-900 shadow-md dark:border-zinc-100 dark:bg-zinc-100"
                    : "border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
                }`}
              >
                <span
                  className={`text-2xl transition-transform sm:text-4xl ${
                    selected
                      ? "scale-110"
                      : "group-hover:scale-110"
                  }`}
                >
                  {item.emoji}
                </span>

                <span
                  className={`mt-2 text-center text-[8px] font-semibold leading-3 sm:text-[10px] ${
                    selected
                      ? "text-white dark:text-zinc-900"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {item.text}
                </span>
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}

export default function MemnuniyetAnketCevapPage() {
  const router = useRouter();

  const { guidLink } =
    router.query;

  const [loading, setLoading] =
    useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [anket, setAnket] =
    useState(null);

  const [
    cevaplar,
    setCevaplar,
  ] = useState({
    randevuPuani: null,
    isKalitesiPuani: null,

    iletisimGenelGorunumPuani:
      null,

    konuyaHakimiyetPuani:
      null,

    tamamlanmaMemnuniyetPuani:
      null,

    isDisipliniPuani:
      null,

    ihtiyaciKarsilamaPuani:
      null,

    gorusOneri: "",
  });

  const [saving, setSaving] =
    useState(false);

  const [msg, setMsg] =
    useState("");

  const [
    success,
    setSuccess,
  ] = useState(false);

  // ==========================================
  // ANKET GET
  // ==========================================

  useEffect(() => {
    if (
      !router.isReady ||
      !guidLink
    ) {
      return;
    }

    let cancelled = false;

    const loadAnket =
      async () => {
        try {
          setLoading(true);
          setLoadError("");
          setMsg("");

          const res =
            await getDataAsync(
              `memnuniyet-anket/public/${guidLink}`
            );

          if (cancelled) {
            return;
          }

          setAnket(res);
        } catch (err) {
          console.error(
            "Memnuniyet anketi yüklenirken hata:",
            err
          );

          console.error(
            "BACKEND RESPONSE:",
            err?.response?.data
          );

          if (!cancelled) {
            setLoadError(
              extractBackendMsg(
                err
              ) ||
                err?.message ||
                "Anket yüklenirken bir hata oluştu."
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    loadAnket();

    return () => {
      cancelled = true;
    };
  }, [
    router.isReady,
    guidLink,
  ]);

  // ==========================================
  // ANKET TİPİ
  // ==========================================

  const anketTipi = Number(
    anket?.anketTipi ??
      anket?.AnketTipi ??
      0
  );

  // ==========================================
  // SORULAR
  // ==========================================

  const sorular = useMemo(
    () => {
      if (
        anketTipi ===
        ANKET_TIPLERI.DAIRE_SAKINI
      ) {
        return DAIRE_SAKINI_SORULARI;
      }

      if (
        anketTipi ===
        ANKET_TIPLERI.ORTAK_ALAN
      ) {
        return ORTAK_ALAN_SORULARI;
      }

      return [];
    },
    [anketTipi]
  );

  // ==========================================
  // İŞ EMRİ
  // ==========================================

  const isEmri =
    anket?.isEmri ??
    anket?.IsEmri ??
    {};

  const isEmriBaslik =
    isEmri?.kisaBaslik ??
    isEmri?.KisaBaslik ??
    anket?.kisaBaslik ??
    anket?.KisaBaslik;

  const isEmriAciklama =
    isEmri?.aciklama ??
    isEmri?.Aciklama ??
    anket?.aciklama ??
    anket?.Aciklama;

  const isEmriKod =
    isEmri?.kod ??
    isEmri?.Kod ??
    anket?.kod ??
    anket?.Kod;

  const cevaplandiMi =
    Boolean(
      anket?.cevaplandiMi ??
        anket?.CevaplandiMi ??
        false
    );

  // ==========================================
  // PUAN DEĞİŞTİR
  // ==========================================

  const handlePuanChange = (
    key,
    puan
  ) => {
    if (
      success ||
      cevaplandiMi
    ) {
      return;
    }

    setCevaplar(
      (prev) => ({
        ...prev,

        [key]: puan,
      })
    );

    setMsg("");
  };

  // ==========================================
  // VALIDATE
  // ==========================================

  const validate = () => {
    if (!sorular.length) {
      return "Anket tipi belirlenemedi.";
    }

    const eksikSoru =
      sorular.find(
        (soru) => {
          const puan =
            Number(
              cevaplar[
                soru.key
              ]
            );

          return (
            !Number.isInteger(
              puan
            ) ||
            puan < 1 ||
            puan > 5
          );
        }
      );

    if (eksikSoru) {
      return "Lütfen tüm değerlendirme sorularını cevaplayınız.";
    }

    if (
      cevaplar.gorusOneri
        ?.length > 2000
    ) {
      return "Görüş ve öneri en fazla 2000 karakter olabilir.";
    }

    return null;
  };

  // ==========================================
  // CEVAPLA
  // ==========================================

  const handleSubmit =
    async () => {
      if (
        saving ||
        success ||
        cevaplandiMi
      ) {
        return;
      }

      const validationError =
        validate();

      if (validationError) {
        setMsg(
          validationError
        );

        return;
      }

      try {
        setSaving(true);
        setMsg("");

        const payload = {
          // ==========================
          // ORTAK
          // ==========================

          randevuPuani:
            Number(
              cevaplar.randevuPuani
            ),

          isKalitesiPuani:
            Number(
              cevaplar.isKalitesiPuani
            ),

          // ==========================
          // DAİRE SAKİNİ
          // ==========================

          iletisimGenelGorunumPuani:
            anketTipi ===
            ANKET_TIPLERI.DAIRE_SAKINI
              ? Number(
                  cevaplar.iletisimGenelGorunumPuani
                )
              : null,

          konuyaHakimiyetPuani:
            anketTipi ===
            ANKET_TIPLERI.DAIRE_SAKINI
              ? Number(
                  cevaplar.konuyaHakimiyetPuani
                )
              : null,

          tamamlanmaMemnuniyetPuani:
            anketTipi ===
            ANKET_TIPLERI.DAIRE_SAKINI
              ? Number(
                  cevaplar.tamamlanmaMemnuniyetPuani
                )
              : null,

          // ==========================
          // ORTAK ALAN
          // ==========================

          isDisipliniPuani:
            anketTipi ===
            ANKET_TIPLERI.ORTAK_ALAN
              ? Number(
                  cevaplar.isDisipliniPuani
                )
              : null,

          ihtiyaciKarsilamaPuani:
            anketTipi ===
            ANKET_TIPLERI.ORTAK_ALAN
              ? Number(
                  cevaplar.ihtiyaciKarsilamaPuani
                )
              : null,

          // ==========================
          // GÖRÜŞ
          // ==========================

          gorusOneri:
            String(
              cevaplar.gorusOneri ||
                ""
            ).trim() ||
            null,
        };

        await postDataAsync(
          `memnuniyet-anket/public/${guidLink}/cevapla`,
          payload,
          {
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

        setSuccess(true);
        setMsg("");
      } catch (err) {
        console.error(
          "Memnuniyet anketi gönderme hatası:",
          err
        );

        console.error(
          "BACKEND RESPONSE:",
          err?.response?.data
        );

        setMsg(
          extractBackendMsg(
            err
          ) ||
            err?.message ||
            "Anket gönderilirken bir hata oluştu."
        );
      } finally {
        setSaving(false);
      }
    };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <div className="rounded-xl border border-zinc-200 bg-white px-6 py-5 text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          Anket yükleniyor...
        </div>
      </div>
    );
  }

  // ==========================================
  // GET ERROR
  // ==========================================

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-7 text-center shadow-sm dark:border-red-900 dark:bg-zinc-950">
          <div className="text-lg font-semibold text-red-600 dark:text-red-300">
            Anket Açılamadı
          </div>

          <div className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {loadError}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // BAŞARILI
  // ==========================================

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
            😄
          </div>

          <h1 className="mt-5 text-xl font-semibold">
            Teşekkür Ederiz
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Değerlendirmeniz
            başarıyla alınmıştır.
            Görüşleriniz hizmet
            kalitemizi geliştirmemize
            yardımcı olmaktadır.
          </p>

          <div className="mt-7 border-t border-zinc-200 pt-4 text-[11px] text-zinc-500 dark:border-zinc-800">
            SAYGILARIMIZLA,{" "}
            <span className="font-semibold">
              EOS MANAGEMENT
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // DAHA ÖNCE CEVAPLANDI
  // ==========================================

  if (cevaplandiMi) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl dark:bg-zinc-900">
            ✓
          </div>

          <h1 className="mt-5 text-xl font-semibold">
            Anket Daha Önce
            Cevaplandı
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Bu memnuniyet anketi
            daha önce
            tamamlanmıştır.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ANA SAYFA
  // ==========================================

  return (
    <div className="min-h-screen bg-zinc-50 px-3 py-5 text-zinc-900 sm:px-4 sm:py-7 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">

          {/* HEADER */}

          <div className="border-b border-zinc-200 p-5 sm:p-7 dark:border-zinc-800">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              EOS MANAGEMENT
            </div>

            <h1 className="mt-2 text-xl font-semibold sm:text-2xl">
              Memnuniyet Anketi
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Hizmet kalitemizi
              geliştirebilmemiz için
              aşağıdaki soruları
              değerlendirmenizi rica
              ederiz.
            </p>

            <div className="mt-4">
              <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                {anketTipi ===
                ANKET_TIPLERI.DAIRE_SAKINI
                  ? "Daire Sakini Değerlendirmesi"
                  : "Ortak Alan / Proje Yöneticisi Değerlendirmesi"}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-7">

            {/* İŞ EMRİ */}

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                  Yapılan İş
                </div>

                {isEmriKod ? (
                  <div className="text-[10px] font-semibold text-zinc-400">
                    {isEmriKod}
                  </div>
                ) : null}
              </div>

              <div className="mt-2 text-sm font-semibold sm:text-base">
                {safeText(
                  isEmriBaslik
                )}
              </div>

              <div className="mt-2 whitespace-pre-line text-xs leading-5 text-zinc-600 sm:text-sm sm:leading-6 dark:text-zinc-400">
                {safeText(
                  isEmriAciklama
                )}
              </div>
            </div>

            {/* AÇIKLAMA */}

            <div className="mt-5 rounded-xl bg-zinc-50 px-4 py-3 text-center text-xs leading-5 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              Her soru için size en
              uygun ifadeyi seçiniz.
            </div>

            {/* SORULAR */}

            <div className="mt-5 space-y-4">
              {sorular.map(
                (
                  soru,
                  index
                ) => (
                  <div
                    key={
                      soru.key
                    }
                    className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                        {index +
                          1}
                      </div>

                      <div className="pt-0.5 text-sm font-medium leading-6">
                        {
                          soru.baslik
                        }
                      </div>
                    </div>

                    <PuanSecimi
                      value={
                        cevaplar[
                          soru
                            .key
                        ]
                      }
                      disabled={
                        saving
                      }
                      onChange={(
                        puan
                      ) =>
                        handlePuanChange(
                          soru.key,
                          puan
                        )
                      }
                    />
                  </div>
                )
              )}

              {/* GÖRÜŞ / ÖNERİ */}

              <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {sorular.length +
                      1}
                  </div>

                  <div className="pt-0.5 text-sm font-medium leading-6">
                    {anketTipi ===
                    ANKET_TIPLERI.DAIRE_SAKINI
                      ? "Eklemek istediğiniz görüş veya öneriniz var mı?"
                      : "İş veya teknik personel hakkında eklemek istediğiniz bir görüş var mı?"}
                  </div>
                </div>

                <textarea
                  value={
                    cevaplar.gorusOneri
                  }
                  onChange={(e) =>
                    setCevaplar(
                      (
                        prev
                      ) => ({
                        ...prev,

                        gorusOneri:
                          e
                            .target
                            .value,
                      })
                    )
                  }
                  disabled={
                    saving
                  }
                  maxLength={
                    2000
                  }
                  placeholder="Görüş ve önerilerinizi yazabilirsiniz..."
                  className="mt-4 min-h-[130px] w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-900"
                />

                <div className="mt-1.5 text-right text-[10px] text-zinc-400">
                  {
                    cevaplar
                      .gorusOneri
                      .length
                  }{" "}
                  / 2000
                </div>
              </div>
            </div>

            {/* ERROR */}

            {msg ? (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {msg}
              </div>
            ) : null}

            {/* SUBMIT */}

            <button
              type="button"
              onClick={
                handleSubmit
              }
              disabled={
                saving
              }
              className="mt-6 h-12 w-full rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving
                ? "Değerlendirme Gönderiliyor..."
                : "Değerlendirmeyi Gönder"}
            </button>

            <div className="mt-6 border-t border-zinc-200 pt-4 text-center text-[10px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              SAYGILARIMIZLA,{" "}
              <span className="font-semibold">
                EOS
                MANAGEMENT
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}