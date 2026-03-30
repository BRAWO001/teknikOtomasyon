import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import IletisimDuyuruDosyaPanel from "@/components/IletisimDuyuruDosyaPanel";

function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
}

function extractBackendMsg(err) {
  const data = err?.response?.data;
  if (!data) return null;

  if (data?.errors && typeof data.errors === "object") {
    const flat = Object.entries(data.errors)
      .flatMap(([k, arr]) =>
        Array.isArray(arr) ? arr.map((x) => `${k}: ${x}`) : []
      )
      .slice(0, 8);

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

export default function YeniDuyuruPage() {
  const router = useRouter();

  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [sitesError, setSitesError] = useState("");
  const [siteId, setSiteId] = useState("");

  const [duyuruBaslik, setDuyuruBaslik] = useState("");
  const [duyuruAciklama, setDuyuruAciklama] = useState("");
  const [durum, setDurum] = useState("Beklemede");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [createdDuyuruId, setCreatedDuyuruId] = useState(null);
  const [createdToken, setCreatedToken] = useState(null);

  const [panelStatus, setPanelStatus] = useState({
    uploading: false,
    attaching: false,
    pendingCount: 0,
    hasDuyuruId: false,
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const siteSelectMode = sites.length > 1;

  const publicLink = useMemo(() => {
    if (!createdToken) return "";
    return `eosyonetim.tr/Duyuru/${createdToken}`;
  }, [createdToken]);

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


  const handlePanelStatus = (st) => {
    setPanelStatus(
      st || {
        uploading: false,
        attaching: false,
        pendingCount: 0,
        hasDuyuruId: false,
      }
    );
  };

  const validate = () => {
    if (!siteId) return "Site seçmelisiniz.";
    if (!duyuruBaslik.trim()) return "Duyuru başlığı zorunlu.";
    if (!duyuruAciklama.trim()) return "Duyuru açıklaması zorunlu.";
    return "";
  };

  const handleSubmit = async () => {
    const v = validate();
    if (v) {
      setMsg(v);
      return;
    }

    try {
      setSaving(true);
      setMsg("");
      setCopied(false);

      const payload = {
        siteId: Number(siteId),
        duyuruBaslik: duyuruBaslik.trim(),
        duyuruAciklama: duyuruAciklama.trim(),
        durum: durum?.trim() || "Beklemede",
      };

      const res = await postDataAsync("IletisimDuyuru", payload);

      const createdId = res?.id ?? res?.Id ?? null;
      const token = res?.publicToken ?? res?.PublicToken ?? null;

      if (createdId) setCreatedDuyuruId(Number(createdId));

      if (token) {
        setCreatedToken(token);
        setShowSuccessModal(true);
      } else {
        setMsg("Duyuru oluşturuldu fakat link bilgisi dönmedi.");
      }
    } catch (e) {
      console.error("CREATE DUYURU ERROR:", e);
      const status = e?.response?.status;
      const backendMsg = extractBackendMsg(e);

      if (status === 401) {
        setMsg("Yetkisiz (401). Oturum/token kontrol edin.");
      } else if (status === 403) {
        setMsg("Erişim reddedildi (403). Yetki kontrol edin.");
      } else {
        setMsg(
          backendMsg
            ? `Duyuru oluşturulamadı: ${backendMsg}`
            : "Duyuru oluşturulamadı."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    if (!publicLink) return;

    try {
      await navigator.clipboard.writeText(publicLink);
      setCopied(true);
    } catch (err) {
      console.error("COPY ERROR:", err);
      setMsg("Link kopyalanırken bir hata oluştu.");
    }
  };

  const handleOpenLink = () => {
    if (!publicLink) return;
    window.open(publicLink, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-emerald-300 bg-white shadow-2xl dark:border-emerald-800 dark:bg-zinc-900">
            <div className="rounded-t-3xl bg-emerald-50 px-5 py-4 dark:bg-emerald-900/20">
              <div className="text-base font-bold text-emerald-800 dark:text-emerald-200">
                Duyuru başarıyla oluşturuldu
              </div>
              <div className="mt-1 text-[12px] text-emerald-700 dark:text-emerald-300">
                Aşağıdaki bağlantıyı açabilir veya kopyalayabilirsiniz.
              </div>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
                <div className="mb-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  Yayın Linki
                </div>
                <div className="break-all rounded-xl border border-emerald-200 bg-white px-3 py-3 text-[13px] text-zinc-800 dark:border-emerald-900 dark:bg-zinc-950 dark:text-zinc-100">
                  {publicLink || "-"}
                </div>
              </div>

              {(panelStatus.uploading ||
                panelStatus.attaching ||
                Number(panelStatus.pendingCount || 0) > 0) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                  Dosya işlemleri devam ediyor. Link şimdiden kullanılabilir.
                </div>
              )}

              {copied && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200">
                  Link panoya kopyalandı.
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 rounded-xl cursor-pointer bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Linki Kopyala
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.reload();
                  }}
                  className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                İletişim Görevli • Yeni Duyuru
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()} // ✅ ARTIK GERİ GELİR
              disabled={showSuccessModal}
              className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              ← Geri
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-base font-semibold tracking-tight">
                Yeni Duyuru Oluştur
              </div>
              <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                Duyuru kaydı oluşturun, ardından dosyaları ekleyin.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Site:{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {selectedSiteName ?? "-"}
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

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Site
              </label>

              {siteSelectMode ? (
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  disabled={sitesLoading || showSuccessModal}
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="">
                    {sitesLoading ? "Yükleniyor..." : "Duyuru Sitesi Seçiniz"}
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
              ) : (
                <div className="flex h-10 w-full items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                  {selectedSiteName ?? "-"}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Durum
              </label>
              <select
                value={durum}
                onChange={(e) => setDurum(e.target.value)}
                disabled={showSuccessModal}
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <option value="Beklemede">Beklemede</option>
                <option value="Yayında">Yayında</option>
                <option value="Pasif">Pasif</option>
                <option value="Kapatıldı">Kapatıldı</option>
              </select>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Duyuru Başlığı
              </label>
              <input
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950"
                value={duyuruBaslik}
                onChange={(e) => setDuyuruBaslik(e.target.value)}
                placeholder="Örn: Asansör bakım bilgilendirmesi"
                maxLength={250}
                disabled={showSuccessModal}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Duyuru Açıklaması
              </label>
              <textarea
                className="min-h-[160px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950"
                value={duyuruAciklama}
                onChange={(e) => setDuyuruAciklama(e.target.value)}
                placeholder="Detayları yazınız..."
                maxLength={4000}
                disabled={showSuccessModal}
              />
            </div>
          </div>

          <div className="mt-6">
            <IletisimDuyuruDosyaPanel
              duyuruId={createdDuyuruId}
              onStatusChange={handlePanelStatus}
              disabled={saving || showSuccessModal}
            />
          </div>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/iletisim")}
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
                {saving ? "Kaydediliyor..." : "Duyuruyu Oluştur"}
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