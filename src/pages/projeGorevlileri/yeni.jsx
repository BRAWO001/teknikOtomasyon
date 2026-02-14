



// src/pages/satinalma/yeni.jsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

/* ========================
   Upload endpoints
======================== */
const UPLOAD_URL = "HttpUpload/upload-ftp";
const SAVE_URL_BASE = "SatinAlmaDosyaEkle";

const TUR = {
  FOTO: 10,
  BELGE: 20,
};

function pickAny(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return null;
}
function pickId(obj) {
  return pickAny(obj, "id", "Id", "talepId", "TalepId", "dosyaId", "DosyaId");
}
function fileExt(name) {
  const s = String(name || "");
  const idx = s.lastIndexOf(".");
  return idx >= 0 ? s.slice(idx + 1).toLowerCase() : "";
}
function isProbablyImage(file) {
  const t = String(file?.type || "").toLowerCase();
  if (t.startsWith("image/")) return true;
  const ext = fileExt(file?.name);
  return ["jpg", "jpeg", "png", "webp", "heic"].includes(ext);
}
function isProbablyPdfOrDoc(file) {
  const t = String(file?.type || "").toLowerCase();
  if (t.includes("pdf")) return true;
  const ext = fileExt(file?.name);
  return ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(ext);
}

/* ========================
   Inline Upload Panel (sayfa içi)
   - PENDING mantığı var
   - Parent'a status bildirir (redirect bekleme için)
======================== */
function TalepDosyaPanel({ talepId, seriNo, onStatusChange, disabled }) {
  const _talepId = useMemo(() => {
    const n = Number(talepId || 0);
    return n > 0 ? n : 0;
  }, [talepId]);

  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filesError, setFilesError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // TalepId yokken bile upload edilenler burada durur
  // item: { url, dosyaAdi, tur, createdAt }
  const [pending, setPending] = useState([]);
  const [attaching, setAttaching] = useState(false);
  const [attachError, setAttachError] = useState("");

  // parent status callback
  useEffect(() => {
    if (typeof onStatusChange === "function") {
      onStatusChange({
        uploading,
        attaching,
        pendingCount: pending.length,
        hasTalepId: !!_talepId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploading, attaching, pending.length, _talepId]);

  const loadFiles = async () => {
    if (!_talepId) return;
    try {
      setLoadingFiles(true);
      setFilesError("");
      const data = await getDataAsync(`${SAVE_URL_BASE}/${_talepId}`);
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Talep dosyaları alınırken hata:", err);
      setFilesError(err?.message || "Dosyalar alınırken bir hata oluştu.");
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (_talepId) loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_talepId]);

  // 1) Upload only -> Url al
  const uploadOnly = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await postDataAsync(UPLOAD_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const url = uploadRes?.Url || uploadRes?.url;
    if (!url) throw new Error("Upload cevabında Url alanı bulunamadı.");

    return url;
  };

  // 2) DB attach (talepId varsa)
  const attachToTalep = async (items) => {
    if (!_talepId) return;

    const body = (items || []).map((x) => ({
      url: x.url,
      dosyaAdi: x.dosyaAdi,
      tur: x.tur,
    }));

    if (!body.length) return;

    await postDataAsync(`${SAVE_URL_BASE}/${_talepId}`, body, {
      headers: { "Content-Type": "application/json" },
    });
  };

  // ✅ FIX: TalepId sonradan geldiyse veya pending değiştiyse: pending’i otomatik bağla
  useEffect(() => {
    const run = async () => {
      if (!_talepId) return;
      if (!pending.length) return;
      if (attaching) return;

      try {
        setAttachError("");
        setAttaching(true);

        await attachToTalep(pending);

        setPending([]);
        await loadFiles();
      } catch (err) {
        console.error("PENDING ATTACH ERROR:", err);
        setAttachError(err?.message || "Bekleyen dosyalar talebe bağlanırken hata oluştu.");
      } finally {
        setAttaching(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_talepId, pending.length]); // ✅ pending.length eklendi

  const handlePickAndUpload = async (e, tur) => {
    const file = e?.target?.files?.[0];
    if (e?.target) e.target.value = "";
    if (!file) return;

    setUploadError("");
    setAttachError("");
    setUploading(true);

    try {
      if (tur === TUR.FOTO && !isProbablyImage(file)) {
        throw new Error("Lütfen fotoğraf dosyası seçin (jpg/png/heic vb.).");
      }
      if (tur === TUR.BELGE && !isProbablyPdfOrDoc(file)) {
        throw new Error("Lütfen belge seçin (pdf/doc/xls vb.).");
      }

      // 1) FTP upload
      const url = await uploadOnly(file);

      const item = {
        url,
        dosyaAdi: file.name,
        tur,
        createdAt: new Date().toISOString(),
      };

      // 2) TalepId varsa direkt DB'ye bağla
      if (_talepId) {
        setAttaching(true);
        try {
          await attachToTalep([item]);
          await loadFiles();
        } finally {
          setAttaching(false);
        }
      } else {
        // 3) TalepId yoksa pending listesine ekle
        setPending((prev) => [item, ...prev]);
      }
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      setUploadError(err?.message || "Yükleme sırasında hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  const handleAttachPending = async () => {
    if (!_talepId || !pending.length) return;

    setAttachError("");
    setAttaching(true);
    try {
      await attachToTalep(pending);
      setPending([]);
      await loadFiles();
    } catch (err) {
      console.error("ATTACH PENDING ERROR:", err);
      setAttachError(err?.message || "Bekleyen dosyalar bağlanırken hata oluştu.");
    } finally {
      setAttaching(false);
    }
  };

  return (
    <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      {/* üst header (istersen sonra doldurursun) */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-zinc-600">
            <span className="rounded-full bg-zinc-100 px-2 py-[2px]"></span>

            {seriNo ? (
              <span className="rounded-full bg-zinc-100 px-2 py-[2px]">SeriNo: {seriNo}</span>
            ) : null}

            {!_talepId ? (
              <span className="rounded-full bg-amber-50 px-2 py-[2px] text-amber-800"></span>
            ) : null}
          </div>
        </div>
      </div>

      {uploadError ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {uploadError}
        </div>
      ) : null}

      {attachError ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
          {attachError}
        </div>
      ) : null}

      {(uploading || attaching) && (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12px] text-zinc-700">
          {uploading ? "Yükleme yapılıyor..." : "Dosyalar talebe bağlanıyor..."}
        </div>
      )}

      {/* Upload blocks */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* FOTO */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <div className="mb-2 text-sm font-semibold text-zinc-900">Fotoğraf Yükle</div>

          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-sky-400 bg-white px-3 py-6 text-center text-[12px] font-semibold text-sky-700 hover:bg-sky-50">
            {uploading ? "Yükleniyor..." : "Fotoğraf Seç"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={disabled || uploading || attaching}
              onChange={(e) => handlePickAndUpload(e, TUR.FOTO)}
            />
          </label>
        </div>

        {/* BELGE */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <div className="mb-2 text-sm font-semibold text-zinc-900">PDF / Belge Yükle</div>

          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-emerald-400 bg-white px-3 py-6 text-center text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50">
            {uploading ? "Yükleniyor..." : "Belge Seç"}
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/pdf"
              className="hidden"
              disabled={disabled || uploading || attaching}
              onChange={(e) => handlePickAndUpload(e, TUR.BELGE)}
            />
          </label>
        </div>
      </div>

      {/* Bekleyen listesi */}
      <div className="rounded-xl border border-zinc-200 bg-white p-3">
        {pending.length === 0 ? (
          <div className="text-[11px] text-zinc-600">Dosya yok.</div>
        ) : (
          <div className="space-y-2">
            {pending.map((p, idx) => {
              const turAd = p.tur === TUR.FOTO ? "Foto" : "Belge";
              return (
                <div
                  key={`${p.url}-${idx}`}
                  className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px]"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-zinc-800">{p.dosyaAdi}</div>
                    <div className="mt-0.5 text-[10px] text-zinc-600">Tür: {turAd}</div>

                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block truncate text-[10px] text-sky-700 underline"
                      title={p.url}
                    >
                      {p.url}
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPending((prev) => prev.filter((_, i) => i !== idx))}
                    disabled={disabled || uploading || attaching}
                    className="shrink-0 rounded-md border border-red-300 bg-white px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    title="Bekleyenden kaldırır (FTP'den silmez)"
                  >
                    Kaldır
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DB’ye bağlı dosyalar */}
      <div className="rounded-xl border border-zinc-200 bg-white p-3">
        {!_talepId ? (
          <div className="text-[11px] text-zinc-600">--</div>
        ) : filesError ? (
          <div className="mb-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
            {filesError}
          </div>
        ) : loadingFiles ? (
          <div className="text-[11px] text-zinc-600">Liste yükleniyor...</div>
        ) : files.length === 0 ? (
          <div className="text-[11px] text-zinc-600">Henüz dosya yok.</div>
        ) : (
          <div className="space-y-2">
            {files.map((f) => {
              const id = pickId(f) ?? `${Math.random()}`;
              const turAd = pickAny(f, "TurAd", "turAd") ?? "-";
              const sira = pickAny(f, "Sira", "sira") ?? "-";
              const dosyaAdi = pickAny(f, "DosyaAdi", "dosyaAdi") ?? "-";
              const url = pickAny(f, "Url", "url");

              return (
                <div
                  key={`${id}-${url}-${sira}`}
                  className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px]"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-zinc-800">{dosyaAdi}</div>
                    <div className="mt-0.5 text-[10px] text-zinc-600">
                      Tür: {turAd} • Sıra: {sira} • #{id}
                    </div>

                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block truncate text-[10px] text-sky-700 underline"
                        title={url}
                      >
                        {url}
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/* ========================
   Talep Cinsi Options
======================== */
const TALEP_CINSI_OPTIONS = [
  { value: "Satın Alma", label: "Satın Alma" },
  { value: "Teknik Talep", label: "Teknik Talep" },
  { value: "Güvenlik", label: "Güvenlik" },
  { value: "İletişim", label: "İletişim" },
  { value: "İnsan Kaynakları", label: "İnsan Kaynakları" },
  { value: "Muhasebe", label: "Muhasebe" },
  { value: "Diğer", label: "Diğer" },
];

export default function YeniSatinAlmaPage() {
  const router = useRouter();

  // ✅ redirect tek sefer + watchdog kontrol
  const redirectOnceRef = useRef(false);
  const watchdogRef = useRef(null);

  const goHomeOnce = useCallback(() => {
    if (redirectOnceRef.current) return;
    redirectOnceRef.current = true;

    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }

    setTimeout(() => {
      router.push("/");
    }, 1000);
  }, [router]);

  const [personel, setPersonel] = useState(null);

  // Form alanları
  const [siteId, setSiteId] = useState("");
  const [talepCinsi, setTalepCinsi] = useState("");
  const [aciklama, setAciklama] = useState("");

  // Teknik Talep (Not_3 / Not_4)
  const [teknikTalepVarMi, setTeknikTalepVarMi] = useState(false);
  const [teknikAciklama, setTeknikAciklama] = useState("");

  // Malzeme istemiyorum
  const [malzemeIstemiyorum, setMalzemeIstemiyorum] = useState(false);

  // Lookups
  const [sites, setSites] = useState([]);
  const [onayciCandidates, setOnayciCandidates] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

  // Seçilebilir onaycılar
  const [selectedOnayciIds, setSelectedOnayciIds] = useState([]);

  // Malzemeler
  const [malzemeler, setMalzemeler] = useState([
    {
      malzemeAdi: "",
      marka: "",
      adet: "",
      birim: "Adet",
      kullanimAmaci: "",
      ornekUrunLinki: "",
      not: "",
    },
  ]);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Son oluşturulan talep bilgisi (sayfa içi upload için)
  const [lastCreated, setLastCreated] = useState({ id: null, seriNo: null });

  // ✅ Kaydet sonrası akış: önce talep oluşsun, panel pending bağlasın, sonra redirect
  const [saveRequested, setSaveRequested] = useState(false);

  // Upload panel status (redirect bekleme)
  const [panelStatus, setPanelStatus] = useState({
    uploading: false,
    attaching: false,
    pendingCount: 0,
    hasTalepId: false,
  });

  // ------------------------------------------------------
  // Helpers
  // ------------------------------------------------------
  const getId = (obj) => obj?.id ?? obj?.Id;
  const getAd = (obj) => obj?.ad ?? obj?.Ad;

  const personelId = useMemo(() => {
    if (!personel) return null;
    return personel.id ?? personel.Id ?? null;
  }, [personel]);

  const isSingleSiteLocked = useMemo(() => {
    return Array.isArray(sites) && sites.length === 1;
  }, [sites]);

  const selectedSiteName = useMemo(() => {
    const sid = siteId ? Number(siteId) : null;
    if (!sid) return null;
    const s = sites.find((x) => Number(getId(x)) === sid);
    return s ? getAd(s) : null;
  }, [siteId, sites]);

  const isProcurementLike = useMemo(() => {
    return talepCinsi === "Satın Alma" || talepCinsi === "Teknik Talep";
  }, [talepCinsi]);

  // ------------------------------------------------------
  // Personel cookie'sini oku
  // ------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const personelCookie = getClientCookie("PersonelUserInfo");
      if (!personelCookie) {
        router.replace("/");
        return;
      }

      const parsed = JSON.parse(personelCookie);
      setPersonel(parsed);
    } catch (err) {
      console.error("PersonelUserInfo parse error:", err);
      router.replace("/");
    }
  }, [router]);

  // ------------------------------------------------------
  // Lookups
  // ------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    

    const fetchLookups = async () => {
  if (!personelId) return;

  setLoadingLookups(true);
  setError(null);

  try {
    // 1️⃣ Site + default bilgisi
    const lookupsRes = await getDataAsync(
      `Personeller/satinalma-yeni/lookups?personelId=${personelId}`
    );

    if (cancelled) return;

    const resSites = lookupsRes?.sites || [];
    const defaultSiteId = lookupsRes?.defaultSiteId ?? null;

    setSites(resSites);

    // 2️⃣ Onaycıları yeni endpointten al
    let onaycilar = [];

    try {
      const onayRes = await getDataAsync(
        `Personeller/satinalma/onaycilar`
      );

      // Eğer direkt array dönüyorsa
      if (Array.isArray(onayRes)) {
        onaycilar = onayRes;
      } 
      // Eğer { onaycilar: [] } şeklinde dönüyorsa
      else if (Array.isArray(onayRes?.onaycilar)) {
        onaycilar = onayRes.onaycilar;
      }
    } catch (innerErr) {
      console.warn("Yeni onaycı endpointi hata verdi, lookups içindekiler kullanılacak.");
      onaycilar = lookupsRes?.onaycilar || [];
    }

    setOnayciCandidates(onaycilar);

    // 3️⃣ Site seçimi
    if (Array.isArray(resSites) && resSites.length === 1) {
      const onlyId = getId(resSites[0]);
      setSiteId(onlyId ? String(onlyId) : "");
    } else if (defaultSiteId) {
      setSiteId(String(defaultSiteId));
    } else {
      setSiteId("");
    }

  } catch (err) {
    if (cancelled) return;

    console.error("LOOKUP FETCH ERROR:", err);
    setError(
      "Proje/Site veya onaycı listesi alınırken bir hata oluştu."
    );
  } finally {
    if (!cancelled) setLoadingLookups(false);
  }
};


    fetchLookups();
    return () => {
      cancelled = true;
    };
  }, [personelId]);

  // ------------------------------------------------------
  // Onaycıları default seçili getir
  // ------------------------------------------------------
  useEffect(() => {
    const defaultId = 20; // 👈 seçili gelmesini istediğin PersonelId

    const exists = (onayciCandidates || []).some(
      (p) => (p?.id ?? p?.Id) === defaultId,
    );

    if (exists) {
      setSelectedOnayciIds([defaultId]);
    } else {
      setSelectedOnayciIds([]);
    }
  }, [onayciCandidates]);


  const toggleOnayci = (id) => {
    setSelectedOnayciIds((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  // ------------------------------------------------------
  // Talep cinsi değişince ekran davranışı
  // ------------------------------------------------------
  useEffect(() => {
    if (talepCinsi === "Teknik Talep") setTeknikTalepVarMi(true);

    if (!isProcurementLike) {
      setTeknikTalepVarMi(false);
      setTeknikAciklama("");
      setMalzemeIstemiyorum(false);

      setMalzemeler([
        {
          malzemeAdi: "",
          marka: "",
          adet: "",
          birim: "Adet",
          kullanimAmaci: "",
          ornekUrunLinki: "",
          not: "",
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talepCinsi]);

  // ------------------------------------------------------
  // Malzeme satırı ekle / sil / değiştir
  // ------------------------------------------------------
  const handleAddRow = () => {
    setMalzemeler((prev) => [
      ...prev,
      {
        malzemeAdi: "",
        marka: "",
        adet: "",
        birim: "Adet",
        kullanimAmaci: "",
        ornekUrunLinki: "",
        not: "",
      },
    ]);
  };

  const handleRemoveRow = (index) => {
    setMalzemeler((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index, field, value) => {
    setMalzemeler((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handlePanelStatus = useCallback((st) => {
    setPanelStatus(st);
  }, []);

  // ------------------------------------------------------
  // ✅ Redirect:
  // - Kaydet başarılı olduysa (saveRequested)
  // - önce talepId gelsin
  // - Panel boşsa (uploading/attaching/pendingCount=0)
  // - 1sn sonra /satinalma
  // - 10sn watchdog (takılma olursa)
  // ------------------------------------------------------
  useEffect(() => {
    if (!saveRequested) return;

    // önce talepId gelsin
    if (!panelStatus.hasTalepId) return;

    const canRedirect =
      !panelStatus.uploading &&
      !panelStatus.attaching &&
      (panelStatus.pendingCount || 0) === 0;

    if (canRedirect) {
      goHomeOnce();
      return;
    }

    // watchdog'ı sadece 1 kere kur
    if (!watchdogRef.current) {
      watchdogRef.current = setTimeout(() => {
        goHomeOnce();
      }, 10000);
    }

    // cleanup: unmount olursa timer temizle
    return () => {
      // burada özellikle watchdogRef'i temizlemiyoruz,
      // çünkü goHomeOnce içinde de temizleniyor. Ama unmount'ta temizlemek güvenli.
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
    };
  }, [
    saveRequested,
    panelStatus.hasTalepId,
    panelStatus.uploading,
    panelStatus.attaching,
    panelStatus.pendingCount,
    goHomeOnce,
  ]);

  // ------------------------------------------------------
  // Submit
  // ------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!personel) return;

    setError(null);

    if (!talepCinsi.trim()) {
      setError("Talep cinsi zorunludur.");
      return;
    }

    const talepEdenId = personel.id ?? personel.Id;
    if (!talepEdenId || talepEdenId === 0) {
      setError("Talep eden personel Id bulunamadı. Tekrar giriş yapın.");
      return;
    }

    const siteIdNum = siteId ? Number(siteId) : 0;
    if (!siteIdNum || siteIdNum <= 0) {
      setError("Site / Proje seçimi zorunludur.");
      return;
    }

    const onayciPersonelIdler = (selectedOnayciIds || []).filter((id) => id != null);

    if (isProcurementLike) {
      if (teknikTalepVarMi && !teknikAciklama.trim()) {
        setError("Teknik talep seçildi. Teknik açıklama zorunludur.");
        return;
      }

      const cleanedMalzemeler = [];

      if (!malzemeIstemiyorum) {
        for (let i = 0; i < malzemeler.length; i++) {
          const row = malzemeler[i];

          const malzemeAdi = (row.malzemeAdi || "").trim();
          const marka = (row.marka || "").trim();
          const birim = (row.birim || "").trim();
          const kullanimAmaci = (row.kullanimAmaci || "").trim();
          const ornekUrunLinki = (row.ornekUrunLinki || "").trim();
          const notText = (row.not || "").trim();

          const adetRaw = row.adet === "" ? "" : String(row.adet);
          const adetNum = adetRaw === "" || isNaN(Number(adetRaw)) ? NaN : Number(adetRaw);

          const hepsiBos =
            !malzemeAdi &&
            !marka &&
            !birim &&
            !kullanimAmaci &&
            !ornekUrunLinki &&
            !notText &&
            (adetRaw === "" || adetNum === 0);

          if (hepsiBos) continue;

          if (!malzemeAdi || !marka || !birim || !kullanimAmaci || !notText) {
            setError(
              `Malzeme satır ${i + 1} için örnek ürün linki hariç tüm alanlar zorunludur.`
            );
            return;
          }

          if (!adetNum || adetNum <= 0) {
            setError(
              `Malzeme satır ${i + 1} için adet alanı zorunludur ve 0'dan büyük olmalıdır.`
            );
            return;
          }

          cleanedMalzemeler.push({
            malzemeAdi,
            marka,
            adet: adetNum,
            birim,
            kullanimAmaci,
            ornekUrunLinki: ornekUrunLinki || null,
            not: notText,
          });
        }

        if (cleanedMalzemeler.length === 0) {
          setError("En az bir malzeme girişi yapmalısınız. (Ya da 'malzeme istemiyorum' seçin.)");
          return;
        }
      }

      const payload = {
        tarih: new Date().toISOString(),
        seriNo: null,
        talepEdenId,
        siteId: siteIdNum,
        talepCinsi: talepCinsi.trim(),
        aciklama: aciklama.trim() || null,
        onayciPersonelIdler: onayciPersonelIdler.length ? onayciPersonelIdler : null,

        not_3: teknikTalepVarMi ? "Evet" : "Hayır",
        not_4: teknikTalepVarMi ? teknikAciklama.trim() : null,

        malzemeler: malzemeIstemiyorum ? null : cleanedMalzemeler,
      };

      try {
        setSending(true);

        const result = await postDataAsync("SatinAlma", payload);

        const createdId =
          result?.id ?? result?.Id ?? result?.satinAlmaId ?? result?.SatinAlmaId;
        const createdSeriNo = result?.seriNo ?? result?.SeriNo ?? null;

        setLastCreated({
          id: createdId ? Number(createdId) : null,
          seriNo: createdSeriNo,
        });

        // ✅ Burada form reset var ama panel unmount olmadığı için pending bağlama çalışacak
        if (!isSingleSiteLocked) setSiteId("");
        setTalepCinsi("");
        setAciklama("");

        setTeknikTalepVarMi(false);
        setTeknikAciklama("");
        setMalzemeIstemiyorum(false);

        setMalzemeler([
          {
            malzemeAdi: "",
            marka: "",
            adet: "",
            birim: "Adet",
            kullanimAmaci: "",
            ornekUrunLinki: "",
            not: "",
          },
        ]);

        // ✅ Kaydet başarılı → redirect akışını başlat
        setSaveRequested(true);
      } catch (err) {
        console.error("SATINALMA CREATE ERROR:", err);
        setError("Talep kaydedilirken bir hata oluştu.");
      } finally {
        setSending(false);
      }

      return;
    }

    // Diğer talep cinsleri
    const payload = {
      tarih: new Date().toISOString(),
      seriNo: null,
      talepEdenId,
      siteId: siteIdNum,
      talepCinsi: talepCinsi.trim(),
      aciklama: aciklama.trim() || null,
      onayciPersonelIdler: onayciPersonelIdler.length ? onayciPersonelIdler : null,
      not_3: "Hayır",
      not_4: null,
      malzemeler: null,
    };

    try {
      setSending(true);

      const result = await postDataAsync("SatinAlma", payload);

      const createdId =
        result?.id ?? result?.Id ?? result?.satinAlmaId ?? result?.SatinAlmaId;
      const createdSeriNo = result?.seriNo ?? result?.SeriNo ?? null;

      setLastCreated({
        id: createdId ? Number(createdId) : null,
        seriNo: createdSeriNo,
      });

      if (!isSingleSiteLocked) setSiteId("");
      setTalepCinsi("");
      setAciklama("");

      setSaveRequested(true);
    } catch (err) {
      console.error("TALEP CREATE ERROR:", err);
      setError("Talep kaydedilirken bir hata oluştu.");
    } finally {
      setSending(false);
    }
  };

  const freezeForm = sending || saveRequested;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* ✅ Kaydedildi Toast + Redirect info */}
      {saveRequested && (
        <div className="fixed left-0 right-0 top-3 z-50 mx-auto w-[min(720px,calc(100%-24px))]">
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-900 shadow-sm">
            <div className="font-semibold">Talep oluşturuldu.</div>
            <div className="mt-1 text-[12px] text-emerald-800">
              {panelStatus.uploading || panelStatus.attaching || panelStatus.pendingCount > 0
                ? "Dosyalar talebe bağlanıyor... (bitince yönlendirileceksiniz)"
                : "1 saniye içinde ana sayfaya yönlendiriliyorsunuz..."}
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Başlık */}
        <header className="mb-6 border-b border-zinc-200 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-zinc-900">Yeni Talep Oluştur</h1>

              {!personel && (
                <p className="mt-1 text-[10px] text-zinc-500">
                  PersonelUserInfo cookie içinde bulunamadı.
                </p>
              )}

              {personel && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-zinc-100 px-2 py-[2px] text-[11px] font-medium text-zinc-700">
                    {personel.ad} {personel.soyad} – {personel.rol}
                  </span>
                  {loadingLookups && (
                    <span className="rounded-full bg-zinc-100 px-2 py-[2px] text-[11px] font-medium text-zinc-600">
                      Proje bilgileri yükleniyor...
                    </span>
                  )}
                  {!loadingLookups && isSingleSiteLocked && selectedSiteName && (
                    <span className="rounded-full bg-emerald-50 px-2 py-[2px] text-[11px] font-medium text-emerald-700">
                      Proje: {selectedSiteName}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Hata */}
        {error && !saveRequested && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[13px] text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-4 shadow-sm">
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-800">Talep Bilgileri</h2>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Talep Cinsi */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-700">
                  Talep Cinsi <span className="text-red-500">*</span>
                </label>

                <select
                  value={talepCinsi}
                  onChange={(e) => setTalepCinsi(e.target.value)}
                  required
                  disabled={freezeForm}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                >
                  <option value="">Seçiniz</option>
                  {TALEP_CINSI_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Site */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-700">
                  Site / Proje <span className="text-red-500">*</span>
                </label>

                {isSingleSiteLocked ? (
                  <div className="flex h-[38px] items-center rounded-md border border-zinc-300 bg-zinc-50 px-2 text-sm text-zinc-800">
                    {selectedSiteName || "Proje bilgisi bulunamadı"}
                  </div>
                ) : (
                  <select
                    value={siteId}
                    required
                    disabled={loadingLookups || freezeForm}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:cursor-not-allowed disabled:bg-zinc-100"
                  >
                    <option value="">{loadingLookups ? "Yükleniyor..." : "Seçiniz"}</option>
                    {sites.map((s) => {
                      const id = getId(s);
                      const ad = getAd(s);
                      return (
                        <option key={id} value={id}>
                          {ad || `Site #${id}`}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            </div>

            {/* Teknik talep */}
            {isProcurementLike && (
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                <div className="w-full rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-4">
                  <label className="flex w-full items-center justify-center gap-3 text-sm font-semibold text-emerald-900">
                    <input
                      type="checkbox"
                      checked={teknikTalepVarMi}
                      disabled={freezeForm}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setTeknikTalepVarMi(checked);

                        if (!checked) {
                          setTeknikAciklama("");
                          setMalzemeIstemiyorum(false);
                        }
                      }}
                      className="h-5 w-5 rounded border-emerald-400"
                    />
                    Teknik talebiniz var mı?
                  </label>
                </div>

                {teknikTalepVarMi && (
                  <div className="mt-3 space-y-3">
                    <div className="w-full rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
                      <label className="flex w-full items-center justify-center gap-3 text-sm font-semibold text-amber-900">
                        <input
                          type="checkbox"
                          checked={malzemeIstemiyorum}
                          disabled={freezeForm}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setMalzemeIstemiyorum(checked);

                            if (checked) {
                              setMalzemeler([
                                {
                                  malzemeAdi: "",
                                  marka: "",
                                  adet: "",
                                  birim: "Adet",
                                  kullanimAmaci: "",
                                  ornekUrunLinki: "",
                                  not: "",
                                },
                              ]);
                            }
                          }}
                          className="h-5 w-5 rounded border-amber-400"
                        />
                        Malzeme istemiyorum (sadece teknik talep)
                      </label>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-700">
                        Teknik Açıklama <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={teknikAciklama}
                        disabled={freezeForm}
                        onChange={(e) => setTeknikAciklama(e.target.value)}
                        className="w-full resize-y rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Onaycılar */}
            <div className="space-y-2">
              <div className="block text-xs font-medium text-zinc-700" >Talebin iletileceği kişi</div>
              {onayciCandidates.length === 0 ? (
                <p className="text-[11px] text-zinc-500">Uygun onaycı personel bulunamadı.</p>
              ) : (
                <div className="flex flex-wrap gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-2">
                  {onayciCandidates.map((p) => {
                    const id = p.id ?? p.Id;
                    const ad = p.ad ?? p.Ad;
                    const soyad = p.soyad ?? p.Soyad;
                    const rolAd = p.rolAd ?? p.RolAd;

                    const checked = selectedOnayciIds.includes(id);

                    return (
                      <label
                        key={id}
                        className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] shadow-sm ${
                          checked ? "bg-white text-zinc-800" : "bg-zinc-100 text-zinc-600"
                        } ${freezeForm ? "opacity-60 pointer-events-none" : ""}`}
                      >
                        <input
                          type="checkbox"
                          className="h-3 w-3"
                          checked={checked}
                          onChange={() => toggleOnayci(id)}
                        />
                        <span className="font-medium">
                          {ad} {soyad}
                        </span>
                        
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Açıklama */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-700">Açıklama</label>
              <textarea
                rows={3}
                value={aciklama}
                disabled={freezeForm}
                onChange={(e) => setAciklama(e.target.value)}
                className="w-full resize-y rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
              />
            </div>

            {/* ✅ Belge/Görsel yükleme: her zaman burada kalsın (UNMOUNT YOK) */}
            <div className="pt-2">
              <TalepDosyaPanel
                talepId={lastCreated.id}
                seriNo={lastCreated.seriNo}
                onStatusChange={handlePanelStatus}
                disabled={saveRequested}
              />
            </div>
          </section>

          {/* Malzemeler */}
          {isProcurementLike && (
            <section
              className={`space-y-3 ${
                malzemeIstemiyorum ? "opacity-50 pointer-events-none" : ""
              } ${freezeForm ? "opacity-60 pointer-events-none" : ""}`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-800">Malzemeler</h2>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="rounded-md border border-sky-500 bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
                >
                  + Malzeme Ekle
                </button>
              </div>

              <div className="overflow-x-auto rounded-md border border-zinc-200">
                <table className="min-w-full border-separate border-spacing-0 text-[11px] text-zinc-900">
                  <thead className="bg-zinc-100">
                    <tr>
                      <th className="border-b border-zinc-200 px-2 py-1 text-left font-medium">
                        Malzeme Adı *
                      </th>
                      <th className="border-b border-zinc-200 px-2 py-1 text-left font-medium">
                        Marka *
                      </th>
                      <th className="border-b border-zinc-200 px-2 py-1 text-right font-medium">
                        Adet *
                      </th>
                      <th className="border-b border-zinc-200 px-2 py-1 text-left font-medium">
                        Birim *
                      </th>
                      <th className="border-b border-zinc-200 px-2 py-1 text-left font-medium">
                        Kullanım Amacı *
                      </th>
                      <th className="border-b border-zinc-200 px-2 py-1 text-left font-medium">
                        Örnek Ürün Linki
                      </th>
                      <th className="border-b border-zinc-200 px-2 py-1 text-left font-medium">
                        Not *
                      </th>
                      <th className="border-b border-zinc-200 px-2 py-1 text-center font-medium">
                        Sil
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {malzemeler.map((row, index) => (
                      <tr key={index} className="odd:bg-white even:bg-zinc-50">
                        <td className="border-b border-zinc-200 px-2 py-1 align-top">
                          <input
                            type="text"
                            value={row.malzemeAdi}
                            onChange={(e) => handleRowChange(index, "malzemeAdi", e.target.value)}
                            required={!malzemeIstemiyorum}
                            className="w-full rounded border border-zinc-300 px-1 py-[3px] text-[11px]"
                          />
                        </td>
                        <td className="border-b border-zinc-200 px-2 py-1 align-top">
                          <input
                            type="text"
                            value={row.marka}
                            onChange={(e) => handleRowChange(index, "marka", e.target.value)}
                            required={!malzemeIstemiyorum}
                            className="w-full rounded border border-zinc-300 px-1 py-[3px] text-[11px]"
                          />
                        </td>
                        <td className="border-b border-zinc-200 px-2 py-1 align-top text-right">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={row.adet}
                            onChange={(e) => handleRowChange(index, "adet", e.target.value)}
                            required={!malzemeIstemiyorum}
                            className="w-full rounded border border-zinc-300 px-1 py-[3px] text-right text-[11px]"
                          />
                        </td>
                        <td className="border-b border-zinc-200 px-2 py-1 align-top">
                          <input
                            type="text"
                            value={row.birim}
                            onChange={(e) => handleRowChange(index, "birim", e.target.value)}
                            required={!malzemeIstemiyorum}
                            className="w-full rounded border border-zinc-300 px-1 py-[3px] text-[11px]"
                          />
                        </td>
                        <td className="border-b border-zinc-200 px-2 py-1 align-top">
                          <input
                            type="text"
                            value={row.kullanimAmaci}
                            onChange={(e) =>
                              handleRowChange(index, "kullanimAmaci", e.target.value)
                            }
                            required={!malzemeIstemiyorum}
                            className="w-full rounded border border-zinc-300 px-1 py-[3px] text-[11px]"
                          />
                        </td>
                        <td className="border-b border-zinc-200 px-2 py-1 align-top">
                          <input
                            type="text"
                            value={row.ornekUrunLinki}
                            onChange={(e) =>
                              handleRowChange(index, "ornekUrunLinki", e.target.value)
                            }
                            className="w-full rounded border border-zinc-300 px-1 py-[3px] text-[11px]"
                          />
                        </td>
                        <td className="border-b border-zinc-200 px-2 py-1 align-top">
                          <input
                            type="text"
                            value={row.not}
                            onChange={(e) => handleRowChange(index, "not", e.target.value)}
                            required={!malzemeIstemiyorum}
                            className="w-full rounded border border-zinc-300 px-1 py-[3px] text-[11px]"
                          />
                        </td>
                        <td className="border-b border-zinc-200 px-2 py-1 align-top text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(index)}
                            disabled={malzemeler.length === 1}
                            className="rounded border border-red-400 px-2 py-[1px] text-[11px] text-red-600 hover:bg-red-50 disabled:border-zinc-300 disabled:text-zinc-400"
                          >
                            Sil
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Kaydet */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={freezeForm}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
            >
              Geri
            </button>

            <button
              type="submit"
              disabled={sending || !personel || loadingLookups || saveRequested}
              className="rounded-md border border-sky-600 bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 disabled:bg-sky-300"
            >
              {sending ? "Kaydediliyor..." : "Talebi Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
