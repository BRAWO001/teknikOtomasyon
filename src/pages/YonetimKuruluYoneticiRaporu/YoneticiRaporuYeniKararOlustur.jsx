// src/pages/YonetimKuruluYoneticiRaporu/YoneticiRaporuYeniKararOlustur.jsx
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

/* ===== helpers ===== */
function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
}
function escapeHtml(str) {
  // kullanıcı metni html enjekte etmesin, önizleme/pdfe temiz girsin
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function normalizeSites(input) {
  // hedef: [{ siteId, site:{ad} }]
  const list = Array.isArray(input) ? input : input ? [input] : [];
  return list
    .map((x) => {
      const siteId = x?.siteId ?? x?.SiteId ?? x?.id ?? x?.Id ?? null;
      const ad = x?.site?.ad ?? x?.Site?.Ad ?? x?.ad ?? x?.Ad ?? null;
      if (!siteId) return null;
      return { siteId: Number(siteId), site: { ad: ad ?? `Site #${siteId}` } };
    })
    .filter(Boolean);
}
/* =================== */

export default function YoneticiRaporuYeniKararOlusturPage() {
  const router = useRouter();

  // =========================
  // Sites
  // =========================
  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [sitesError, setSitesError] = useState(null);

  const [siteId, setSiteId] = useState("");

  const selectedSite = useMemo(
    () => sites.find((x) => String(x.siteId) === String(siteId)) || null,
    [sites, siteId],
  );

  // =========================
  // Üyeler
  // =========================
  const [uyeler, setUyeler] = useState([]);
  const [uyelerLoading, setUyelerLoading] = useState(false);
  const [uyelerError, setUyelerError] = useState(null);

  const [selectedPersonelIds, setSelectedPersonelIds] = useState([]);
  const [projeSorumlusuId, setProjeSorumlusuId] = useState("");

  // =========================
  // Form
  // =========================
  const [kararKonusu, setKararKonusu] = useState("");
  const [kararAciklamasi, setKararAciklamasi] = useState("");

  // ✅ Yeni: Tutanak üst bilgileri
  const [toplantiYeri, setToplantiYeri] = useState("");
  const [toplantiTarihi, setToplantiTarihi] = useState(""); // yyyy-mm-dd
  const [toplantiSaati, setToplantiSaati] = useState(""); // hh:mm
  const [kararNo, setKararNo] = useState(""); // default 2026/...
  const [katilanlar, setKatilanlar] = useState("");

  // ✅ Önizleme modal
  const [previewOpen, setPreviewOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // =========================
  // 1) Site listesini çek
  // =========================
  useEffect(() => {
    let cancelled = false;

    const loadSites = async () => {
      try {
        setSitesLoading(true);
        setSitesError(null);

        const data = await getDataAsync("SiteAptEvControllerSet/sites");
        if (cancelled) return;

        const normalized = normalizeSites(data);
        setSites(normalized);

        const firstSiteId = normalized?.[0]?.siteId;
        setSiteId(firstSiteId ? String(firstSiteId) : "");
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

  // ✅ Karar konusu otomatik (site adı geldiğinde)
  useEffect(() => {
    const siteAdi = selectedSite?.site?.ad ?? "";
    if (!siteAdi) return;

    const konu = `${siteAdi.toUpperCase()}
SİTE YÖNETİCİLİĞİ
YÖNETİM KURULU TOPLANTI TUTANAĞI`;

    setKararKonusu((prev) =>
      !prev || prev.includes("SİTE YÖNETİCİLİĞİ") ? konu.trim() : prev,
    );
  }, [selectedSite?.site?.ad]);

  // ✅ Karar no default
  useEffect(() => {
    setKararNo((prev) => (prev?.trim() ? prev : "2026/..."));
  }, []);

  // =========================
  // 2) Site seçilince üyeleri çek
  // =========================
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

        // site değişince reset
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
    if (!p) return `Personel #${u.personelId}`;
    return `${p.ad ?? ""} ${p.soyad ?? ""}`.trim();
  };

  const toggleSelect = (pid) => {
    const id = Number(pid);
    if (!id) return;

    setSelectedPersonelIds((prev) => {
      const has = prev.includes(id);
      const next = has ? prev.filter((x) => x !== id) : [...prev, id];

      // ✅ proje sorumlusu otomatik: ilk seçilen
      if (!next.length) {
        setProjeSorumlusuId("");
      } else {
        const current = Number(projeSorumlusuId);
        if (!current || !next.includes(current)) setProjeSorumlusuId(String(next[0]));
      }
      return next;
    });
  };

  const selectedUyeOptions = useMemo(() => {
    const set = new Set(selectedPersonelIds.map(Number));
    return uyeler
      .filter((u) => set.has(Number(u.personelId)))
      .map((u) => ({ id: Number(u.personelId), label: formatUye(u) }));
  }, [uyeler, selectedPersonelIds]);

  // ✅ seçilen değişince sorumlu ilk kişi
  useEffect(() => {
    if (!selectedPersonelIds.length) {
      if (projeSorumlusuId) setProjeSorumlusuId("");
      return;
    }
    const first = String(selectedPersonelIds[0]);
    if (String(projeSorumlusuId) !== first) setProjeSorumlusuId(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPersonelIds]);

  const formatDateTRFromISO = (iso) => {
    if (!iso || typeof iso !== "string") return "";
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return iso;
    return `${d}.${m}.${y}`;
  };

  // ✅ Kalıp metni (HTML) üret
  const buildTutanakAciklama = () => {
    const siteAdi = selectedSite?.site?.ad ?? "";
    const tarihTR = formatDateTRFromISO(toplantiTarihi);
    const saat = (toplantiSaati || "").trim();

    const baseKatilanlar = (katilanlar || "").trim();
    const katilanlarText = baseKatilanlar
      ? baseKatilanlar
      : selectedUyeOptions.map((x) => x.label).join(", ");

    const toplantiyeriFinal = (toplantiYeri || "").trim() || "Toplantı Salonu";
    const kararNoFinal = (kararNo || "").trim() || "2026/...";

    const userLines = (kararAciklamasi || "")
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => `<div style="margin-bottom:6px;">${escapeHtml(x)}</div>`)
      .join("");

    return `
<div style="font-family:Arial, sans-serif; line-height:1.6">

  <div style="text-align:center; font-weight:bold;">
    ${escapeHtml(siteAdi.toUpperCase())}<br/>
    SİTE YÖNETİCİLİĞİ<br/>
    YÖNETİM KURULU TOPLANTI TUTANAĞI
  </div>

  <br/>

  <div><b>TOPLANTI YERİ:</b> ${escapeHtml(toplantiyeriFinal)}</div>
  <div><b>TOPLANTI TARİHİ:</b> ${escapeHtml(tarihTR)}</div>
  <div><b>TOPLANTI SAATİ:</b> ${escapeHtml(saat)}</div>
  <div><b>KARAR NO:</b> ${escapeHtml(kararNoFinal)}</div>
  <div><b>TOPLANTIYA KATILANLAR:</b> ${escapeHtml(katilanlarText)}</div>

  <br/>

  <div>
    Yönetim planının 30.3 maddesi ve KMK'nın 73. maddesi hükmünce Kat Mülkiyeti Kanunu 27 ve
    devamı hükümlerince toplu yapı kat malikleri kurulu yerine görev yapmak üzere atanmış yukarıda
    isimleri yazılı kişilerce toplanılmıştır.
  </div>

  <br/>

  <div>
    Yönetim Kurulu'nun yukarıda yazılı üyelerin iştiraki ile Yönetim Kurulu toplantısında;
  </div>

  <br/>

  <div>
    ${userLines || `<div style="margin-bottom:6px;">(Karar metni girilmedi)</div>`}
  </div>

</div>
`;
  };

  const validate = () => {
    if (!siteId) return "Site seçmelisiniz.";
    if (!selectedSite?.site?.ad) return "Site bulunamadı.";
    if (!selectedPersonelIds.length) return "En az 1 üye seçmelisiniz.";

    if (!projeSorumlusuId) return "Proje sorumlusu seçilemedi (üye seçiniz).";
    if (!selectedPersonelIds.includes(Number(projeSorumlusuId)))
      return "Proje sorumlusu seçilen üyeler arasında olmalı.";

    if (!toplantiTarihi.trim()) return "Toplantı tarihi zorunlu.";
    if (!toplantiSaati.trim()) return "Toplantı saati zorunlu.";
    if (!((kararNo || "").trim() || "2026/...").trim()) return "Karar no zorunlu.";

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

      const finalAciklama = buildTutanakAciklama();

      const payload = {
        siteId: Number(siteId),
        kararKonusu: kararKonusu.trim(),
        kararAciklamasi: finalAciklama, // ✅ HTML olarak gidiyor
        onerenPersonelIdler: selectedPersonelIds,
      };

      await postDataAsync("ProjeYonetimKurulu/karar", payload);

      router.push("/YonetimKuruluYoneticiRaporu");
    } catch (e) {
      console.error("CREATE KARAR ERROR:", e);
      setMsg("Karar oluşturulamadı. (Yetki/endpoint/validasyon kontrol et)");
    } finally {
      setSaving(false);
    }
  };

  const previewText = useMemo(() => buildTutanakAciklama(), [
    selectedSite,
    toplantiYeri,
    toplantiTarihi,
    toplantiSaati,
    kararNo,
    katilanlar,
    projeSorumlusuId,
    selectedUyeOptions,
    kararAciklamasi,
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* ✅ KURUMSAL STICKY HEADER (birebir) */}
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
              <div className="text-sm font-bold tracking-wide">EOS MANAGEMENT</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Yönetici Raporu • Yeni Karar Oluşturma
              </div>
            </div>
          </div>

          <div className="hidden max-w-xl items-center gap-2 md:flex">
            <span className="rounded-full border border-zinc-200 bg-white px-4 py-1 text-[11px] font-medium text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              Kararlar onay süreçlerine uygun şekilde oluşturulur ve kayıt altına alınır.
            </span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Yetkili üyeler görüş ve oy girişi yapabilir.
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Üst bar */}
        <div className="mb-4 flex items-start justify-between gap-2">
          <button
            className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium shadow-sm transition hover:bg-zinc-50 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            onClick={() => router.push("/YonetimKuruluYoneticiRaporu")}
          >
            ← Geri
          </button>

          <div className="text-right text-[12px] text-zinc-500 dark:text-zinc-400">
            {/* yönetici raporu sayfasında personel yok — boş bırak */}
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* Başlık satırı */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-base font-semibold tracking-tight">Yeni Karar</div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                {selectedSite?.site?.ad ?? "Site"}
              </span>
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Seçili Üye:{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {selectedPersonelIds.length}
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

          {/* ✅ Proje/Site: SELECT */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Proje / Site
              </label>

              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                disabled={sitesLoading}
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
              >
                <option value="">{sitesLoading ? "Yükleniyor..." : "Seçiniz..."}</option>
                {sites.map((s) => (
                  <option key={s.siteId} value={s.siteId}>
                    {s.site?.ad ?? `Site #${safeText(s.siteId)}`}
                  </option>
                ))}
              </select>

              <input type="hidden" name="siteId" value={siteId} />
            </div>

            {/* ✅ Proje sorumlusu alanı TAMAMEN GİZLİ (UI yok) */}
            <input type="hidden" value={projeSorumlusuId} readOnly />
          </div>

          {/* ✅ Tutanak Üst Bilgileri */}
          <div className="mt-7">
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                  Toplantı Yeri
                </label>
                <input
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                  value={toplantiYeri}
                  onChange={(e) => setToplantiYeri(e.target.value)}
                  placeholder="Toplantı Salonu"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                  Toplantı Tarihi
                </label>
                <input
                  type="date"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                  value={toplantiTarihi}
                  onChange={(e) => setToplantiTarihi(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                  Toplantı Saati
                </label>
                <input
                  type="time"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                  value={toplantiSaati}
                  onChange={(e) => setToplantiSaati(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                  Karar No
                </label>
                <input
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                  value={kararNo}
                  onChange={(e) => setKararNo(e.target.value)}
                  placeholder="2026/..."
                />
              </div>
            </div>
          </div>

          {/* Üyeler */}
          <div className="mt-7">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-sm font-semibold">Yönetim Kurulu Üyelerini Seçiniz</div>
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
                      key={u.id ?? u.personelId}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm shadow-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
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
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Yetkili üye
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {!uyelerLoading && !uyelerError && siteId && uyeler.length === 0 && (
              <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Bu proje için üye bulunamadı.
              </div>
            )}

            {!siteId && (
              <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Üyeleri görmek için önce site seçiniz.
              </div>
            )}
          </div>

          {/* Form */}
          <div className="mt-7 grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Karar Konusu
              </label>
              <textarea
                className="min-h-[90px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                value={kararKonusu}
                onChange={(e) => setKararKonusu(e.target.value)}
                placeholder="Site adı yüklendiğinde otomatik oluşturulacaktır"
                maxLength={400}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Karar Açıklaması (Karar Metni)
              </label>
              <textarea
                className="min-h-[180px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                value={kararAciklamasi}
                onChange={(e) => setKararAciklamasi(e.target.value)}
                placeholder="Karar maddelerini yaz... (Örn: 1) ... 2) ...)"
                maxLength={5000}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Önizleme alıp kontrol edin, sonra kaydedin.
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewOpen(true)}
                className="h-10 rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold shadow-sm transition hover:bg-zinc-50 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                Önizleme
              </button>

              <button
                onClick={() => router.push("/YonetimKuruluYoneticiRaporu")}
                className="h-10 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium shadow-sm transition hover:bg-zinc-50 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                Vazgeç
              </button>

              <button
                onClick={handleSubmit}
                disabled={saving || sitesLoading || uyelerLoading}
                className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-zinc-200 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          SAYGILARIMIZLA, <span className="font-semibold">EOS MANAGEMENT</span>
        </div>
      </div>

      {/* ✅ Önizleme Modal – HTML RENDER */}
      {previewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <div className="text-sm font-semibold">Tutanak Önizleme</div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                Kapat
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto p-4">
              <div className="rounded-xl border border-zinc-200 bg-white p-5 text-[13px] text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
                <div className="leading-6" dangerouslySetInnerHTML={{ __html: previewText }} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <button
                onClick={() => setPreviewOpen(false)}
                className="h-10 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium shadow-sm transition hover:bg-zinc-50 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                Düzenlemeye Dön
              </button>

              <button
                onClick={async () => {
                  setPreviewOpen(false);
                  await handleSubmit();
                }}
                disabled={saving}
                className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
