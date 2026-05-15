




import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

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

function isSelectionType(soruTipi) {
  return Number(soruTipi) === 1 || Number(soruTipi) === 2;
}

function isTextType(soruTipi) {
  return Number(soruTipi) === 3 || Number(soruTipi) === 4;
}

function isNumberType(soruTipi) {
  return Number(soruTipi) === 5;
}

function isDateType(soruTipi) {
  return Number(soruTipi) === 6;
}

function isImageUrl(value = "") {
  return /\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(String(value || ""));
}

function soruGorselSecimMi(soru) {
  const tip = Number(soru?.soruTipi);
  const secenekler = Array.isArray(soru?.secenekler) ? soru.secenekler : [];

  if (tip !== 1 && tip !== 2) return false;
  if (secenekler.length === 0) return false;

  return secenekler.every((x) => isImageUrl(x?.secenekMetni));
}

export default function AnketCevapPage() {
  const router = useRouter();
  const { guidLink } = router.query;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [anket, setAnket] = useState(null);
  const [sorular, setSorular] = useState([]);

  const [adSoyad, setAdSoyad] = useState("");
  const [telefon, setTelefon] = useState("");
  const [eposta, setEposta] = useState("");

  const [cevaplar, setCevaplar] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!router.isReady || !guidLink) return;

    let cancelled = false;

    const loadAnket = async () => {
      try {
        setLoading(true);
        setLoadError("");
        setMsg("");

        const res = await getDataAsync(`anket/public/${guidLink}`);
        if (cancelled) return;

        const a = res?.anket ?? null;
        const s = Array.isArray(res?.sorular) ? res.sorular : [];

        setAnket(a);
        setSorular(s);

        const initialAnswers = {};
        for (const soru of s) {
          const tip = Number(soru?.soruTipi);

          if (tip === 1) {
            initialAnswers[soru.id] = {
              soruId: soru.id,
              secenekIdler: [],
              metinCevap: "",
              sayiCevap: null,
              tarihCevap: null,
            };
          } else if (tip === 2) {
            initialAnswers[soru.id] = {
              soruId: soru.id,
              secenekIdler: [],
              metinCevap: "",
              sayiCevap: null,
              tarihCevap: null,
            };
          } else if (tip === 3 || tip === 4) {
            initialAnswers[soru.id] = {
              soruId: soru.id,
              secenekIdler: [],
              metinCevap: "",
              sayiCevap: null,
              tarihCevap: null,
            };
          } else if (tip === 5) {
            initialAnswers[soru.id] = {
              soruId: soru.id,
              secenekIdler: [],
              metinCevap: "",
              sayiCevap: null,
              tarihCevap: null,
            };
          } else if (tip === 6) {
            initialAnswers[soru.id] = {
              soruId: soru.id,
              secenekIdler: [],
              metinCevap: "",
              sayiCevap: null,
              tarihCevap: null,
            };
          }
        }

        setCevaplar(initialAnswers);
      } catch (e) {
        console.error("ANKET LOAD ERROR:", e);
        if (cancelled) return;

        const backendMsg = extractBackendMsg(e);
        setLoadError(
          backendMsg
            ? `Anket yüklenemedi: ${backendMsg}`
            : "Anket yüklenemedi."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAnket();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, guidLink]);

  const soruCount = useMemo(() => sorular.length, [sorular]);

  const updateTekSecim = (soruId, secenekId) => {
    setCevaplar((prev) => ({
      ...prev,
      [soruId]: {
        ...(prev[soruId] || {}),
        soruId,
        secenekIdler: [Number(secenekId)],
      },
    }));
  };

  const updateCokluSecim = (soru, secenekId, checked) => {
    const soruId = soru.id;
    const mevcut = prevSafeArray(cevaplar?.[soruId]?.secenekIdler);

    let next = checked
      ? [...new Set([...mevcut, Number(secenekId)])]
      : mevcut.filter((x) => Number(x) !== Number(secenekId));

    const maxSecim = soru?.maxSecimSayisi ?? null;
    if (maxSecim && next.length > Number(maxSecim)) {
      setMsg(`"${soru.baslik}" için en fazla ${maxSecim} seçim yapabilirsiniz.`);
      return;
    }

    setMsg("");
    setCevaplar((prev) => ({
      ...prev,
      [soruId]: {
        ...(prev[soruId] || {}),
        soruId,
        secenekIdler: next,
      },
    }));
  };

  const updateMetin = (soruId, value) => {
    setCevaplar((prev) => ({
      ...prev,
      [soruId]: {
        ...(prev[soruId] || {}),
        soruId,
        metinCevap: value,
      },
    }));
  };

  const updateSayi = (soruId, value) => {
    setCevaplar((prev) => ({
      ...prev,
      [soruId]: {
        ...(prev[soruId] || {}),
        soruId,
        sayiCevap: value === "" ? null : Number(value),
      },
    }));
  };

  const updateTarih = (soruId, value) => {
    setCevaplar((prev) => ({
      ...prev,
      [soruId]: {
        ...(prev[soruId] || {}),
        soruId,
        tarihCevap: value || null,
      },
    }));
  };

  function prevSafeArray(v) {
    return Array.isArray(v) ? v : [];
  }

  const validateForm = () => {
    if (!adSoyad.trim()) return "Ad Soyad zorunludur.";
    const temizTelefon = telefon.replace(/\D/g, "");

    if (!temizTelefon)
      return "Telefon zorunludur.";

    if (temizTelefon.length !== 10)
      return "Telefon numarası 10 haneli olmalıdır.";

    for (const soru of sorular) {
      const soruId = soru?.id;
      const tip = Number(soru?.soruTipi);
      const zorunlu = !!soru?.zorunluMu;
      const cevap = cevaplar?.[soruId];

      if (!zorunlu) continue;

      if (tip === 1) {
        const secenekler = prevSafeArray(cevap?.secenekIdler);
        if (secenekler.length !== 1) {
          return `"${soru?.baslik}" sorusu için 1 seçim yapmalısınız.`;
        }
      }

      if (tip === 2) {
        const secenekler = prevSafeArray(cevap?.secenekIdler);
        const minSecim = soru?.minSecimSayisi ?? 1;

        if (secenekler.length < Number(minSecim)) {
          return `"${soru?.baslik}" sorusu için en az ${minSecim} seçim yapmalısınız.`;
        }
      }

      if (tip === 3 || tip === 4) {
        const metin = String(cevap?.metinCevap ?? "").trim();
        if (!metin) {
          return `"${soru?.baslik}" sorusu için cevap yazmalısınız.`;
        }

        if (
          soru?.maxMetinUzunlugu &&
          metin.length > Number(soru.maxMetinUzunlugu)
        ) {
          return `"${soru?.baslik}" cevabı en fazla ${soru.maxMetinUzunlugu} karakter olabilir.`;
        }
      }

      if (tip === 5) {
        if (cevap?.sayiCevap === null || cevap?.sayiCevap === undefined) {
          return `"${soru?.baslik}" sorusu için sayısal cevap girmelisiniz.`;
        }
      }

      if (tip === 6) {
        if (!cevap?.tarihCevap) {
          return `"${soru?.baslik}" sorusu için tarih seçmelisiniz.`;
        }
      }
    }

    return "";
  };

  const buildPayload = () => {
    const payloadCevaplar = sorular.map((soru) => {
      const soruId = soru.id;
      const tip = Number(soru.soruTipi);
      const cevap = cevaplar?.[soruId] || {};

      return {
        soruId,
        secenekIdler: isSelectionType(tip)
          ? prevSafeArray(cevap.secenekIdler)
          : [],
        metinCevap: isTextType(tip)
          ? String(cevap.metinCevap ?? "").trim()
          : null,
        sayiCevap: isNumberType(tip) ? cevap.sayiCevap : null,
        tarihCevap: isDateType(tip) ? cevap.tarihCevap : null,
      };
    });

    return {
      adSoyad: adSoyad.trim(),
      telefon: telefon.trim() || null,
      eposta: eposta.trim() || null,
      cevaplar: payloadCevaplar,
    };
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setMsg(validationError);
      return;
    }

    try {
      setSaving(true);
      setMsg("");

      const payload = buildPayload();

const res = await postDataAsync(`anket/public/${guidLink}/cevapla`, payload);

if (res?.ok === false) {
  setMsg(res?.message || "Bilgilerinizi kontrol ediniz.");
  setSuccess(false);
  return;
}

setSuccess(true);
    } catch (e) {
      console.error("ANKET SUBMIT ERROR:", e);
      console.log("BACKEND DATA", e?.response?.data);

      const status = e?.response?.status;
      const backendMsg = extractBackendMsg(e);

      if (status === 401) {
        setMsg("Yetkisiz işlem (401).");
      } else if (status === 403) {
        setMsg("Erişim reddedildi (403).");
      } else if (status === 400) {
        setMsg(
          backendMsg
            ? backendMsg
            : "Cevaplar gönderilemedi. Bilgilerinizi kontrol ediniz."
        );
      } else {
        setMsg(
          backendMsg
            ? `Cevaplar gönderilemedi: ${backendMsg}`
            : "Cevaplar gönderilemedi."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
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
              <div className="text-sm font-bold tracking-wide">
                EOS MANAGEMENT
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Anket Cevaplama
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-28 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-28 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !anket) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
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
              <div className="text-sm font-bold tracking-wide">
                EOS MANAGEMENT
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Anket Cevaplama
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900 dark:bg-zinc-900">
            <div className="text-base font-semibold text-red-700 dark:text-red-300">
              Anket açılamadı
            </div>
            <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              {loadError || "Anket bilgisi alınamadı."}
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => router.reload()}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
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
              <div className="text-sm font-bold tracking-wide">
                EOS MANAGEMENT
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Anket Cevaplama
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-3xl border border-emerald-300 bg-white p-8 shadow-xl dark:border-emerald-800 dark:bg-zinc-900">
            <div className="text-center">
              <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                Teşekkür ederiz
              </div>
              <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Anket cevabınız başarıyla kaydedildi.
              </div>

              <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
                <div className="text-sm font-semibold">
                  {anket?.baslik ?? "-"}
                </div>
                {anket?.aciklama ? (
                  <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                    {anket.aciklama}
                  </div>
                ) : null}
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => router.reload()}
                  className="rounded-md bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Sayfayı Yenile
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-zinc-200 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            SAYGILARIMIZLA, <span className="font-semibold">EOS MANAGEMENT</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
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
                Anket Cevaplama Formu
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              Soru:{" "}
              <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                {soruCount}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-lg font-semibold tracking-tight">
                {anket?.baslik ?? "-"}
              </div>
              <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                Lütfen aşağıdaki bilgileri doldurup anketi tamamlayınız.
              </div>
            </div>
          </div>

          {anket?.aciklama ? (
            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-200">
              {anket.aciklama}
            </div>
          ) : null}

          {msg && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
              {msg}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
            <div className="text-sm font-semibold">Katılımcı Bilgileri</div>
            <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              Ad Soyad ve telefon zorunludur. Eposta isteğe bağlıdır.
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                  Ad Soyad *
                </label>
                <input
                  value={adSoyad}
                  onChange={(e) => setAdSoyad(e.target.value)}
                  maxLength={250}
                  placeholder="Ad Soyad"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                  Telefon *
                </label>
                <input
                  value={telefon}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");

                    // Baştaki 0 varsa kaldır
                    if (value.startsWith("0")) {
                      value = value.substring(1);
                    }

                    // Max 10 hane
                    if (value.length > 10) {
                      value = value.slice(0, 10);
                    }

                    setTelefon(value);
                  }}
                  maxLength={50}
                  placeholder="(5xx) xxx xx xx"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                  Eposta
                </label>
                <input
                  value={eposta}
                  onChange={(e) => setEposta(e.target.value)}
                  maxLength={250}
                  placeholder="Eposta"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {sorular.map((soru, index) => {
            const tip = Number(soru?.soruTipi);
            const cevap = cevaplar?.[soru.id] || {};
            const secenekler = Array.isArray(soru?.secenekler)
              ? soru.secenekler
              : [];
            const gorselSecim = soruGorselSecimMi(soru);

            return (
              <div
                key={soru.id}
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

                  <div className="flex items-center gap-2">
                    {gorselSecim ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                        Görsel Seçim
                      </span>
                    ) : null}

                    {soru?.zorunluMu ? (
                      <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-medium text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
                        Zorunlu
                      </span>
                    ) : (
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                        Opsiyonel
                      </span>
                    )}
                  </div>
                </div>

                {tip === 1 && !gorselSecim && (
                  <div className="mt-4 space-y-2">
                    {secenekler.map((secenek) => (
                      <label
                        key={secenek.id}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-950"
                      >
                        <input
                          type="radio"
                          name={`soru_${soru.id}`}
                          checked={prevSafeArray(cevap?.secenekIdler).includes(
                            secenek.id,
                          )}
                          onChange={() => updateTekSecim(soru.id, secenek.id)}
                          className="mt-1 h-4 w-4"
                        />
                        <span className="text-sm text-zinc-800 dark:text-zinc-100">
                          {secenek?.secenekMetni ?? "-"}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {tip === 1 && gorselSecim && (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {secenekler.map((secenek, secenekIndex) => {
                      const selected = prevSafeArray(
                        cevap?.secenekIdler,
                      ).includes(secenek.id);

                      return (
                        <label
                          key={secenek.id}
                          className={`group cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition dark:bg-zinc-950 ${
                            selected
                              ? "border-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-800"
                              : "border-zinc-200 hover:border-emerald-300 dark:border-zinc-800"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`soru_${soru.id}`}
                            checked={selected}
                            onChange={() => updateTekSecim(soru.id, secenek.id)}
                            className="sr-only"
                          />

                          <div className="relative h-48 w-full bg-zinc-100 dark:bg-zinc-900">
                            <img
                              src={secenek?.secenekMetni}
                              alt={`Görsel seçenek ${secenekIndex + 1}`}
                              className="h-full w-full object-contain transition group-hover:scale-[1.02]"
                              loading="lazy"
                            />

                            <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold text-white">
                              Seçenek {secenekIndex + 1}
                            </div>

                            {selected && (
                              <div className="absolute right-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white">
                                Seçildi
                              </div>
                            )}
                          </div>

                          <div className="p-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`grid h-5 w-5 place-items-center rounded-full border text-[10px] ${
                                  selected
                                    ? "border-emerald-600 bg-emerald-600 text-white"
                                    : "border-zinc-300 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
                                }`}
                              >
                                {selected ? "✓" : ""}
                              </span>
                              <span className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-200">
                                Bu görseli seç
                              </span>
                            </div>

                            <a
                              href={secenek?.secenekMetni}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-2 block break-all text-[10px] text-zinc-500 hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-300"
                            >
                              Görseli yeni sekmede aç
                            </a>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {tip === 2 && !gorselSecim && (
                  <div className="mt-4">
                    {(soru?.minSecimSayisi || soru?.maxSecimSayisi) && (
                      <div className="mb-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                        {soru?.minSecimSayisi
                          ? `Min: ${soru.minSecimSayisi}`
                          : null}
                        {soru?.minSecimSayisi && soru?.maxSecimSayisi
                          ? " • "
                          : null}
                        {soru?.maxSecimSayisi
                          ? `Max: ${soru.maxSecimSayisi}`
                          : null}
                      </div>
                    )}

                    <div className="space-y-2">
                      {secenekler.map((secenek) => (
                        <label
                          key={secenek.id}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-950"
                        >
                          <input
                            type="checkbox"
                            checked={prevSafeArray(
                              cevap?.secenekIdler,
                            ).includes(secenek.id)}
                            onChange={(e) =>
                              updateCokluSecim(
                                soru,
                                secenek.id,
                                e.target.checked,
                              )
                            }
                            className="mt-1 h-4 w-4"
                          />
                          <span className="text-sm text-zinc-800 dark:text-zinc-100">
                            {secenek?.secenekMetni ?? "-"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {tip === 2 && gorselSecim && (
                  <div className="mt-4">
                    {(soru?.minSecimSayisi || soru?.maxSecimSayisi) && (
                      <div className="mb-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                        {soru?.minSecimSayisi
                          ? `Min: ${soru.minSecimSayisi}`
                          : null}
                        {soru?.minSecimSayisi && soru?.maxSecimSayisi
                          ? " • "
                          : null}
                        {soru?.maxSecimSayisi
                          ? `Max: ${soru.maxSecimSayisi}`
                          : null}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {secenekler.map((secenek, secenekIndex) => {
                        const selected = prevSafeArray(
                          cevap?.secenekIdler,
                        ).includes(secenek.id);

                        return (
                          <label
                            key={secenek.id}
                            className={`group cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition dark:bg-zinc-950 ${
                              selected
                                ? "border-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-800"
                                : "border-zinc-200 hover:border-emerald-300 dark:border-zinc-800"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(e) =>
                                updateCokluSecim(
                                  soru,
                                  secenek.id,
                                  e.target.checked,
                                )
                              }
                              className="sr-only"
                            />

                            <div className="relative h-48 w-full bg-zinc-100 dark:bg-zinc-900">
                              <img
                                src={secenek?.secenekMetni}
                                alt={`Görsel seçenek ${secenekIndex + 1}`}
                                className="h-full w-full object-contain transition group-hover:scale-[1.02]"
                                loading="lazy"
                              />

                              <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold text-white">
                                Seçenek {secenekIndex + 1}
                              </div>

                              {selected && (
                                <div className="absolute right-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white">
                                  Seçildi
                                </div>
                              )}
                            </div>

                            <div className="p-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`grid h-5 w-5 place-items-center rounded-md border text-[10px] ${
                                    selected
                                      ? "border-emerald-600 bg-emerald-600 text-white"
                                      : "border-zinc-300 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
                                  }`}
                                >
                                  {selected ? "✓" : ""}
                                </span>
                                <span className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-200">
                                  Bu görseli seç
                                </span>
                              </div>

                              <a
                                href={secenek?.secenekMetni}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="mt-2 block break-all text-[10px] text-zinc-500 hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-300"
                              >
                                Görseli yeni sekmede aç
                              </a>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {tip === 3 && (
                  <div className="mt-4">
                    <input
                      type="text"
                      value={cevap?.metinCevap ?? ""}
                      onChange={(e) => updateMetin(soru.id, e.target.value)}
                      maxLength={soru?.maxMetinUzunlugu ?? undefined}
                      placeholder="Cevabınızı yazınız..."
                      className="h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
                    />
                    {soru?.maxMetinUzunlugu ? (
                      <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        Maksimum {soru.maxMetinUzunlugu} karakter
                      </div>
                    ) : null}
                  </div>
                )}

                {tip === 4 && (
                  <div className="mt-4">
                    <textarea
                      value={cevap?.metinCevap ?? ""}
                      onChange={(e) => updateMetin(soru.id, e.target.value)}
                      maxLength={soru?.maxMetinUzunlugu ?? undefined}
                      placeholder="Cevabınızı detaylı şekilde yazınız..."
                      className="min-h-[140px] w-full rounded-md border border-zinc-200 bg-white px-3 py-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
                    />
                    {soru?.maxMetinUzunlugu ? (
                      <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        Maksimum {soru.maxMetinUzunlugu} karakter
                      </div>
                    ) : null}
                  </div>
                )}

                {tip === 5 && (
                  <div className="mt-4">
                    <input
                      type="number"
                      value={cevap?.sayiCevap ?? ""}
                      onChange={(e) => updateSayi(soru.id, e.target.value)}
                      placeholder="Sayısal cevap giriniz..."
                      className="h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
                    />
                  </div>
                )}

                {tip === 6 && (
                  <div className="mt-4">
                    <input
                      type="date"
                      value={cevap?.tarihCevap ?? ""}
                      onChange={(e) => updateTarih(soru.id, e.target.value)}
                      className="h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {msg && (
          <div className="mt-7 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-800 shadow-sm dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
            {msg}
          </div>
        )}

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.reload()}
              disabled={saving}
              className="h-10 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              Temizle
            </button>

            <button
              onClick={handleSubmit}
              disabled={saving || loading}
              className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving ? "Gönderiliyor..." : "Cevapları Gönder"}
            </button>
          </div>
        </div>

        <div className="mt-6 border-t border-zinc-200 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          SAYGILARIMIZLA, <span className="font-semibold">EOS MANAGEMENT</span>
        </div>
      </div>
    </div>
  );
}