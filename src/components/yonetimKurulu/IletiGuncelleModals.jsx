import { useEffect, useMemo, useState } from "react";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

const DOSYA_URL_BASE = "ProjeYKIletiDosyaYukle";

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function toInputDatetimeLocal(isoUtc) {
  if (!isoUtc) return "";
  try {
    const d = new Date(isoUtc);
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  } catch {
    return "";
  }
}

function fromInputDatetimeLocalToIso(dtLocal) {
  if (!dtLocal) return null;
  try {
    const d = new Date(dtLocal); // local
    return d.toISOString(); // utc iso
  } catch {
    return null;
  }
}

export default function IletiGuncelleModals({
  isOpen,
  onClose,
  ileti, // { id, tarihUtc, iletiBaslik, iletiAciklama, durum }
  onAfterSaved,
}) {
  const iletiId = Number(ileti?.id || 0);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [durum, setDurum] = useState("");
  const [tarihLocal, setTarihLocal] = useState("");

  const [dosyalar, setDosyalar] = useState([]);
  const [dosyaLoading, setDosyaLoading] = useState(false);
  const [dosyaMsg, setDosyaMsg] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    setMsg(null);
    setDosyaMsg(null);

    setBaslik(safeText(ileti?.iletiBaslik || ""));
    setAciklama(safeText(ileti?.iletiAciklama || ""));
    setDurum(safeText(ileti?.durum || ""));
    setTarihLocal(toInputDatetimeLocal(ileti?.tarihUtc));
  }, [isOpen, ileti?.id]);

  useEffect(() => {
    if (!isOpen) return;
    if (!iletiId) return;

    let cancelled = false;
    const loadDosyalar = async () => {
      try {
        setDosyaLoading(true);
        setDosyaMsg(null);

        const list = await getDataAsync(`${DOSYA_URL_BASE}/${iletiId}`);
        if (cancelled) return;

        setDosyalar(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("MODAL DOSYA GET ERROR:", e);
        if (!cancelled) setDosyaMsg("Dosyalar alınamadı.");
      } finally {
        if (!cancelled) setDosyaLoading(false);
      }
    };

    loadDosyalar();
    return () => {
      cancelled = true;
    };
  }, [isOpen, iletiId]);

  const canSave = useMemo(() => {
    if (!iletiId) return false;
    if (!baslik.trim()) return false;
    if (!aciklama.trim()) return false;
    return true;
  }, [iletiId, baslik, aciklama]);

  const handleSave = async () => {
    if (!canSave) {
      setMsg("Başlık ve açıklama zorunlu.");
      return;
    }

    try {
      setLoading(true);
      setMsg(null);

      const payload = {
        tarihUtc: fromInputDatetimeLocalToIso(tarihLocal), // null olabilir (backend ignore edebilir)
        iletiBaslik: baslik.trim(),
        iletiAciklama: aciklama.trim(),
        durum: durum.trim() ? durum.trim() : null,
      };

      await postDataAsync(`projeYonetimKurulu/ileti/${iletiId}/update`, payload);

      setMsg("Güncellendi.");
      if (onAfterSaved) await onAfterSaved();
      onClose?.();
    } catch (e) {
      console.error("MODAL UPDATE ERROR:", e);
      const status = e?.response?.status;
      setMsg(status ? `Güncellenemedi (HTTP ${status}).` : "Güncellenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDosya = async (dosyaId) => {
    const did = Number(dosyaId || 0);
    if (!iletiId || !did) return;

    const ok = window.confirm("Bu dosyayı silmek istiyor musunuz?");
    if (!ok) return;

    try {
      setDosyaLoading(true);
      setDosyaMsg(null);

      // ✅ POST ile dosya sil (backend: POST api/ProjeYKIletiDosyaYukle/dosya-sil)
      const res = await postDataAsync(`${DOSYA_URL_BASE}/dosya-sil`, {
        iletiId: iletiId,
        dosyaId: did,
      });

      // backend: { Items: [...] }
      const next = Array.isArray(res?.Items)
        ? res.Items
        : Array.isArray(res?.items)
        ? res.items
        : null;

      if (next) setDosyalar(next);
      else {
        const list = await getDataAsync(`${DOSYA_URL_BASE}/${iletiId}`);
        setDosyalar(Array.isArray(list) ? list : []);
      }

      setDosyaMsg("Dosya silindi.");
      if (onAfterSaved) await onAfterSaved();
    } catch (e) {
      console.error("MODAL DOSYA POST DELETE ERROR:", e);
      const status = e?.response?.status;
      setDosyaMsg(status ? `Dosya silinemedi (HTTP ${status}).` : "Dosya silinemedi.");
    } finally {
      setDosyaLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-3 py-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              İleti Güncelle
            </div>
            <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              Metinleri düzenleyebilir, durum/tarih güncelleyebilir ve dosya silebilirsiniz.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-[12px] font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Kapat ✕
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[75vh] overflow-auto px-5 py-4">
          {/* Form */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">Başlık</div>
              <input
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[13px] outline-none transition
                  focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200
                  dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                placeholder="İleti başlığı..."
              />
            </div>

            <div>
              <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">Durum</div>
              <input
                value={durum}
                onChange={(e) => setDurum(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[13px] outline-none transition
                  focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200
                  dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                placeholder="Beklemede / Yayında / ..."
              />
            </div>

            <div>
              <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">Tarih</div>
              <input
                type="datetime-local"
                value={tarihLocal}
                onChange={(e) => setTarihLocal(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[13px] outline-none transition
                  focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200
                  dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
              />
              
            </div>

            <div className="md:col-span-2">
              <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">Açıklama</div>
              <textarea
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                rows={6}
                className="mt-1 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[13px] leading-relaxed outline-none transition
                  focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200
                  dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                placeholder="İleti açıklaması..."
              />
            </div>
          </div>

          {/* Dosyalar */}
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-50">Dosyalar</div>
                <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Toplam: {Array.isArray(dosyalar) ? dosyalar.length : 0}
                </div>
              </div>

              {dosyaLoading ? (
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">İşleniyor...</div>
              ) : null}
            </div>

            {dosyaMsg ? (
              <div className="mt-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                {dosyaMsg}
              </div>
            ) : null}

            <div className="mt-3 space-y-2">
              {Array.isArray(dosyalar) && dosyalar.length > 0 ? (
                dosyalar.map((d) => (
                  <div
                    key={d.id ?? d.Id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-semibold text-zinc-900 dark:text-zinc-50">
                        {d.dosyaAdi ?? d.DosyaAdi ?? "Dosya"}
                      </div>
                      <div className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                        {d.turAd ?? d.TurAd ?? ""} • Sıra: {d.sira ?? d.Sira ?? "-"}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <a
                        href={d.url ?? d.Url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center rounded-xl border border-zinc-200 bg-white px-3 text-[12px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                      >
                        Aç
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDeleteDosya(d.id ?? d.Id)}
                        disabled={dosyaLoading}
                        className="inline-flex h-9 items-center rounded-xl bg-red-600 px-3 text-[12px] font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                  Dosya yok.
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          {msg ? (
            <div className="mt-4 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              {msg}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-[12px] font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Vazgeç
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || loading}
            className="inline-flex h-10 items-center rounded-xl bg-zinc-900 px-4 text-[12px] font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
