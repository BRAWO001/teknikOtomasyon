




// src/pages/YonetimKurulu/yeni.jsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

export default function YonetimKuruluYeniKararPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);

  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");
  const selectedSite = useMemo(
    () => sites.find((x) => String(x.siteId) === String(siteId)) || null,
    [sites, siteId]
  );

  const [uyeler, setUyeler] = useState([]);
  const [uyelerLoading, setUyelerLoading] = useState(false);
  const [uyelerError, setUyelerError] = useState(null);

  const [kararKonusu, setKararKonusu] = useState("");
  const [kararAciklamasi, setKararAciklamasi] = useState("");

  const [selectedPersonelIds, setSelectedPersonelIds] = useState([]);
  const [projeSorumlusuId, setProjeSorumlusuId] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // cookie -> personel
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cookie = getClientCookie("PersonelUserInfo");
      if (!cookie) return;
      const parsed = JSON.parse(cookie);
      const p = parsed?.personel ?? parsed;
      setPersonel(p);
    } catch (e) {
      console.error("PersonelUserInfo parse error:", e);
    }
  }, []);

  // site listesi
  useEffect(() => {
    if (!personel?.personelKodu) return;

    let cancelled = false;
    const loadSites = async () => {
      try {
        const list = await getDataAsync(
          `ProjeYonetimKurulu/site/personel/${encodeURIComponent(personel.personelKodu)}`
        );
        if (cancelled) return;

        const normalized = Array.isArray(list) ? list : list ? [list] : [];
        setSites(normalized);

        const firstSiteId = normalized?.[0]?.siteId;
        if (firstSiteId) setSiteId(String(firstSiteId));
      } catch (e) {
        console.error("SITE LIST ERROR:", e);
        if (!cancelled) setSites([]);
      }
    };

    loadSites();
    return () => {
      cancelled = true;
    };
  }, [personel?.personelKodu]);

  // üyeleri getir
  useEffect(() => {
    if (!siteId) return;

    let cancelled = false;
    const loadUyeler = async () => {
      try {
        setUyelerLoading(true);
        setUyelerError(null);

        const list = await getDataAsync(`ProjeYonetimKurulu/site/${siteId}/uyeler`);
        if (cancelled) return;

        const normalized = Array.isArray(list) ? list : list ? [list] : [];
        setUyeler(normalized);

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

  const formatUye = (u) => {
    const p = u?.personel;
    if (!p) return `Personel #${u.personelId}`;
    return `${p.ad ?? ""} ${p.soyad ?? ""}`.trim();
  };

  const toggleSelect = (pid) => {
    const id = Number(pid);
    if (!id) return;

    setSelectedPersonelIds((prev) => {
      const has = prev.includes(id);
      const next = has ? prev.filter((x) => x !== id) : [...prev, id];

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

  const validate = () => {
    if (!siteId) return "Proje bilgisi bulunamadı.";
    if (!selectedSite?.site?.ad) return "Proje bulunamadı.";
    if (!selectedPersonelIds.length) return "En az 1 üye seçmelisiniz.";
    if (!projeSorumlusuId) return "Proje sorumlusu seçmelisiniz.";
    if (!selectedPersonelIds.includes(Number(projeSorumlusuId)))
      return "Proje sorumlusu seçtiğin kişi, seçilen üyeler arasında olmalı.";
    if (!kararKonusu.trim()) return "Karar konusu zorunlu.";
    if (!kararAciklamasi.trim()) return "Karar açıklaması zorunlu.";
    return null;
  };

  const handleSubmit = async () => {
    const v = validate();
    if (v) {
      setMsg(v);
      return;
    }

    try {
      setSaving(true);
      setMsg(null);

      const sorumluLabel =
        selectedUyeOptions.find((x) => Number(x.id) === Number(projeSorumlusuId))?.label || "";

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
        router.push(`/YonetimKurulu/karar/${token}`);
        return;
      }
      router.push("/YonetimKurulu");
    } catch (e) {
      console.error("CREATE KARAR ERROR:", e);
      setMsg("Karar oluşturulamadı. (Yetki/endpoint/validasyon kontrol et)");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Üst bar */}
        <div className="mb-4 flex items-start justify-between gap-2">
          <button
            className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium shadow-sm transition hover:bg-zinc-50 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            onClick={() => router.push("/YonetimKurulu")}
          >
            ← Geri
          </button>

          <div className="text-right text-[12px] text-zinc-500 dark:text-zinc-400">
            {personel ? (
              <>
                <div className="font-medium text-zinc-700 dark:text-zinc-200">
                  {personel.ad ?? ""} {personel.soyad ?? ""}
                </div>
                <div className="text-[11px]">Rol: {personel.rol}</div>
              </>
            ) : null}
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-center gap-5">
            <div className="hidden   sm:flex items-center gap-2">
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                {selectedSite?.site?.ad ?? "Proje"}
              </span>
            </div>
            <div>
              <div className="text-base text-center font-semibold tracking-tight">Yeni Karar</div>
              
            </div>

            
          </div>

          {msg && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
              {msg}
            </div>
          )}

          {/* Proje + Sorumlu */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Proje
              </label>

              <div className="h-9 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm flex items-center text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                {selectedSite?.site?.ad ?? "Site seçilmedi"}
              </div>

              <input type="hidden" name="siteId" value={siteId} />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Proje Sorumlusu (Seçilen üyelerden)
              </label>

              <select
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
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
                Önce üyeleri seç.
              </div>
            </div>
          </div>

          {/* Üyeler */}
          <div className="mt-6">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-sm font-semibold">Söz Sahibi Üyeler</div>
                <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Seçilen kişiler bu karar için düşünce/oy girebilir.
                </div>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Seçili: <span className="font-semibold">{selectedPersonelIds.length}</span>
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
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm shadow-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                        checked
                          ? "border-zinc-400 bg-white dark:border-zinc-600 dark:bg-zinc-950"
                          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                      }`}
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
                       
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {!uyelerLoading && !uyelerError && uyeler.length === 0 && (
              <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Bu proje için üye bulunamadı.
              </div>
            )}
          </div>

          {/* Form */}
          <div className="mt-6 grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Karar Konusu
              </label>
              <input
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                value={kararKonusu}
                onChange={(e) => setKararKonusu(e.target.value)}
                placeholder="Örn: Bütçe onayı"
                maxLength={200}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Karar Açıklaması
              </label>
              <textarea
                className="min-h-[150px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                value={kararAciklamasi}
                onChange={(e) => setKararAciklamasi(e.target.value)}
                placeholder="Detayları yaz..."
                maxLength={2000}
              />
              
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-between gap-2">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Kaydetmeden önce seçimleri kontrol et.
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/YonetimKurulu")}
                className="h-9 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium shadow-sm transition hover:bg-zinc-50 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                Vazgeç
              </button>

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="h-9 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
