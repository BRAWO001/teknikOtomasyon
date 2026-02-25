import { useEffect, useMemo, useState } from "react";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

// cookie helper
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((p) => p.trim());
  const found = parts.find((p) => p.startsWith(`${name}=`));
  if (!found) return null;
  return decodeURIComponent(found.split("=").slice(1).join("="));
}

// "12", "12.3", "12,3" => tam sayıya çevirir (truncate)
function parseIntLoose(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const normalized = s.replace(/\s+/g, "").replace(",", ".");
  const num = Number(normalized);
  if (Number.isNaN(num)) return null;
  return Math.trunc(num);
}

const BIRIM_OPTIONS = ["Adet", "Metre"];

export default function IsEmriToSatinalmaTalepModal({
  isOpen,
  onClose,
  isEmriId,
  onAfterCreated,
}) {
  if (!isOpen) return null;

  const DEFAULT_ONAYCI_ID = 20;

  const [prefill, setPrefill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [kullaniciAciklama, setKullaniciAciklama] = useState("");
  const [kullanimAmaciOzet, setKullanimAmaciOzet] = useState("");

  const [onayciCandidates, setOnayciCandidates] = useState([]);
  const [selectedOnayciIds, setSelectedOnayciIds] = useState([]);

  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    malzemeAdi: "",
    marka: "",
    miktar: "",
    birim: "Adet",
    birimFiyat: "",
    kdvOrani: "", // boşsa backend default %20
    paraBirimi: "TRY",
    kullanimAmaci: "",
    fotoUrl: "",
  });

  const talepEdenId = useMemo(() => {
    try {
      const raw = getCookie("PersonelUserInfo");
      if (!raw) return null;
      const obj = JSON.parse(raw);
      const pid = obj?.id ?? obj?.Id ?? null;
      return pid != null ? Number(pid) : null;
    } catch {
      return null;
    }
  }, [isOpen]);

  const loadPrefill = async () => {
    if (!isEmriId) return;

    setErr("");
    setOk("");

    try {
      setLoading(true);

      // 1) Prefill (iş emri bilgileri)
      const res = await getDataAsync(
        `IsEmriMalzemeTalepBirlesimi/is-emri/${isEmriId}/prefill`
      );
      setPrefill(res || null);

      // 2) ✅ Onaycılar ayrı endpoint’ten
      const onayRes = await getDataAsync("Personeller/satinalma/onaycilar");

      let list = [];
      if (Array.isArray(onayRes)) list = onayRes;
      else if (Array.isArray(onayRes?.onaycilar)) list = onayRes.onaycilar;
      else if (Array.isArray(onayRes?.Onaycilar)) list = onayRes.Onaycilar;

      setOnayciCandidates(list);

      // ✅ Default: 20 seçili gelsin (listede varsa)
      const exists = (list || []).some(
        (p) => (p?.id ?? p?.Id) === DEFAULT_ONAYCI_ID
      );

      setSelectedOnayciIds(exists ? [DEFAULT_ONAYCI_ID] : []);
    } catch (e) {
      setErr(e?.message || "Prefill alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    loadPrefill();

    // modal açılış resetleri
    setItems([]);
    setKullaniciAciklama("");
    setKullanimAmaciOzet("");
    setForm((p) => ({
      ...p,
      malzemeAdi: "",
      marka: "",
      miktar: "",
      birimFiyat: "",
      kdvOrani: "",
      kullanimAmaci: "",
      fotoUrl: "",
    }));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEmriId]);

  const isEmri = prefill?.isEmri ?? prefill?.IsEmri ?? null;
  const linked = prefill?.linkedTalep ?? prefill?.LinkedTalep ?? null;

  const cleanPreview = useMemo(() => {
    if (!isEmri) return "";

    const siteText =
      isEmri?.siteAd ??
      isEmri?.SiteAd ??
      `SiteId:${isEmri?.siteId ?? isEmri?.SiteId ?? "-"}`;

    const kod = isEmri?.kod ?? isEmri?.Kod ?? "-";
    const iid = isEmri?.id ?? isEmri?.Id ?? "-";
    const baslik = isEmri?.kisaBaslik ?? isEmri?.KisaBaslik ?? "-";
    const a1 = isEmri?.aciklama ?? isEmri?.Aciklama ?? "";
    const a2 = isEmri?.aciklama_2 ?? isEmri?.Aciklama_2 ?? "";

    const lines = [];
    lines.push("İŞ EMRİ BAĞLANTISI");
    lines.push(`• Site/Proje : ${siteText}`);
    lines.push(`• İş Emri    : #${kod} `);
    lines.push(`• Başlık     : ${baslik}`);
    if (String(a1 || "").trim()) lines.push(`• Açıklama   : ${String(a1).trim()}`);
    if (String(a2 || "").trim()) lines.push(`• Ek Not     : ${String(a2).trim()}`);

    if (String(kullaniciAciklama || "").trim()) {
      lines.push("");
      lines.push("KULLANICI AÇIKLAMASI");
      lines.push(String(kullaniciAciklama).trim());
    }

    return lines.join("\n");
  }, [isEmri, kullaniciAciklama]);

  const toggleOnayci = (pid) => {
    const idNum = Number(pid);
    if (!idNum) return;

    setSelectedOnayciIds((prev) => {
      const has = prev.includes(idNum);
      if (has) return prev.filter((x) => x !== idNum);
      return [...prev, idNum];
    });
  };

  const addItem = (e) => {
    e.preventDefault();
    setErr("");
    setOk("");

    const malzemeAdi = String(form.malzemeAdi || "").trim();
    if (!malzemeAdi) return setErr("Malzeme adı zorunlu.");

    const miktarInt = parseIntLoose(form.miktar);
    if (miktarInt == null || miktarInt <= 0)
      return setErr("Miktar  0'dan büyük olmalı.");

    const birim = String(form.birim || "Adet");
    if (!BIRIM_OPTIONS.includes(birim)) return setErr("Birim seçimi hatalı.");

    const birimFiyatInt =
      form.birimFiyat === "" ? null : parseIntLoose(form.birimFiyat);

    if (form.birimFiyat !== "" && (birimFiyatInt == null || birimFiyatInt < 0)) {
      return setErr("Birim fiyat tam sayı ve 0 veya pozitif olmalı.");
    }

    const kdvInt = form.kdvOrani === "" ? null : parseIntLoose(form.kdvOrani);
    if (form.kdvOrani !== "" && (kdvInt == null || kdvInt < 0 || kdvInt > 100)) {
      return setErr("KDV oranı 0-100 arasında tam sayı olmalı.");
    }

    setItems((prev) => [
      ...prev,
      {
        malzemeAdi,
        marka: String(form.marka || "").trim() || null,
        miktar: miktarInt, // ✅ tam sayı
        birim,
        birimFiyat: birimFiyatInt, // ✅ tam sayı
        kdvOrani: kdvInt != null ? kdvInt / 100 : null, // 0.20 gibi
        paraBirimi: "TRY",
        kullanimAmaci: String(form.kullanimAmaci || "").trim() || null,
        fotoUrl: String(form.fotoUrl || "").trim() || null,
      },
    ]);

    setForm((p) => ({
      ...p,
      malzemeAdi: "",
      marka: "",
      miktar: "",
      birimFiyat: "",
      kdvOrani: "",
      kullanimAmaci: "",
      fotoUrl: "",
    }));
  };

  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const toplamNet = useMemo(() => {
    return items.reduce((acc, it) => {
      const bf = Number(it.birimFiyat ?? 0) || 0;
      const miktar = Number(it.miktar ?? 0) || 0;
      return acc + bf * miktar;
    }, 0);
  }, [items]);

  const createTalep = async () => {
    setErr("");
    setOk("");

    if (!talepEdenId) return setErr("Cookie’den TalepEdenId okunamadı. (PersonelUserInfo)");
    if (!items.length) return setErr("En az 1 satır eklemelisin.");
    if (!selectedOnayciIds.length) return setErr("En az 1 onaylayıcı seçmelisin.");

    try {
      setSaving(true);

      const payload = {
        talepEdenId,
        kullaniciAciklama: String(kullaniciAciklama || "").trim() || null,
        kullanimAmaciOzet: String(kullanimAmaciOzet || "").trim() || null,
        onayciPersonelIdler: selectedOnayciIds,
        items: items.map((x) => ({
          malzemeAdi: x.malzemeAdi,
          marka: x.marka,
          miktar: Number(x.miktar),
          birim: x.birim,
          kullanimAmaci: x.kullanimAmaci,
          fotoUrl: x.fotoUrl,
          birimFiyat: x.birimFiyat != null ? Number(x.birimFiyat) : null,
          kdvOrani: x.kdvOrani,
          paraBirimi: "TRY",
        })),
      };

      const res = await postDataAsync(
        `IsEmriMalzemeTalepBirlesimi/is-emri/${isEmriId}/IsEmriMalzemeTalebiHizli`,
        payload
      );

      setOk(res?.message ?? res?.Message ?? "Talep oluşturuldu.");
      await onAfterCreated?.(res);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.response?.data?.Message ||
          e?.message ||
          "Talep oluşturulamadı."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 p-4 sm:p-6">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-950">
        {/* header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-zinc-500">Teknik Talep Oluştur</div>
            <div className="truncate text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
              İş Emri: #{isEmri?.kod ?? isEmri?.Kod ?? "-"} (Id:{isEmriId})
            </div>

            {linked ? (
              <div className="mt-1 text-[11px] font-semibold text-emerald-700">
                Mevcut Talep: {linked.seriNo ?? linked.SeriNo} • Onay:{" "}
                {linked.onaylanan ?? linked.Onaylanan}/{linked.onayToplam ?? linked.OnayToplam} • Bekleyen:{" "}
                {linked.bekleyen ?? linked.Bekleyen}
              </div>
            ) : (
              <div className="mt-1 text-[11px] text-zinc-500">Bu iş emrine bağlı talep yok.</div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto p-4">
          {loading ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              Prefill yükleniyor...
            </div>
          ) : null}

          {/* Açıklama Preview */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-2 text-[12px] font-extrabold text-zinc-900 dark:text-zinc-100">
              Talep Açıklaması (Önizleme)
            </div>
            <pre className="whitespace-pre-wrap break-words text-[12px] text-zinc-700 dark:text-zinc-200">
              {cleanPreview || "-"}
            </pre>
          </div>

          {/* Kullanıcı açıklaması */}
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="mb-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                Kullanıcı Açıklaması
              </div>
              <textarea
                rows={4}
                value={kullaniciAciklama}
                onChange={(e) => setKullaniciAciklama(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white p-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-zinc-200"
                placeholder="Ek açıklama..."
              />
            </div>

            <div className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="mb-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                Genel Kullanım Amacı (opsiyonel)
              </div>
              <input
                value={kullanimAmaciOzet}
                onChange={(e) => setKullanimAmaciOzet(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white p-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-zinc-200"
                placeholder="Örn: Pimaş boru sızıntısı için malzeme..."
              />
            </div>
          </div>

          {/* Onaycı seçimi */}
          <div className="mt-3 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="mb-2 text-[12px] font-extrabold text-zinc-900 dark:text-zinc-100">
              Onaylayıcılar (seç)
            </div>

            {onayciCandidates.length === 0 ? (
              <div className="text-[12px] text-zinc-500">Onaylayıcı listesi gelmedi.</div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {onayciCandidates.map((p) => {
                  const pidRaw = p?.id ?? p?.Id;
                  const pid = pidRaw != null ? Number(pidRaw) : 0;
                  if (!pid) return null;

                  const name =
                    p.adSoyad ??
                    p.AdSoyad ??
                    `${p.ad ?? p.Ad ?? ""} ${p.soyad ?? p.Soyad ?? ""}`.trim();

                  const checked = selectedOnayciIds.includes(pid);

                  return (
                    <label
                      key={pid}
                      className={[
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] cursor-pointer",
                        checked
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                          : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200",
                      ].join(" ")}
                    >
                      <input type="checkbox" checked={checked} onChange={() => toggleOnayci(pid)} />
                      <span className="font-semibold">{name}</span>
                      {pid === DEFAULT_ONAYCI_ID ? (
                        <span className="ml-auto rounded-full bg-zinc-900 px-2 py-[2px] text-[10px] font-bold text-white dark:bg-zinc-50 dark:text-black">
                          varsayılan
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            )}

            <div className="mt-2 text-[11px] text-zinc-500">
              Seçilen: <b>{selectedOnayciIds.length}</b>
            </div>
          </div>

          {/* Satır ekleme */}
          <div className="mt-3 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="mb-2 text-[12px] font-extrabold text-zinc-900 dark:text-zinc-100">
              Malzeme Satırı Ekle
            </div>

            <form onSubmit={addItem} className="grid gap-2 md:grid-cols-6">
              <input
                className="md:col-span-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="Malzeme adı"
                value={form.malzemeAdi}
                onChange={(e) => setForm((p) => ({ ...p, malzemeAdi: e.target.value }))}
              />

              <input
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="Miktar"
                inputMode="decimal"
                type="text"
                value={form.miktar}
                onChange={(e) => setForm((p) => ({ ...p, miktar: e.target.value }))}
              />

              <select
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                value={form.birim}
                onChange={(e) => setForm((p) => ({ ...p, birim: e.target.value }))}
              >
                {BIRIM_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <input
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="Birim fiyat "
                inputMode="decimal"
                type="text"
                value={form.birimFiyat}
                onChange={(e) => setForm((p) => ({ ...p, birimFiyat: e.target.value }))}
              />

              <button
                type="submit"
                className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-bold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black"
              >
                Listeye ekle
              </button>

              <input
                className="md:col-span-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="Marka (opsiyonel)"
                value={form.marka}
                onChange={(e) => setForm((p) => ({ ...p, marka: e.target.value }))}
              />

              <input
                className="md:col-span-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="Kullanım amacı (opsiyonel)"
                value={form.kullanimAmaci}
                onChange={(e) => setForm((p) => ({ ...p, kullanimAmaci: e.target.value }))}
              />

              <input
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="KDV % (opsiyonel)"
                inputMode="decimal"
                type="text"
                value={form.kdvOrani}
                onChange={(e) => setForm((p) => ({ ...p, kdvOrani: e.target.value }))}
              />

              <input
                className="md:col-span-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="Foto URL (opsiyonel)"
                value={form.fotoUrl}
                onChange={(e) => setForm((p) => ({ ...p, fotoUrl: e.target.value }))}
              />
            </form>

            {/* liste */}
            <div className="mt-3 space-y-2">
              {items.length === 0 ? (
                <div className="text-[12px] text-zinc-500">Henüz satır eklenmedi.</div>
              ) : (
                items.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="min-w-0">
                      <div className="font-extrabold text-zinc-900 dark:text-zinc-100">{it.malzemeAdi}</div>
                      <div className="text-[12px] text-zinc-500">
                        Miktar: <b>{it.miktar}</b> {it.birim} • BirimFiyat: <b>{it.birimFiyat ?? 0}</b> TRY
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-[12px] font-bold text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                        Satır Net: {Number(it.miktar) * Number(it.birimFiyat ?? 0)} TRY
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[12px] font-bold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="text-[12px] text-zinc-600 dark:text-zinc-300">
                Toplam Net: <b>{toplamNet}</b> TRY
              </div>

              <button
                type="button"
                onClick={createTalep}
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? "Oluşturuluyor..." : "Talebi Oluştur"}
              </button>
            </div>

            {err ? (
              <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {err}
              </div>
            ) : null}

            {ok ? (
              <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                {ok}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}