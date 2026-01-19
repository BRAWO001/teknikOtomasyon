// src/components/isEmriDetay/SurecDurumuGuncelleModals.jsx
import { useEffect, useMemo, useState } from "react";
import { postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

const DURUM_OPTIONS = [
  { value: "", label: "Seçiniz..." },
  { value: "İncelemede", label: "İncelemede" },
  { value: "Kontrol Ediliyor", label: "Kontrol Ediliyor" },
  { value: "Tamamlandı", label: "Tamamlandı" },
];

export default function SurecDurumuGuncelleModals({
  isOpen,
  onClose,
  isEmriId,
  alan, // "PROJE" | "OP_TEK" | "OP_GEN"
  alanTitle,
  initialDurum,
  initialNot,
}) {
  const [personel, setPersonel] = useState(null);

  const [durum, setDurum] = useState("");
  const [not, setNot] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ✅ Cookie’den personel oku
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isOpen) return;

    try {
      const personelCookie = getClientCookie("PersonelUserInfo");
      if (personelCookie) {
        const parsed = JSON.parse(personelCookie);
        const p = parsed?.personel ?? parsed;
        setPersonel(p);
      }
    } catch (e) {
      console.error("PersonelUserInfo parse error:", e);
      setPersonel(null);
    }
  }, [isOpen]);

  // ✅ Modal açılınca initial doldur
  useEffect(() => {
    if (!isOpen) return;
    setDurum(((initialDurum ?? "").toString() || "").trim());
    setNot((initialNot ?? "").toString());
    setErr("");
  }, [isOpen, initialDurum, initialNot]);

  // ✅ ESC ile kapatma
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // ✅ RolKod normalize
  const rolKod = useMemo(() => {
    if (!personel) return null;

    const rk1 = personel?.rolKod ?? personel?.RolKod ?? null;
    if (rk1 != null && !isNaN(Number(rk1))) return Number(rk1);

    const r2 = personel?.rol ?? personel?.Rol ?? null;
    if (r2 != null && !isNaN(Number(r2))) return Number(r2);

    const s = (r2 ?? "").toString().toLowerCase();
    if (s.includes("proje") && s.includes("yonet")) return 40;
    if ((s.includes("teknik") && s.includes("mudur")) || s.includes("operasyon"))
      return 90;

    return null;
  }, [personel]);

  // ✅ Alan bazında yetki
  const canEditThisAlan = useMemo(() => {
    if (!alan) return false;
    if (alan === "PROJE") return rolKod === 40;
    if (alan === "OP_TEK" || alan === "OP_GEN") return rolKod === 90;
    return false;
  }, [alan, rolKod]);

  const personelId = useMemo(() => {
    const pid = personel?.id ?? personel?.Id ?? null;
    return pid ? Number(pid) : null;
  }, [personel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!isEmriId) return setErr("isEmriId bulunamadı.");
    if (!alan) return setErr("Alan seçilmedi.");
    if (!personelId) return setErr("Personel bilgisi bulunamadı (cookie).");
    if (!canEditThisAlan) return setErr("Bu alanı güncelleme yetkiniz yok.");

    try {
      setLoading(true);

      const payload = {
        personelId,
        alan,
        durum: (durum ?? "").toString().trim() || null,
        not: (not ?? "").toString().trim() || null,
      };

      await postDataAsync(`is-emirleri/${isEmriId}/surec`, payload);

      // ✅ Kaydet başarılı → modal kapansın → sayfa yenilensin
      onClose?.();
      window.location.reload();
    } catch (e2) {
      console.error("Süreç güncelle hata:", e2);
      setErr(
        e2?.response?.data?.message ||
          e2?.message ||
          "Süreç güncellenirken hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const fullName = `${personel?.ad ?? personel?.Ad ?? ""} ${
    personel?.soyad ?? personel?.Soyad ?? ""
  }`.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black p-2"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Süreç Güncelle
            </div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {alanTitle || "Süreç"} — İş Emri #{isEmriId}
            </div>

            <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              Kullanıcı:{" "}
              <span className="font-semibold">{fullName || "Bilinmeyen"}</span>{" "}
              • RolKod: <span className="font-semibold">{rolKod ?? "-"}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Kapat
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-4 py-4">
          {!canEditThisAlan && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Bu alanı güncelleme yetkiniz yok.
              <div className="mt-1 text-[11px] opacity-80">
                Kural: PROJE → Rol 40, OP_* → Rol 90
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
              Durum
            </label>

            <select
              value={durum}
              onChange={(e) => setDurum(e.target.value)}
              disabled={!canEditThisAlan || loading}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-50"
            >
              {DURUM_OPTIONS.map((o) => (
                <option key={o.value || "empty"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {!!initialDurum &&
              !DURUM_OPTIONS.some(
                (x) => x.value === (initialDurum ?? "").toString().trim()
              ) && (
                <div className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                  Mevcut değer:{" "}
                  <span className="font-semibold">{initialDurum}</span> 
                </div>
              )}
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
              Not
            </label>
            <textarea
              rows={5}
              value={not}
              onChange={(e) => setNot(e.target.value)}
              disabled={!canEditThisAlan || loading}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-50"
              placeholder="Detay not..."
            />
          </div>

          {err && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {err}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Vazgeç
            </button>

            <button
              type="submit"
              disabled={loading || !canEditThisAlan}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
            >
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
