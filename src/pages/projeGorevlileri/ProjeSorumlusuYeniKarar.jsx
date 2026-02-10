// src/pages/YonetimKurulu/yeni.jsx
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

/* ========================
   Helpers
======================== */
const escHtml = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatDateTRFromISO = (iso) => {
  if (!iso || typeof iso !== "string") return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
};

const normalizeLine = (s) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();

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

  // Karar konusu
  const [kararKonusu, setKararKonusu] = useState("");

  // ✅ Karar metni artık "madde madde" yönetilecek
  const [kararItems, setKararItems] = useState([]); // string[]
  const [kararDraft, setKararDraft] = useState("");
  const [kararMsg, setKararMsg] = useState(null);

  // Üyeler
  const [selectedPersonelIds, setSelectedPersonelIds] = useState([]);
  const [projeSorumlusuId, setProjeSorumlusuId] = useState("");

  // Üst bilgiler (hepsi zorunlu)
  const [toplantiYeri, setToplantiYeri] = useState("");
  const [toplantiTarihi, setToplantiTarihi] = useState("");
  const [toplantiSaati, setToplantiSaati] = useState("");
  const [kararNo, setKararNo] = useState(""); // placeholder var, girilmesi zorunlu

  // ✅ Gündem metin olarak kalsın
  const [gundemMetni, setGundemMetni] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  /* ========================
     Cookie -> Personel
  ======================== */
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

  /* ========================
     Site listesi
  ======================== */
  useEffect(() => {
    if (!personel?.personelKodu) return;

    let cancelled = false;
    const loadSites = async () => {
      try {
        const list = await getDataAsync(
          `ProjeYonetimKurulu/site/personel/${encodeURIComponent(
            personel.personelKodu
          )}`
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

  /* ========================
     Karar konusu otomatik
  ======================== */
  useEffect(() => {
    const siteAdi = selectedSite?.site?.ad ?? "";
    const konu = `${siteAdi.toUpperCase()}
SİTE YÖNETİCİLİĞİ
YÖNETİM KURULU TOPLANTI TUTANAĞI`;

    setKararKonusu((prev) =>
      !prev || prev.includes("SİTE YÖNETİCİLİĞİ") ? konu.trim() : prev
    );
  }, [selectedSite?.site?.ad]);

  /* ========================
     Üyeleri getir
  ======================== */
  useEffect(() => {
    if (!siteId) return;

    let cancelled = false;
    const loadUyeler = async () => {
      try {
        setUyelerLoading(true);
        setUyelerError(null);

        const list = await getDataAsync(
          `ProjeYonetimKurulu/site/${siteId}/uyeler`
        );
        if (cancelled) return;

        const normalized = Array.isArray(list) ? list : list ? [list] : [];
        setUyeler(normalized);

        // sıfırla
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

      // proje sorumlusu: ilk seçilen
      if (!next.length) {
        setProjeSorumlusuId("");
      } else {
        const current = Number(projeSorumlusuId);
        if (!current || !next.includes(current))
          setProjeSorumlusuId(String(next[0]));
      }
      return next;
    });
  };

  const selectedUyeOptions = useMemo(() => {
    const selectedSet = new Set(selectedPersonelIds.map(Number));
    return uyeler
      .filter((u) => selectedSet.has(Number(u.personelId)))
      .map((u) => ({ id: Number(u.personelId), label: formatUye(u) }));
  }, [uyeler, selectedPersonelIds]);

  // ✅ Katılanlar otomatik
  const katilanlarText = useMemo(() => {
    const s = selectedUyeOptions.map((x) => x.label).filter(Boolean);
    return s.join(", ");
  }, [selectedUyeOptions]);

  // Seçilenler değişince proje sorumlusu otomatik ilk kişi
  useEffect(() => {
    if (!selectedPersonelIds.length) {
      if (projeSorumlusuId) setProjeSorumlusuId("");
      return;
    }
    const first = String(selectedPersonelIds[0]);
    if (String(projeSorumlusuId) !== first) setProjeSorumlusuId(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPersonelIds]);

  /* ========================
     ✅ Karar maddeleri yönetimi
  ======================== */
  const addKararItem = () => {
    const line = normalizeLine(kararDraft);
    if (!line) {
      setKararMsg("Karar maddesi boş olamaz.");
      return;
    }

    const exists = kararItems.some(
      (x) => normalizeLine(x).toLowerCase() === line.toLowerCase()
    );
    if (exists) {
      setKararMsg("Bu karar maddesi zaten eklendi.");
      return;
    }

    setKararItems((prev) => [...prev, line]);
    setKararDraft("");
    setKararMsg(null);
  };

  const removeKararItem = (idx) => {
    setKararItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveKararItem = (idx, dir) => {
    setKararItems((prev) => {
      const next = [...prev];
      const to = idx + dir;
      if (to < 0 || to >= next.length) return prev;
      const tmp = next[idx];
      next[idx] = next[to];
      next[to] = tmp;
      return next;
    });
  };

  const onKararKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKararItem();
    }
  };

  /* ========================
     ✅ Tutanak HTML üretimi
  ======================== */
  const buildTutanakAciklama = () => {
    const siteAdi = selectedSite?.site?.ad ?? "";
    const tarihTR = formatDateTRFromISO(toplantiTarihi);
    const saat = (toplantiSaati || "").trim();

    const toplantiyeriFinal = (toplantiYeri || "").trim();
    const kararNoFinal = (kararNo || "").trim();
    const gundemFinal = normalizeLine(gundemMetni);

    const kararListHtml =
      kararItems.length > 0
        ? `<ol style="margin:8px 0 0 18px; padding:0;">
            ${kararItems
              .map((x) => `<li style="margin:6px 0;">${escHtml(x)}</li>`)
              .join("")}
          </ol>`
        : `<div style="margin-top:6px; color:#666;">-</div>`;

    return `
<div style="font-family:Arial, sans-serif; line-height:1.6">

  <div style="text-align:center; font-weight:bold;">
    ${escHtml(siteAdi.toUpperCase())}<br/>
    SİTE YÖNETİCİLİĞİ<br/>
    YÖNETİM KURULU TOPLANTI TUTANAĞI
  </div>

  <br/>

  <div><b>TOPLANTI YERİ:</b> ${escHtml(toplantiyeriFinal)}</div>
  <div><b>TOPLANTI TARİHİ:</b> ${escHtml(tarihTR)}</div>
  <div><b>TOPLANTI SAATİ:</b> ${escHtml(saat)}</div>
  <div><b>GÜNDEM:</b> ${escHtml(gundemFinal)}</div>
  <div><b>KARAR NO:</b> ${escHtml(kararNoFinal)}</div>
  <div><b>TOPLANTIYA KATILANLAR:</b> ${escHtml(katilanlarText)}</div>

  <br/>

  <div>
    Yönetim planının 30.3 maddesi ve KMK'nın 73. maddesi hükmünce Kat Mülkiyeti Kanunu 27 ve
    devamı hükümlerince toplu yapı kat malikleri kurulu yerine görev yapmak üzere atanmış yukarıda
    isimleri yazılı kişilerce toplanılmıştır.
  </div>

  <br/>

  <div>
    Yönetim Kurulu'nun yukarıda yazılı üyelerin iştiraki ile Yönetim Kurulu toplantısında aşağıdaki kararlar alınmıştır:
  </div>

  ${kararListHtml}

</div>
`;
  };

  /* ========================
     ✅ Validasyon (hepsi zorunlu)
  ======================== */
  const validate = () => {
    if (!siteId) return "Proje bilgisi bulunamadı.";
    if (!selectedSite?.site?.ad) return "Proje bulunamadı.";

    if (!selectedPersonelIds.length) return "En az 1 üye seçmelisiniz.";
    if (!projeSorumlusuId) return "Proje sorumlusu seçilemedi (üye seçiniz).";
    if (!selectedPersonelIds.includes(Number(projeSorumlusuId)))
      return "Proje sorumlusu seçtiğin kişi, seçilen üyeler arasında olmalı.";

    if (!toplantiYeri.trim()) return "Toplantı yeri zorunlu.";
    if (!toplantiTarihi.trim()) return "Toplantı tarihi zorunlu.";
    if (!toplantiSaati.trim()) return "Toplantı saati zorunlu.";

    if (!normalizeLine(gundemMetni)) return "Gündem zorunlu.";
    if (!kararNo.trim()) return "Karar no zorunlu.";

    if (!katilanlarText.trim()) return "Toplantıya katılanlar otomatik üretilemedi.";

    if (!kararKonusu.trim()) return "Karar konusu zorunlu.";

    // ✅ En az 1 karar maddesi zorunlu
    if (!kararItems.length) return "En az 1 karar maddesi eklemelisiniz.";

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
        kararAciklamasi: finalAciklama, // HTML
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

  const previewText = useMemo(() => buildTutanakAciklama(), [
    selectedSite,
    toplantiYeri,
    toplantiTarihi,
    toplantiSaati,
    gundemMetni,
    kararNo,
    katilanlarText,
    projeSorumlusuId,
    selectedUyeOptions,
    kararItems,
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* ✅ KURUMSAL STICKY HEADER */}
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
                Yönetim Kurulu • Yeni Karar Oluşturma
              </div>
            </div>
          </div>

          <div className="hidden max-w-xl items-center gap-2 md:flex">
            <span className="rounded-full border border-zinc-200 bg-white px-4 py-1 text-[11px] font-medium text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              Kararlar, kurumsal toplantı tutanağı formatında kayıt altına alınır.
            </span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Tüm alanlar zorunludur.
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Üst bar */}
        <div className="mb-4 flex items-start justify-between gap-2">
          <button
            className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium shadow-sm transition hover:bg-zinc-50 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            onClick={() => router.push("/")}
          >
            ← Geri
          </button>

          <div className="text-right text-[12px] text-zinc-500 dark:text-zinc-400">
            {personel ? (
              <div className="font-medium text-zinc-700 dark:text-zinc-200">
                {personel.ad ?? ""} {personel.soyad ?? ""}
              </div>
            ) : null}
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
                {selectedSite?.site?.ad ?? "Proje"}
              </span>
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Seçili Üye:{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {selectedPersonelIds.length}
                </span>
              </span>
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Madde:{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {kararItems.length}
                </span>
              </span>
            </div>
          </div>

          {msg && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
              {msg}
            </div>
          )}

          {/* Proje */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Proje
              </label>

              <div className="flex h-10 w-full items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                {selectedSite?.site?.ad ?? "Site seçilmedi"}
              </div>

              <input type="hidden" name="siteId" value={siteId} />
            </div>

            {/* ✅ Proje sorumlusu UI yok */}
            <input type="hidden" value={projeSorumlusuId} readOnly />
          </div>

          {/* ✅ Tutanak Üst Bilgileri */}
          <div className="mt-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              {/* ✅ Gündem: metin */}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                  Gündem
                </label>
                <input
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                  value={gundemMetni}
                  onChange={(e) => setGundemMetni(e.target.value)}
                  placeholder="Örn: 2026 bakım bütçesi, aidat planı, teknik bakım sözleşmesi"
                  maxLength={250}
                />
              </div>

              {/* ✅ Karar No */}
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

              {/* ✅ Katılanlar otomatik */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                    Toplantıya Katılanlar 
                  </label>
                  
                </div>

                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12px] text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                  {katilanlarText ? (
                    <div className="leading-5">{katilanlarText}</div>
                  ) : (
                    <div className="text-zinc-500 dark:text-zinc-400">
                      Henüz üye seçilmedi.
                    </div>
                  )}
                </div>
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

          {/* Karar konusu + Karar Maddeleri */}
          <div className="mt-7 grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Karar Belgesi Başlığı
              </label>
              <textarea
                className="min-h-[90px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                value={kararKonusu}
                onChange={(e) => setKararKonusu(e.target.value)}
                placeholder="Site adı yüklendiğinde otomatik oluşturulacaktır"
                maxLength={400}
              />
            </div>

            {/* ✅ Karar Metni -> MADDE MADDE EKLEME */}
            <div>
              <div className="flex items-end justify-between">
                <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                  Karar Metni • Madde Madde
                </label>
                
              </div>

              {kararMsg ? (
                <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
                  {kararMsg}
                </div>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                  value={kararDraft}
                  onChange={(e) => setKararDraft(e.target.value)}
                  onKeyDown={onKararKeyDown}
                  placeholder="Örn: 2026 bakım bütçesinin ... TL olarak onaylanmasına"
                  maxLength={350}
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addKararItem}
                    className="h-10 whitespace-nowrap rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    + Madde Ekle
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setKararItems([]);
                      setKararDraft("");
                      setKararMsg(null);
                    }}
                    className="h-10 whitespace-nowrap rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium shadow-sm transition hover:bg-zinc-50 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                  >
                    Temizle
                  </button>
                </div>
              </div>

              {/* Liste */}
              <div className="mt-3">
                {kararItems.length === 0 ? (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                    Henüz karar maddesi eklenmedi.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                      Karar Maddeleri
                    </div>

                    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {kararItems.map((item, idx) => (
                        <div
                          key={`${idx}-${item}`}
                          className="flex items-start justify-between gap-3 px-4 py-3"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                              {idx + 1}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                                {item}
                              </div>
                              <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                                Karar maddesi
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveKararItem(idx, -1)}
                              disabled={idx === 0}
                              className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-[12px] font-medium shadow-sm transition hover:bg-zinc-50 active:scale-[0.99] disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                              title="Yukarı taşı"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveKararItem(idx, +1)}
                              disabled={idx === kararItems.length - 1}
                              className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-[12px] font-medium shadow-sm transition hover:bg-zinc-50 active:scale-[0.99] disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                              title="Aşağı taşı"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => removeKararItem(idx)}
                              className="h-8 rounded-md border border-red-200 bg-white px-2 text-[12px] font-medium text-red-700 shadow-sm transition hover:bg-red-50 active:scale-[0.99] dark:border-red-800 dark:bg-zinc-950 dark:text-red-200 dark:hover:bg-red-900/20"
                              title="Sil"
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                onClick={() => router.push("/YonetimKurulu")}
                className="h-10 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium shadow-sm transition hover:bg-zinc-50 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                Vazgeç
              </button>

              <button
                onClick={handleSubmit}
                disabled={saving}
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

      {/* ✅ Önizleme Modal */}
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
                <div
                  className="leading-6"
                  dangerouslySetInnerHTML={{ __html: previewText }}
                />
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
