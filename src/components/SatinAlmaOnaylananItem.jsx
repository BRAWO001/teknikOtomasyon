// ===============================
// src/components/SatinAlmaOnaylananItem.jsx
// ✅ TEK YAPIDA: Güncelle MODAL + Malzeme CRUD + POST Update + POST Delete
// ✅ OPTIONS: Talep Cinsi (select) + Teknik Talep Var mı (Evet/Hayır select)
// ===============================
import Link from "next/link";
import { useMemo, useState } from "react";
import { postDataAsync, getDataAsync } from "@/utils/apiService";
import { useRouter } from "next/router";
/* ========================
   OPTIONS
======================== */
const TALEP_CINSI_OPTIONS = [
  { value: "Satın Alma", label: "Satın Alma" },
  { value: "Teknik Talep", label: "Teknik Talep" },
  { value: "Güvenlik", label: "Güvenlik" },
  { value: "İletişim", label: "İletişim" },
  { value: "İnsan Kaynakları", label: "İnsan Kaynakları" },
  { value: "Muhasebe", label: "Muhasebe" },
  { value: "Peyzaj", label: "Peyzaj" },
  { value: "Diğer", label: "Diğer" },
];

const EVET_HAYIR_OPTIONS = [
  { value: "", label: "— Seçiniz —" },
  { value: "Evet", label: "Evet" },
  { value: "Hayır", label: "Hayır" },
];

/* ========================
   Helpers
======================== */
function norm(v) {
  if (v == null) return "";
  return String(v).trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
}
function isValidHttpUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
function safePick(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null) return v;
  }
  return null;
}
function normalizeMalzemeler(malz) {
  const arr = Array.isArray(malz) ? malz : [];
  return arr.map((m) => ({
    id: m.id ?? m.Id ?? 0,
    malzemeAdi: m.malzemeAdi ?? m.MalzemeAdi ?? "",
    marka: m.marka ?? m.Marka ?? "",
    adet: Number(m.adet ?? m.Adet ?? 0),
    birim: m.birim ?? m.Birim ?? "",
    kullanimAmaci: m.kullanimAmaci ?? m.KullanimAmaci ?? "",
    ornekUrunLinki: m.ornekUrunLinki ?? m.OrnekUrunLinki ?? "",
  }));
}

