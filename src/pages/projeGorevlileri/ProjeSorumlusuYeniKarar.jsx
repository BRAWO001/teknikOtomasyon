// src/pages/YonetimKurulu/ProjeSorumlusuYeniKarar.jsx
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

export default function ProjeSorumlusuYeniKararPage() {
  const router = useRouter();

  // =========================
  // Personel (cookie)
  // =========================
  const [personel, setPersonel] = useState(null);
  const personelKodu = useMemo(() => {
    const v = personel?.personelKodu ?? personel?.PersonelKodu ?? null;
    return v ? String(v) : null;
  }, [personel]);

  // =========================
  // Site (otomatik)
  // =========================
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");
  const [sitesLoading, setSitesLoading] = useState(false);
  const [sitesError, setSitesError] = useState("");

  const selectedSite = useMemo(() => {
    const sid = siteId ? Number(siteId) : null;
    if (!sid) return null;
    return sites.find((x) => Number(x.siteId) === sid) || null;
  }, [sites, siteId]);

  const selectedSiteName = selectedSite?.site?.ad ?? null;

  const isSingleSiteLocked = useMemo(() => {
    return Array.isArray(sites) && sites.length === 1;
  }, [sites]);

  // =========================
  // Üyeler
  // =========================
  const [uyeler, setUyeler] = useState([]);
  const [uyelerLoading, setUyelerLoading] = useState(false);
  const [uyelerError, setUyelerError] = useState("");

  // =========================
  // Form
  // =========================
  const [kararKonusu, setKararKonusu] = useState("");
  const [kararAciklamasi, setKararAciklamasi] = useState("");

  // seçilen üyeler
  const [selectedPersonelIds, setSelectedPersonelIds] = useState([]);
  // proje sorumlusu (seçilen üyelerden)
  const [projeSorumlusuId, setProjeSorumlusuId] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // =========================
  // Cookie oku
  // =========================
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const c = getClientCookie("PersonelUserInfo");
      if (!c) {
        // istersen login'e yönlendir
        // router.replace("/");
        return;
      }
      const parsed = JSON.parse(c);
      setPersonel(parsed?.personel ?? parsed);
    } catch (e) {
      console.error("PersonelUserInfo parse error:", e);
      // router.replace("/");
    }
  }, []);

  // =========================
  // Site listesi -> otomatik seç
  // GET /api/projeYonetimKurulu/site/personel/{personelKodu}
  // =========================
  useEffect(() => {
    if (!personelKodu) return;

    let cancelled = false;

    const loadSites = async () => {
      try {
        setSitesLoading(true);
        setSitesError("");

        const list = await getDataAsync(
          `ProjeYonetimKurulu/site/personel/${encodeURIComponent(personelKodu)}`
        );

        if (cancelled) return;

        const normalized = Array.isArray(list) ? list : list ? [list] : [];
        setSites(normalized);

        // otomatik seçim:
        // - tek site => o
        // - birden fazla => ilkini seç (istersen burada default mantığı eklenebilir)
        const firstSiteId = normalized?.[0]?.siteId;
        setSiteId(firstSiteId ? String(firstSiteId) : "");
      } catch (e) {
        console.error("SITE LIST ERROR:", e);
        if (cancelled) return;
        setSites([]);
        setSiteId("");
        setSitesError("Site bilgileri alınamadı. (personelKodu / endpoint kontrol)");
      } finally {
        if (!cancelled) setSitesLoading(false);
      }
    };

    loadSites();
    return () => {
      cancelled = true;
    };
  }, [personelKodu]);

  // =========================
  // Üyeler getir
  // GET /api/projeYonetimKurulu/site/{siteId}/uyeler
  // =========================
  useEffect(() => {
    if (!siteId) return;

    let cancelled = false;

    const loadUyeler = async () => {
      try {
        setUyelerLoading(true);
        setUyelerError("");

        const list = await getDataAsync(`ProjeYonetimKurulu/site/${siteId}/uyeler`);

        if (cancelled) return;

        const normalized = Array.isArray(list) ? list : list ? [list] : [];
        setUyeler(normalized);

        // site değişince seçimleri sıfırla
        setSelectedPersonelIds([]);
        setProjeSorumlusuId("");
      } catch (e) {
        console.error("UYELER GET ERROR:", e);
        if (cancelled) return;
        setUyeler([]);
        setUyelerError("Üyeler alınamadı.");
      } finally {
        if (!cancelled) setUyelerLoading(false);
      }
    };

    loadUyeler();
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  // =========================
  // Helpers
  // =========================
  const formatUye = (u) => {
    const p = u?.personel;
    if (!p) return `Personel #${u?.personelId ?? "?"}`;
    return `${p.ad ?? ""} ${p.soyad ?? ""}`.trim();
  };

  const toggleSelect = (pid) => {
    const id = Number(pid);
    if (!id) return;

    setSelectedPersonelIds((prev) => {
      const has = prev.includes(id);
      const next = has ? prev.filter((x) => x !== id) : [...prev, id];

      // proje sorumlusu seçili kişiyi kaldırdıysa sıfırla
      if (has && Number(projeSorumlusuId) === id) setProjeSorumlusuId("");
      return next;
    });
  };

  const selectedUyeOptions = useMemo(() => {
    const selectedSet = new Set(selectedPersonelIds.map(Number));
    return uyeler
      .filter((u) => selectedSet.has(Number(u.personelId)))
      .map((u) => ({ id: Number(u.personelId), label: formatUye(u) }));
  }, [uyeler, selectedPersonelIds]);

  // =========================
  // Validate
  // =========================
  const validate = () => {
    if (!siteId) return "Site bilgisi bulunamadı.";
    if (!selectedSiteName) return "Site adı bulunamadı.";
    if (!selectedPersonelIds.length) return "En az 1 üye seçmelisiniz.";
    if (!projeSorumlusuId) return "Proje sorumlusu seçmelisiniz.";
    if (!selectedPersonelIds.includes(Number(projeSorumlusuId)))
      return "Proje sorumlusu, seçilen üyelerden biri olmalı.";
    if (!kararKonusu.trim()) return "Karar konusu zorunlu.";
    if (!kararAciklamasi.trim()) return "Karar açıklaması zorunlu.";
    return "";
  };

  // =========================
  // Submit
  // POST /api/projeYonetimKurulu/karar
  // =========================
  const handleSubmit = async () => {
    const v = validate();
    if (v) {
      setMsg(v);
      return;
    }

    try {
      setSaving(true);
      setMsg("");

      const sorumluLabel =
        selectedUyeOptions.find((x) => Number(x.id) === Number(projeSorumlusuId))
          ?.label || "";

      // açıklamaya proje sorumlusu satırı ekleyelim (senin örneğin gibi)
      const finalAciklama = `Proje Sorumlusu: ${sorumluLabel}\n\n${kararAciklamasi.trim()}`;

      const payload = {
        siteId: Number(siteId),
        kararKonusu: kararKonusu.trim(),
        kararAciklamasi: finalAciklama,
        onerenPersonelIdler: selectedPersonelIds,
      };

      const res = await postDataAsync("ProjeYonetimKurulu/karar", payload);

      const token = res?.publicToken;
      if (token) {
        router.push(`/projeGorevlileri`);
        return;
      }

      router.push("/projeGorevlileri");
    } catch (e) {
      console.error("CREATE KARAR ERROR:", e);
      setMsg("Karar oluşturulamadı. (Yetki/endpoint/validasyon kontrol et)");
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------------------
  // JSX
  // ------------------------------------------------------
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* =========================================================
          ✅ KURUMSAL STICKY HEADER
         ========================================================= */}
      <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-5 px-4 py-3">
          <div className="flex items-center gap-3">
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

            <div className="leading-tight">
              <div className="text-sm font-bold tracking-wide">
                EOS MANAGEMENT
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Proje Sorumlusu • Yeni Karar Talebi
              </div>
            </div>
          </div>

          <div className="hidden max-w-xl items-center gap-2 md:flex">
            <span className="rounded-full border border-zinc-200 bg-white px-4 py-1 text-[11px] font-medium text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              Kararlar onay süreçlerine uygun şekilde oluşturulur ve kayıt altına alınır.
            </span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Yetkili üyeler düşünce/oy girebilir.
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Üst bar */}
        <div className="mb-4 flex items-start justify-between gap-2">
          

          <div className="text-right text-[12px] text-zinc-500 dark:text-zinc-400">
            {personel ? (
              <>
                <div className="font-medium text-zinc-700 dark:text-zinc-200">
                  {personel?.ad ?? personel?.Ad ?? ""}{" "}
                  {personel?.soyad ?? personel?.Soyad ?? ""}
                </div>
                
              </>
            ) : (
              <div className="text-[11px]">Kullanıcı okunuyor...</div>
            )}
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* Başlık satırı */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-base font-semibold tracking-tight">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                  🏛️
                </span>
                Yeni Karar Talebi
              </div>

              <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                Karar konusu, açıklama ve söz sahibi üyeleri seçerek kayıt oluşturun.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                Site:{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {sitesLoading ? "Yükleniyor..." : selectedSiteName ?? "-"}
                </span>
              </span>

              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Seçili Üye:{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {selectedPersonelIds.length}
                </span>
              </span>

              {isSingleSiteLocked && (
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                  Otomatik kilitli
                </span>
              )}
            </div>
          </div>

          {/* Hatalar */}
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

          {/* Site (otomatik) + Proje sorumlusu */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Site (otomatik)
              </label>

              <div className="flex h-10 w-full items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                {sitesLoading
                  ? "Yükleniyor..."
                  : selectedSiteName || (siteId ? `Site #${siteId}` : "Site bulunamadı")}
              </div>

              <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                Proje sorumlusu ekranında site otomatik belirlenir.
              </div>

              <input type="hidden" name="siteId" value={siteId} />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Proje Sorumlusu (Seçilen üyelerden)
              </label>

              <select
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                value={projeSorumlusuId}
                onChange={(e) => setProjeSorumlusuId(e.target.value)}
                disabled={!selectedPersonelIds.length}
              >
                <option value="">Seçiniz...</option>
                {selectedUyeOptions.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>

              <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                Önce üyeleri seçiniz.
              </div>
            </div>
          </div>

          {/* Üyeler */}
          <div className="mt-7">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-sm font-semibold">Söz Sahibi Üyeler</div>
                <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Seçilen kişiler bu karar için düşünce/oy girebilir.
                </div>
              </div>
            </div>

            {uyelerLoading && (
              <div className="mt-3 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Üyeler yükleniyor...
              </div>
            )}

            {uyelerError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100">
                {uyelerError}
              </div>
            )}

            {!uyelerLoading && !uyelerError && uyeler.length > 0 && (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {uyeler.map((u) => {
                  const pid = Number(u.personelId);
                  const checked = selectedPersonelIds.includes(pid);

                  return (
                    <label
                      key={u.id}
                      className={[
                        "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm shadow-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-900",
                        checked
                          ? "border-zinc-400 bg-white dark:border-zinc-600 dark:bg-zinc-950"
                          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
                      ].join(" ")}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(pid)}
                        className="h-4 w-4"
                      />

                      <div className="min-w-0">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {formatUye(u)}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Yetkili üye
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {!uyelerLoading && !uyelerError && uyeler.length === 0 && (
              <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Bu site için üye bulunamadı.
              </div>
            )}
          </div>

          {/* Form */}
          <div className="mt-7 grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Karar Konusu
              </label>
              <input
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                value={kararKonusu}
                onChange={(e) => setKararKonusu(e.target.value)}
                placeholder="Örn: Bütçe onayı"
                maxLength={200}
              />
              <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                Kısa ve resmi bir başlık kullanın.
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Karar Açıklaması
              </label>
              <textarea
                className="min-h-[160px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                value={kararAciklamasi}
                onChange={(e) => setKararAciklamasi(e.target.value)}
                placeholder="Detayları yaz..."
                maxLength={2000}
              />
              <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                Detayları maddeleyerek yazmanız önerilir.
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Kaydetmeden önce seçimleri kontrol ediniz.
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/YonetimKurulu")}
                className="h-10 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium shadow-sm transition hover:bg-zinc-50 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                Vazgeç
              </button>

              <button
                onClick={handleSubmit}
                disabled={saving || sitesLoading || uyelerLoading}
                className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {saving ? "Kaydediliyor..." : "Kararı Oluştur"}
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
