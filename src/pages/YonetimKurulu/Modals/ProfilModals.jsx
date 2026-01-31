// pages/YonetimKurulu/Modals/ProfilModals.jsx
import { useEffect, useMemo, useState } from "react";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

export default function ProfilModals({
  open,
  onClose,
  personelId,
  personelFromCookie, // (opsiyonel) parent'tan gelen anlık personel bilgisi
  onLogout, // success sonrası 1sn sonra çağrılacak
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [form, setForm] = useState({
    ad: "",
    soyad: "",
    telefon: "",
    eposta: "",
    yeniSifre: "",
    yeniSifre2: "",
  });

  const canRender = open && personelId;

  const title = useMemo(() => {
    const full =
      `${safeText(form.ad).trim()} ${safeText(form.soyad).trim()}`.trim();
    return full.length ? full : "Profil";
  }, [form.ad, form.soyad]);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Modal açılınca personel bilgilerini çek
  useEffect(() => {
    if (!canRender) return;

    let cancelled = false;

    const fillFromCookieFirst = () => {
      if (!personelFromCookie) return;
      setForm((p) => ({
        ...p,
        ad: safeText(personelFromCookie.ad ?? personelFromCookie.Ad),
        soyad: safeText(personelFromCookie.soyad ?? personelFromCookie.Soyad),
        telefon: safeText(personelFromCookie.telefon ?? personelFromCookie.Telefon),
        eposta: safeText(personelFromCookie.eposta ?? personelFromCookie.Eposta),
      }));
    };

    const load = async () => {
      try {
        setLoading(true);
        setErr("");
        setOkMsg("");

        // önce cookie ile hızlı doldur
        fillFromCookieFirst();

        // sonra API’den güncel çek
        const p = await getDataAsync(`Personeller/${personelId}`);
        if (cancelled) return;

        setForm((prev) => ({
          ...prev,
          ad: safeText(p?.ad ?? p?.Ad),
          soyad: safeText(p?.soyad ?? p?.Soyad),
          telefon: safeText(p?.telefon ?? p?.Telefon),
          eposta: safeText(p?.eposta ?? p?.Eposta),
          yeniSifre: "",
          yeniSifre2: "",
        }));
      } catch (e) {
        console.error("Profil load error:", e);
        if (cancelled) return;
        setErr("Profil bilgileri alınamadı.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRender, personelId]);

  const validate = () => {
    if (!personelId) return "PersonelId bulunamadı.";

    // şifre opsiyonel
    const s1 = form.yeniSifre?.trim();
    const s2 = form.yeniSifre2?.trim();
    if (s1 || s2) {
      if (!s1 || !s2) return "Şifre alanlarının ikisini de doldur.";
      if (s1 !== s2) return "Şifreler eşleşmiyor.";
      if (s1.length < 4) return "Şifre en az 4 karakter olmalı.";
    }
    return "";
  };

  const handleSave = async () => {
    setErr("");
    setOkMsg("");

    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        personelId: Number(personelId),
        telefon: form.telefon?.trim() ? form.telefon.trim() : null,
        eposta: form.eposta?.trim() ? form.eposta.trim() : null,
        yeniSifre: form.yeniSifre?.trim() ? form.yeniSifre.trim() : null,
      };

      await postDataAsync("Personeller/profil/guncelle", payload);

      setOkMsg("✅ Profil güncellendi. Çıkış yapılıyor...");

      // 1 sn sonra logout
      setTimeout(() => {
        onLogout?.();
      }, 1000);
    } catch (e) {
      console.error("Profil save error:", e);
      const status = e?.response?.status;
      setErr(status ? `Güncelleme başarısız (HTTP ${status}).` : "Güncelleme başarısız.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* overlay */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-label="Kapat"
      />

      {/* modal */}
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-50 truncate">
              {title}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Profil bilgilerini güncelleyebilirsin. 
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[12px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          {loading && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              Yükleniyor...
            </div>
          )}

          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {err}
            </div>
          )}

          {okMsg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[12px] text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
              {okMsg}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Ad" disabled value={form.ad} />
            <Field label="Soyad" disabled value={form.soyad} />

            <Field
              label="Telefon"
              value={form.telefon}
              onChange={(e) => setField("telefon", e.target.value)}
              placeholder="05xx..."
            />
            <Field
              label="E-posta"
              value={form.eposta}
              onChange={(e) => setField("eposta", e.target.value)}
              placeholder="ornek@mail.com"
            />
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
              Şifre Güncelle (opsiyonel)
            </div>

            <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field
                label="Yeni Şifre"
                type="password"
                value={form.yeniSifre}
                onChange={(e) => setField("yeniSifre", e.target.value)}
                placeholder="••••••"
              />
              <Field
                label="Yeni Şifre (Tekrar)"
                type="password"
                value={form.yeniSifre2}
                onChange={(e) => setField("yeniSifre2", e.target.value)}
                placeholder="••••••"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-[12px] font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Kapat
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="rounded-md border border-emerald-600 bg-emerald-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? "Güncelleniyor..." : "Güncelle"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
}) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
        {label}
      </div>
      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[12px] outline-none focus:border-zinc-400 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
      />
    </label>
  );
}