/* ========================
   UI Pieces
======================== */
function Chip({ text, className = "", title }) {
  return (
    <span
      title={title || text}
      className={`inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-semibold ${className}`}
    >
      {text}
    </span>
  );
}

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold text-zinc-700">{label}</div>
        {hint ? <div className="text-[10px] text-zinc-400">{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      value={value ?? ""}
      type={type}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[12px] text-zinc-900 outline-none
                 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[12px] text-zinc-900 outline-none
                 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      style={{ resize: "vertical" }}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[12px] text-zinc-900 outline-none
                 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function IconButton({ children, onClick, title, className = "", type = "button", disabled }) {
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold shadow-sm transition
                  active:scale-[0.98] disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

function OverlayModal({ open, title, sub, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <div className="min-w-0">
            <div className="text-[14px] font-extrabold text-zinc-900">{title}</div>
            {sub ? <div className="mt-0.5 text-[12px] text-zinc-500 line-clamp-1">{sub}</div> : null}
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-zinc-100 px-3 py-2 text-[12px] font-semibold text-zinc-700 hover:bg-zinc-200"
          >
            Kapat
          </button>
        </div>

        <div className="max-h-[75vh] overflow-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* ========================
   Component
======================== */
export default function SatinAlmaOnaylananItem({
  item,
  formatDateTime,
  formatDateOnly,
  onDeleted,
  onUpdated,
}) {
  const id = item.id ?? item.Id;
  const seriNo = item.seriNo ?? item.SeriNo;
  const tarih = item.tarih ?? item.Tarih;
  const talepCinsi = item.talepCinsi ?? item.TalepCinsi;
  const aciklama = item.aciklama ?? item.Aciklama;

  const site = item.site ?? item.Site ?? null;
  const malzemeSayisi = item.malzemeSayisi ?? item.MalzemeSayisi ?? 0;

  const talepEden = item.talepEden ?? item.TalepEden ?? null;

  const benimOnayKaydim = item.benimOnayKaydim ?? item.BenimOnayKaydim ?? null;
  const benimDurumAd = benimOnayKaydim?.durumAd ?? benimOnayKaydim?.DurumAd ?? "";
  const onayTarihiUtc =
    benimOnayKaydim?.onayTarihiUtc ?? benimOnayKaydim?.OnayTarihiUtc ?? null;

  const enDusukTeklifler = item.enDusukTeklifler ?? item.EnDusukTeklifler ?? [];

  const not1 = item.not_1 ?? item.Not_1 ?? "";
  const not2 = item.not_2 ?? item.Not_2 ?? "";
  const not3 = item.not_3 ?? item.Not_3 ?? null; // Teknik talep var mı?
  const not4 = item.not_4 ?? item.Not_4 ?? "";
  const not5 = item.not_5 ?? item.Not_5 ?? "";

  const not1Norm = norm(not1);
  const not3Norm = norm(not3);
  const not5Norm = norm(not5);

  const satinAlindi = not1Norm.includes("satın alındı") || not1Norm.includes("satin alindi");
  const satinAlinmadi =
    not1Norm.includes("satın alınmadı") ||
    not1Norm.includes("satin alinmadi") ||
    not1Norm.includes("satın alinmadi");

  const hasFatura = isValidHttpUrl(String(not2 || "").trim());

  const teknikVar = not3Norm === "evet" || not3Norm === "var" || not3Norm === "true";
  const teknikYok = not3Norm === "hayır" || not3Norm === "yok" || not3Norm === "false";

  const surecTamamlandi =
    not5Norm.includes("süreç tamamlandı") || not5Norm.includes("surec tamamlandi");

  // ==========================
  // ✅ MODAL STATE
  // ==========================
  const [openEdit, setOpenEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [err, setErr] = useState("");

  const [fTalepCinsi, setFTalepCinsi] = useState("");
  const [fAciklama, setFAciklama] = useState("");
  const [fNot1, setFNot1] = useState("");
  const [fNot2, setFNot2] = useState("");
  const [fNot3, setFNot3] = useState(""); // ✅ select Evet/Hayır
  const [fNot4, setFNot4] = useState("");
  const [fNot5, setFNot5] = useState("");
  const [fMalzemeler, setFMalzemeler] = useState([]);

  const seedFromAny = (src) => {
    setErr("");
    setFTalepCinsi(safePick(src, "talepCinsi", "TalepCinsi") ?? "");
    setFAciklama(safePick(src, "aciklama", "Aciklama") ?? "");
    setFNot1(safePick(src, "not_1", "Not_1") ?? "");
    setFNot2(safePick(src, "not_2", "Not_2") ?? "");

    // ✅ Teknik talep var mı -> normalize edip Evet/Hayır'a çek
    const rawNot3 = safePick(src, "not_3", "Not_3");
    const n3 = norm(rawNot3);
    const mapped =
      n3 === "evet" || n3 === "var" || n3 === "true"
        ? "Evet"
        : n3 === "hayır" || n3 === "hayir" || n3 === "yok" || n3 === "false"
          ? "Hayır"
          : "";
    setFNot3(mapped);

    setFNot4(safePick(src, "not_4", "Not_4") ?? "");
    setFNot5(safePick(src, "not_5", "Not_5") ?? "");

    const malz = safePick(src, "malzemeler", "Malzemeler");
    setFMalzemeler(normalizeMalzemeler(malz));
  };

  const openModal = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    seedFromAny(item);
    setOpenEdit(true);

    setLoadingDetail(true);
    try {
      const detail = await getDataAsync(`satinalma/${id}`);
      seedFromAny(detail);
    } catch (ex) {
      setErr(ex?.message || "Detay çekilemedi (GET /satinalma/{id}).");
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeModal = () => {
    if (saving) return;
    setOpenEdit(false);
  };

  const addMalzemeRow = () => {
    setFMalzemeler((prev) => [
      ...prev,
      {
        id: 0,
        malzemeAdi: "",
        marka: "",
        adet: 1,
        birim: "Adet",
        kullanimAmaci: "",
        ornekUrunLinki: "",
      },
    ]);
  };

  const updateMalzeme = (idx, patch) => {
    setFMalzemeler((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  };

  const removeMalzemeRow = (idx) => {
    setFMalzemeler((prev) => prev.filter((_, i) => i !== idx));
  };

  const validateBeforeSave = () => {
    const tc = String(fTalepCinsi || "").trim();
    if (!tc) return "Talep Cinsi boş olamaz.";
    const tcOk = TALEP_CINSI_OPTIONS.some((o) => o.value === tc);
    if (!tcOk) return "Talep Cinsi seçeneklerden biri olmalı.";

    // Not_3 sadece Evet/Hayır/boş
    if (fNot3 && !["Evet", "Hayır"].includes(fNot3)) return "Teknik talep seçimi geçersiz.";

    for (const [i, m] of (fMalzemeler || []).entries()) {
      const name = String(m?.malzemeAdi ?? "").trim();
      if (!name) return `Malzeme adı boş olamaz (satır ${i + 1})`;
      const adet = Number(m?.adet ?? 0);
      if (!(adet > 0)) return `Adet 0'dan büyük olmalı (satır ${i + 1})`;
    }
    return "";
  };

  const buildUpdatePayload = () => ({
    id,
    talepCinsi: String(fTalepCinsi ?? "").trim(),
    aciklama: fAciklama ?? "",
    not_1: fNot1 ?? "",
    not_2: fNot2 ?? "",
    // ✅ backend'in not_3 alanına "Evet"/"Hayır" yaz
    not_3: fNot3 ? fNot3 : null,
    not_4: fNot4 ?? "",
    not_5: fNot5 ?? "",
    malzemeler: (fMalzemeler || []).map((m) => ({
      id: Number(m.id || 0),
      malzemeAdi: m.malzemeAdi ?? "",
      marka: m.marka ?? "",
      adet: Number(m.adet ?? 0),
      birim: m.birim ?? "",
      kullanimAmaci: m.kullanimAmaci ?? "",
      ornekUrunLinki: m.ornekUrunLinki ?? "",
    })),
  });

  const handleSave = async () => {
    const msg = validateBeforeSave();
    if (msg) {
      setErr(msg);
      return;
    }

    setSaving(true);
    setErr("");

    try {
      const payload = buildUpdatePayload();
      await postDataAsync("satinalma/update", payload);
      onUpdated?.(id, payload);
      setOpenEdit(false);
    } catch (e) {
      setErr(e?.message || "Kaydetme sırasında hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const router = useRouter();

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const ok = confirm(
      `Bu satın alma talebi silinsin mi?\n#${id} • Seri: ${seriNo || "-"}`
    );
    if (!ok) return;

    try {
      await postDataAsync("satinalma/delete", { id, reason: "UI Silme" });

      // varsa parent state güncellemen kalsın
      onDeleted?.(id);

      alert("Silindi");
      setOpenEdit(false);

      // ✅ Sayfayı yenile (soft refresh)
      await router.reload();
    } catch (ex) {
      alert(ex?.message || "Silme sırasında hata oluştu");
    }
  };

  const modalSub = useMemo(() => {
    const s = site?.ad ?? site?.Ad ?? "";
    const te = talepEden
      ? `${talepEden.ad ?? talepEden.Ad} ${talepEden.soyad ?? talepEden.Soyad}`
      : "";
    return `#${id} • Seri: ${seriNo || "-"} • ${s ? `Site: ${s}` : "Site: —"} • Talep Eden: ${te || "—"}`;
  }, [id, seriNo, site, talepEden]);

  return (
    <>
      <Link
        href={`/satinalma/teklifler/${id}`}
        className="group relative block border-b border-emerald-200 px-3 py-2 text-[12px] hover:bg-emerald-50"
      >
        {/* Sağ üst aksiyonlar */}
        <div className="absolute right-3 top-2 flex items-center gap-2">
          <button
            onClick={openModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-400 px-1.5 py-1 text-[11px] font-extrabold text-white shadow-sm
                       hover:bg-blue-500 active:scale-[0.98]"
            title="Satın alma bilgisini güncelle"
          >
            ✏️ Güncelle
          </button>

          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-1.5 py-1 text-[11px] font-extrabold text-white shadow-sm
                       hover:bg-rose-700 active:scale-[0.98]"
            title="Talebi sil"
          >
            🗑️ Sil
          </button>
        </div>

        {/* 1. SATIR */}
        <div className="flex flex-wrap items-center justify-between gap-2 pr-[160px]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded bg-emerald-50 px-2 py-[2px] text-[11px] font-semibold text-emerald-700">
              Sıra No: {id}
            </span>
            <span className="text-[11px] font-medium text-zinc-800">Seri: {seriNo}</span>
          </div>
          <span className="text-[11px] text-zinc-500">{formatDateTime(tarih)}</span>
        </div>

        {/* 2. SATIR */}
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-semibold text-zinc-900">{talepCinsi}</span>

          {site ? (
            <span className="text-zinc-600">
              <span className="font-medium text-zinc-700">Site:</span>{" "}
              <span className="font-semibold">{site.ad ?? site.Ad}</span>
            </span>
          ) : (
            <span className="text-zinc-500">Site bilgisi yok</span>
          )}

          {talepEden && (
            <span className="text-zinc-600">
              <span className="font-medium text-zinc-700">Talep Eden:</span>{" "}
              {talepEden.ad ?? talepEden.Ad} {talepEden.soyad ?? talepEden.Soyad}
            </span>
          )}

          {benimOnayKaydim && (
            <span className="rounded-full bg-emerald-100 px-2 py-[2px] text-[11px] font-medium text-emerald-800">
              Sizin sonucunuz: {benimDurumAd}{" "}
              {onayTarihiUtc && (
                <span className="text-[10px] text-emerald-700">({formatDateOnly(onayTarihiUtc)})</span>
              )}
            </span>
          )}
        </div>

        {/* 3. SATIR: DURUM CHIPS */}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {satinAlindi ? (
            <Chip text="✅ Satın Alındı" className="bg-emerald-100 text-emerald-800" title={not1} />
          ) : satinAlinmadi ? (
            <Chip text="🚫 Satın Alınmadı" className="bg-rose-100 text-rose-800" title={not1} />
          ) : (
            <Chip text="⏳ Satın Alma: İşaretlenmedi" className="bg-zinc-100 text-zinc-700" title={not1 || "—"} />
          )}

          {hasFatura ? (
            <Chip text="🧾 Fatura: Var" className="bg-indigo-100 text-indigo-800" title={String(not2)} />
          ) : (
            <Chip text="🧾 Fatura: Yok" className="bg-zinc-100 text-zinc-700" />
          )}

          {teknikVar ? (
            <Chip text="🛠 Teknik Talep: Var" className="bg-amber-100 text-amber-900" />
          ) : teknikYok ? (
            <Chip text="🛠 Teknik Talep: Yok" className="bg-zinc-100 text-zinc-700" />
          ) : (
            <Chip text="🛠 Teknik Talep: —" className="bg-zinc-100 text-zinc-700" />
          )}

          {surecTamamlandi ? (
            <Chip text="🏁 Proje Yönetici Süreci: Tamamlandı" className="bg-sky-100 text-sky-900" title={not5} />
          ) : (
            <Chip
              text="🏁 Proje Yönetici Süreci: İşaretlenmedi"
              className="bg-zinc-100 text-zinc-700"
              title={not5 || "—"}
            />
          )}

          <Chip text={`📦 Malzeme: ${malzemeSayisi} kalem`} className="bg-emerald-50 text-emerald-800" />
        </div>

        {/* 4. SATIR: En düşük teklifler */}
        <div className="mt-1 text-zinc-600">
          <span className="font-medium block">En Düşük Teklifler:</span>
          {enDusukTeklifler.length === 0 ? (
            <span className="text-zinc-500">Teklif girilmemiş</span>
          ) : (
            <div className="mt-0.5 flex flex-col">
              {enDusukTeklifler.map((t, idx) => {
                const ad = t.tedarikciAdi ?? t.TedarikciAdi ?? "Tedarikçi";
                const pb = t.paraBirimi ?? t.ParaBirimi ?? "TRY";
                const tutar = Number(t.toplamTutar ?? t.ToplamTutar ?? 0);

                return (
                  <span key={idx} className="font-semibold text-zinc-800">
                    {ad}{" "}
                    {tutar.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {pb}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {aciklama && (
          <div className="mt-1 text-zinc-500 line-clamp-1">
            <span className="font-medium">Not:</span> {aciklama}
          </div>
        )}
      </Link>

      {/* ==========================
          ✅ EDIT MODAL
         ========================== */}
      <OverlayModal open={openEdit} title="Satın Alma Güncelle" sub={modalSub} onClose={closeModal}>
        {loadingDetail ? (
          <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-900">
            Detaylar yükleniyor...
          </div>
        ) : null}

        {err ? (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-800">
            {err}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* ✅ Talep Cinsi -> SELECT */}
            <Field label="Talep Cinsi" hint="Seçeneklerden seç">
              <Select value={fTalepCinsi} onChange={setFTalepCinsi} options={TALEP_CINSI_OPTIONS} />
            </Field>

            {/* ✅ Teknik talep var mı -> SELECT (Evet/Hayır) */}
            <Field label="Teknik talep var mı?" hint="Evet / Hayır">
              <Select value={fNot3} onChange={setFNot3} options={EVET_HAYIR_OPTIONS} />
            </Field>

           

            

            <div className="md:col-span-2">
              <Field label="Teknik açıklama (Not_4)">
                <Textarea value={fNot4} onChange={setFNot4} placeholder="Teknik açıklama..." rows={5} />
              </Field>
            </div>

           
          </div>

          <Field label="Açıklama">
            <Textarea value={fAciklama} onChange={setFAciklama} placeholder="Açıklama / genel not..." rows={3} />
          </Field>

          {/* MALZEMELER */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[12px] font-extrabold text-zinc-900">Malzemeler</div>
              <IconButton
                onClick={addMalzemeRow}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                title="Yeni malzeme ekle"
                disabled={saving}
              >
                ➕ Malzeme Ekle
              </IconButton>
            </div>

            {fMalzemeler.length === 0 ? (
              <div className="mt-3 rounded-xl bg-zinc-50 px-3 py-2 text-[12px] text-zinc-500">
                Bu kayıtta malzeme yok. “Malzeme Ekle” ile ekleyebilirsin.
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {fMalzemeler.map((m, idx) => (
                  <div key={`${m.id}-${idx}`} className="rounded-2xl border border-zinc-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[11px] font-bold text-zinc-700">
                        Satır {idx + 1} {m.id ? <span className="text-zinc-400">(# {m.id})</span> : null}
                      </div>

                      
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                      <Field label="Malzeme Adı">
                        <Input
                          value={m.malzemeAdi}
                          onChange={(v) => updateMalzeme(idx, { malzemeAdi: v })}
                          placeholder="Örn: Kablo, Sigorta..."
                        />
                      </Field>

                      <Field label="Marka">
                        <Input
                          value={m.marka}
                          onChange={(v) => updateMalzeme(idx, { marka: v })}
                          placeholder="Örn: ABB"
                        />
                      </Field>

                      <Field label="Adet">
                        <Input
                          value={String(m.adet ?? "")}
                          onChange={(v) => updateMalzeme(idx, { adet: Number(v) })}
                          placeholder="1"
                          type="number"
                        />
                      </Field>

                      <Field label="Birim">
                        <Input
                          value={m.birim}
                          onChange={(v) => updateMalzeme(idx, { birim: v })}
                          placeholder="Adet / Kg / mt..."
                        />
                      </Field>

                      <div className="md:col-span-2">
                        <Field label="Kullanım Amacı">
                          <Input
                            value={m.kullanimAmaci}
                            onChange={(v) => updateMalzeme(idx, { kullanimAmaci: v })}
                            placeholder="Nerede kullanılacak?"
                          />
                        </Field>
                      </div>

                      <div className="md:col-span-2">
                        <Field label="Örnek Ürün Linki">
                          <Input
                            value={m.ornekUrunLinki}
                            onChange={(v) => updateMalzeme(idx, { ornekUrunLinki: v })}
                            placeholder="https://..."
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="sticky bottom-0 -mx-5 mt-2 border-t border-zinc-100 bg-white px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={handleDelete}
                disabled={saving}
                className="rounded-xl bg-rose-600 px-4 py-2 text-[12px] font-extrabold text-white shadow-sm hover:bg-rose-700 disabled:opacity-60"
              >
                🗑️ Talebi Sil
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl bg-zinc-100 px-4 py-2 text-[12px] font-extrabold text-zinc-700 hover:bg-zinc-200 disabled:opacity-60"
                >
                  Vazgeç
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-[12px] font-extrabold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </OverlayModal>
    </>
  );
}
