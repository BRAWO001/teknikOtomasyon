import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

const SORU_TIPLERI = [
  { value: 1, label: "Tek Seçim (Radio)" },
  { value: 2, label: "Çoklu Seçim (Checkbox)" },
  { value: 3, label: "Kısa Metin" },
  { value: 4, label: "Uzun Metin" },
  { value: 5, label: "Sayı" },
  { value: 6, label: "Tarih" },
];

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

function createEmptyOption(order = 0) {
  return {
    localId: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    secenekMetni: "",
    siraNo: order,
    aktifMi: true,
  };
}

function createEmptyQuestion(order = 0) {
  return {
    localId: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    baslik: "",
    aciklama: "",
    soruTipi: 1,
    zorunluMu: false,
    siraNo: order,
    aktifMi: true,
    minSecimSayisi: null,
    maxSecimSayisi: 1,
    maxMetinUzunlugu: null,
    secenekler: [createEmptyOption(0), createEmptyOption(1)],
  };
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

export default function YeniAnketPage() {
  const router = useRouter();

  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [sitesError, setSitesError] = useState("");

  const [siteId, setSiteId] = useState("");
  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [aktifMi, setAktifMi] = useState(true);
  const [yayinlandiMi, setYayinlandiMi] = useState(false);
  const [tekrarCevaplanabilirMi, setTekrarCevaplanabilirMi] = useState(false);

  const [sorular, setSorular] = useState([createEmptyQuestion(0)]);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [createdAnketId, setCreatedAnketId] = useState(null);
  const [createdGuid, setCreatedGuid] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSites = async () => {
      try {
        setSitesLoading(true);
        setSitesError("");

        const data = await getDataAsync("SiteAptEvControllerSet/sites");
        if (cancelled) return;

        const list = Array.isArray(data) ? data : [];
        setSites(list);
        setSiteId("");
      } catch (e) {
        console.error("SITES LOAD ERROR:", e);
        if (cancelled) return;

        setSites([]);
        setSiteId("");
        setSitesError("Site listesi alınamadı.");
      } finally {
        if (!cancelled) setSitesLoading(false);
      }
    };

    loadSites();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSite = useMemo(() => {
    const sid = siteId ? Number(siteId) : null;
    if (!sid) return null;
    return sites.find((s) => Number(s?.id ?? s?.Id) === sid) || null;
  }, [sites, siteId]);

  const selectedSiteName = useMemo(() => {
    const s = selectedSite;
    if (!s) return null;
    return s?.ad ?? s?.Ad ?? s?.siteAdi ?? s?.SiteAdi ?? null;
  }, [selectedSite]);

  const publicLink = useMemo(() => {
    if (!createdGuid) return "";
    return `/anketCevap/${createdGuid}`;
  }, [createdGuid]);

  const detailLink = useMemo(() => {
    if (!createdAnketId) return "";
    return `/anket/detay/${createdAnketId}`;
  }, [createdAnketId]);

  const handleAddQuestion = () => {
    setSorular((prev) => [...prev, createEmptyQuestion(prev.length)]);
  };

  const handleRemoveQuestion = (localId) => {
    setSorular((prev) => {
      if (prev.length <= 1) return prev;
      return prev
        .filter((q) => q.localId !== localId)
        .map((q, idx) => ({ ...q, siraNo: idx }));
    });
  };

  const updateQuestion = (localId, patch) => {
    setSorular((prev) =>
      prev.map((q) => {
        if (q.localId !== localId) return q;

        const next = { ...q, ...patch };

        if ("soruTipi" in patch) {
          const tip = Number(patch.soruTipi);

          if (tip === 1) {
            next.minSecimSayisi = 1;
            next.maxSecimSayisi = 1;
            next.maxMetinUzunlugu = null;
            if (!Array.isArray(next.secenekler) || next.secenekler.length < 2) {
              next.secenekler = [createEmptyOption(0), createEmptyOption(1)];
            }
          } else if (tip === 2) {
            next.minSecimSayisi = 1;
            next.maxSecimSayisi =
              next.maxSecimSayisi && next.maxSecimSayisi > 1
                ? next.maxSecimSayisi
                : 2;
            next.maxMetinUzunlugu = null;
            if (!Array.isArray(next.secenekler) || next.secenekler.length < 2) {
              next.secenekler = [createEmptyOption(0), createEmptyOption(1)];
            }
          } else if (tip === 3 || tip === 4) {
            next.minSecimSayisi = null;
            next.maxSecimSayisi = null;
            next.maxMetinUzunlugu = next.maxMetinUzunlugu || (tip === 3 ? 250 : 2000);
            next.secenekler = [];
          } else if (tip === 5 || tip === 6) {
            next.minSecimSayisi = null;
            next.maxSecimSayisi = null;
            next.maxMetinUzunlugu = null;
            next.secenekler = [];
          }
        }

        return next;
      })
    );
  };

  const handleAddOption = (questionLocalId) => {
    setSorular((prev) =>
      prev.map((q) => {
        if (q.localId !== questionLocalId) return q;
        const nextOptions = [...(q.secenekler || [])];
        nextOptions.push(createEmptyOption(nextOptions.length));
        return { ...q, secenekler: nextOptions };
      })
    );
  };

  const handleRemoveOption = (questionLocalId, optionLocalId) => {
    setSorular((prev) =>
      prev.map((q) => {
        if (q.localId !== questionLocalId) return q;
        const current = [...(q.secenekler || [])];
        if (current.length <= 2 && isSelectionType(q.soruTipi)) return q;

        const nextOptions = current
          .filter((x) => x.localId !== optionLocalId)
          .map((x, idx) => ({ ...x, siraNo: idx }));

        return { ...q, secenekler: nextOptions };
      })
    );
  };

  const updateOption = (questionLocalId, optionLocalId, patch) => {
    setSorular((prev) =>
      prev.map((q) => {
        if (q.localId !== questionLocalId) return q;

        return {
          ...q,
          secenekler: (q.secenekler || []).map((opt) =>
            opt.localId === optionLocalId ? { ...opt, ...patch } : opt
          ),
        };
      })
    );
  };

  const validate = () => {
    if (!siteId) return "Site seçmelisiniz.";
    if (!baslik.trim()) return "Anket başlığı zorunlu.";
    if (sorular.length === 0) return "En az 1 soru eklemelisiniz.";

    for (let i = 0; i < sorular.length; i++) {
      const q = sorular[i];
      const no = i + 1;

      if (!q.baslik?.trim()) {
        return `${no}. soru başlığı zorunlu.`;
      }

      if (isSelectionType(q.soruTipi)) {
        const secenekler = (q.secenekler || []).filter((x) => x.secenekMetni?.trim());

        if (secenekler.length < 2) {
          return `${no}. soru için en az 2 seçenek girilmelidir.`;
        }

        if (Number(q.soruTipi) === 1) {
          if (Number(q.maxSecimSayisi || 1) !== 1) {
            return `${no}. soru tek seçim ise maksimum seçim 1 olmalıdır.`;
          }
        }

        if (Number(q.soruTipi) === 2) {
          const min = q.minSecimSayisi == null ? 1 : Number(q.minSecimSayisi);
          const max = q.maxSecimSayisi == null ? secenekler.length : Number(q.maxSecimSayisi);

          if (min <= 0) return `${no}. soru için minimum seçim 1 veya daha büyük olmalıdır.`;
          if (max <= 0) return `${no}. soru için maksimum seçim 1 veya daha büyük olmalıdır.`;
          if (min > max) return `${no}. soru için minimum seçim, maksimum seçimden büyük olamaz.`;
          if (max > secenekler.length) {
            return `${no}. soru için maksimum seçim, seçenek sayısından büyük olamaz.`;
          }
        }
      }

      if (isTextType(q.soruTipi)) {
        if (q.maxMetinUzunlugu != null && Number(q.maxMetinUzunlugu) <= 0) {
          return `${no}. soru için metin uzunluğu 1'den büyük olmalıdır.`;
        }
      }
    }

    return "";
  };

  const buildPayload = () => {
    return {
      siteId: Number(siteId),
      baslik: baslik.trim(),
      aciklama: aciklama.trim() || null,
      aktifMi,
      yayinlandiMi,
      tekrarCevaplanabilirMi,
      sorular: sorular.map((q, idx) => {
        const soruTipi = Number(q.soruTipi);
        const base = {
          baslik: q.baslik.trim(),
          aciklama: q.aciklama?.trim() || null,
          soruTipi,
          zorunluMu: !!q.zorunluMu,
          siraNo: idx,
          aktifMi: !!q.aktifMi,
          minSecimSayisi: isSelectionType(soruTipi)
            ? q.minSecimSayisi == null || q.minSecimSayisi === ""
              ? null
              : Number(q.minSecimSayisi)
            : null,
          maxSecimSayisi: isSelectionType(soruTipi)
            ? q.maxSecimSayisi == null || q.maxSecimSayisi === ""
              ? null
              : Number(q.maxSecimSayisi)
            : null,
          maxMetinUzunlugu: isTextType(soruTipi)
            ? q.maxMetinUzunlugu == null || q.maxMetinUzunlugu === ""
              ? null
              : Number(q.maxMetinUzunlugu)
            : null,
          secenekler: [],
        };

        if (isSelectionType(soruTipi)) {
          base.secenekler = (q.secenekler || [])
            .filter((x) => x.secenekMetni?.trim())
            .map((x, optIdx) => ({
              secenekMetni: x.secenekMetni.trim(),
              siraNo: optIdx,
              aktifMi: true,
            }));
        }

        if (soruTipi === 1) {
          base.minSecimSayisi = 1;
          base.maxSecimSayisi = 1;
        }

        return base;
      }),
    };
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setMsg(validationError);
      return;
    }

    try {
      setSaving(true);
      setMsg("");
      setCopied(false);

      const payload = buildPayload();
      const res = await postDataAsync("anket", payload);

      const newId = res?.id ?? res?.Id ?? null;
      const guid =
        res?.guidLink ??
        res?.GuidLink ??
        res?.publicToken ??
        res?.PublicToken ??
        null;

      if (newId) setCreatedAnketId(Number(newId));
      if (guid) setCreatedGuid(guid);

      setShowSuccessModal(true);
    } catch (e) {
      console.error("CREATE ANKET ERROR:", e);
      const status = e?.response?.status;
      const backendMsg = extractBackendMsg(e);

      if (status === 401) {
        setMsg("Yetkisiz (401). Oturum/token kontrol edin.");
      } else if (status === 403) {
        setMsg("Erişim reddedildi (403). Yetki kontrol edin.");
      } else {
        setMsg(
          backendMsg
            ? `Anket oluşturulamadı: ${backendMsg}`
            : "Anket oluşturulamadı."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    if (!publicLink) return;

    try {
      const full =
        typeof window !== "undefined"
          ? `${window.location.origin}${publicLink}`
          : publicLink;

      await navigator.clipboard.writeText(full);
      setCopied(true);
    } catch (err) {
      console.error("COPY ERROR:", err);
      setMsg("Link kopyalanırken bir hata oluştu.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-emerald-300 bg-white shadow-2xl dark:border-emerald-800 dark:bg-zinc-900">
            <div className="rounded-t-3xl bg-emerald-50 px-5 py-4 dark:bg-emerald-900/20">
              <div className="text-base font-bold text-emerald-800 dark:text-emerald-200">
                Anket başarıyla oluşturuldu
              </div>
              <div className="mt-1 text-[12px] text-emerald-700 dark:text-emerald-300">
                Aşağıdan detay sayfasına geçebilir veya cevaplama linkini kopyalayabilirsiniz.
              </div>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                <div className="mb-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                  Detay Sayfası
                </div>
                <div className="break-all rounded-xl border border-zinc-200 bg-white px-3 py-3 text-[13px] text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                  {detailLink || "-"}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
                <div className="mb-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  Yayın / Cevaplama Linki
                </div>
                <div className="break-all rounded-xl border border-emerald-200 bg-white px-3 py-3 text-[13px] text-zinc-800 dark:border-emerald-900 dark:bg-zinc-950 dark:text-zinc-100">
                  {publicLink || "-"}
                </div>
              </div>

              {copied && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200">
                  Link panoya kopyalandı.
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="rounded-xl cursor-pointer bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Linki Kopyala
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!detailLink) return;
                    router.push(detailLink);
                  }}
                  className="rounded-xl cursor-pointer bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Detaya Git
                </button>

                <button
                  type="button"
                  onClick={() => router.reload()}
                  className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  Yeni Anket Aç
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                Anket Yönetimi • Yeni Anket
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={showSuccessModal}
              className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              ← Geri
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="text-base font-semibold tracking-tight">
                Yeni Anket Oluştur
              </div>
              <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                Site bazlı anket oluşturun, soruları ekleyin ve yayın linkini alın.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Site:{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {selectedSiteName ?? "-"}
                </span>
              </span>
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Soru Sayısı:{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {sorular.length}
                </span>
              </span>
            </div>
          </div>

          {sitesError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {sitesError}
            </div>
          )}

          {msg && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
              {msg}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Site
              </label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                disabled={sitesLoading || showSuccessModal}
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <option value="">
                  {sitesLoading ? "Yükleniyor..." : "Anket Sitesi Seçiniz"}
                </option>

                {sites.map((s) => {
                  const id = s?.id ?? s?.Id;
                  const ad = s?.ad ?? s?.Ad ?? s?.siteAdi ?? s?.SiteAdi;
                  return (
                    <option key={id} value={id}>
                      {ad ?? `Site #${id}`}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Durum
              </label>
              <select
                value={String(yayinlandiMi)}
                onChange={(e) => setYayinlandiMi(e.target.value === "true")}
                disabled={showSuccessModal}
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <option value="false">Taslak</option>
                <option value="true">Yayında</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Aktiflik
              </label>
              <select
                value={String(aktifMi)}
                onChange={(e) => setAktifMi(e.target.value === "true")}
                disabled={showSuccessModal}
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <option value="true">Aktif</option>
                <option value="false">Pasif</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Anket Başlığı
              </label>
              <input
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
                placeholder="Örn: Site Memnuniyet Anketi"
                maxLength={300}
                disabled={showSuccessModal}
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>

            <div className="flex items-end">
              <label className="flex h-10 w-full items-center gap-3 rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <input
                  type="checkbox"
                  checked={tekrarCevaplanabilirMi}
                  onChange={(e) => setTekrarCevaplanabilirMi(e.target.checked)}
                  disabled={showSuccessModal}
                  className="h-4 w-4"
                />
                <span className="text-zinc-700 dark:text-zinc-200">
                  Aynı kişi tekrar cevap gönderebilsin
                </span>
              </label>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
              Anket Açıklaması
            </label>
            <textarea
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              placeholder="Anketle ilgili genel açıklamayı yazınız..."
              maxLength={4000}
              disabled={showSuccessModal}
              className="min-h-[120px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {sorular.map((q, index) => {
            const selectionType = isSelectionType(q.soruTipi);
            const textType = isTextType(q.soruTipi);

            return (
              <div
                key={q.localId}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-sm font-semibold">
                      Soru #{index + 1}
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      Soru tipini seçin, gerekli alanları doldurun.
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                      <input
                        type="checkbox"
                        checked={q.zorunluMu}
                        onChange={(e) =>
                          updateQuestion(q.localId, { zorunluMu: e.target.checked })
                        }
                        disabled={showSuccessModal}
                        className="h-4 w-4"
                      />
                      Zorunlu
                    </label>

                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(q.localId)}
                      disabled={sorular.length <= 1 || showSuccessModal}
                      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
                    >
                      Soruyu Sil
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-12">
                  <div className="xl:col-span-6">
                    <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                      Soru Başlığı
                    </label>
                    <input
                      value={q.baslik}
                      onChange={(e) =>
                        updateQuestion(q.localId, { baslik: e.target.value })
                      }
                      placeholder="Örn: En çok hangi hizmetten memnunsunuz?"
                      maxLength={500}
                      disabled={showSuccessModal}
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
                    />
                  </div>

                  <div className="xl:col-span-3">
                    <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                      Soru Tipi
                    </label>
                    <select
                      value={q.soruTipi}
                      onChange={(e) =>
                        updateQuestion(q.localId, { soruTipi: Number(e.target.value) })
                      }
                      disabled={showSuccessModal}
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      {SORU_TIPLERI.map((tip) => (
                        <option key={tip.value} value={tip.value}>
                          {tip.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="xl:col-span-3">
                    <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                      Sıra No
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={q.siraNo}
                      onChange={(e) =>
                        updateQuestion(q.localId, {
                          siraNo: e.target.value === "" ? 0 : Number(e.target.value),
                        })
                      }
                      disabled={showSuccessModal}
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
                    />
                  </div>

                  <div className="xl:col-span-12">
                    <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                      Soru Açıklaması
                    </label>
                    <textarea
                      value={q.aciklama}
                      onChange={(e) =>
                        updateQuestion(q.localId, { aciklama: e.target.value })
                      }
                      placeholder="İsteğe bağlı açıklama..."
                      maxLength={4000}
                      disabled={showSuccessModal}
                      className="min-h-[90px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
                    />
                  </div>
                </div>

                {selectionType && (
                  <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm font-semibold">
                          Soru Seçenekleri
                        </div>
                        <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                          En az 2 seçenek girin. Çoklu seçimde min/max belirleyebilirsiniz.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddOption(q.localId)}
                        disabled={showSuccessModal}
                        className="rounded-md bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        + Seçenek Ekle
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
                      <div className="xl:col-span-3">
                        <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                          Min Seçim
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={q.minSecimSayisi ?? ""}
                          onChange={(e) =>
                            updateQuestion(q.localId, {
                              minSecimSayisi:
                                e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          disabled={Number(q.soruTipi) === 1 || showSuccessModal}
                          className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950"
                        />
                      </div>

                      <div className="xl:col-span-3">
                        <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                          Max Seçim
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={q.maxSecimSayisi ?? ""}
                          onChange={(e) =>
                            updateQuestion(q.localId, {
                              maxSecimSayisi:
                                e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          disabled={Number(q.soruTipi) === 1 || showSuccessModal}
                          className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950"
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {(q.secenekler || []).map((opt, optIndex) => (
                        <div
                          key={opt.localId}
                          className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-3 xl:grid-cols-12 dark:border-zinc-800 dark:bg-zinc-900"
                        >
                          <div className="xl:col-span-1 flex items-center text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            {optIndex + 1}.
                          </div>

                          <div className="xl:col-span-9">
                            <input
                              value={opt.secenekMetni}
                              onChange={(e) =>
                                updateOption(q.localId, opt.localId, {
                                  secenekMetni: e.target.value,
                                })
                              }
                              placeholder={`Seçenek ${optIndex + 1}`}
                              maxLength={500}
                              disabled={showSuccessModal}
                              className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
                            />
                          </div>

                          <div className="xl:col-span-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(q.localId, opt.localId)}
                              disabled={
                                (q.secenekler || []).length <= 2 || showSuccessModal
                              }
                              className="h-10 w-full rounded-md border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {textType && (
                  <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
                    <div className="text-sm font-semibold">Metin Ayarları</div>
                    <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      Cevap uzunluğu sınırı vermek isterseniz aşağıyı doldurun.
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-4">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                          Maks. Karakter
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={q.maxMetinUzunlugu ?? ""}
                          onChange={(e) =>
                            updateQuestion(q.localId, {
                              maxMetinUzunlugu:
                                e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          disabled={showSuccessModal}
                          className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {isNumberType(q.soruTipi) && (
                  <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300">
                    Bu soru cevaplama ekranında sayısal giriş olarak gösterilecektir.
                  </div>
                )}

                {isDateType(q.soruTipi) && (
                  <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300">
                    Bu soru cevaplama ekranında tarih seçimi olarak gösterilecektir.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-white p-4 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <button
            type="button"
            onClick={handleAddQuestion}
            disabled={showSuccessModal}
            className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
          >
            + Yeni Soru Ekle
          </button>
        </div>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/anket")}
              disabled={showSuccessModal}
              className="h-10 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              Vazgeç
            </button>

            <button
              onClick={handleSubmit}
              disabled={saving || sitesLoading || showSuccessModal}
              className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving ? "Kaydediliyor..." : "Anketi Oluştur"}
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