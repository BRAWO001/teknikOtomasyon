// src/components/NotEkleModals.jsx
import { useEffect, useState } from "react";
import { getDataAsync, postDataAsync } from "../utils/apiService";
import { getCookie as getClientCookie } from "../utils/cookieService";

function formatTR(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

/**
 * NotEkleModals
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - isEmriId: number  (zorunlu)
 * - isEmriKod?: string (başlıkta göstermek için opsiyonel)
 *
 * Personel bilgisi cookie'den okunur:
 * - PersonelUserInfo (JSON, personel objesi)
 */
export default function NotEkleModals({
  isOpen,
  onClose,
  isEmriId,
  isEmriKod,
}) {
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState("");

  const [newNote, setNewNote] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Giriş yapmış personel (cookie'den)
  const [personel, setPersonel] = useState(null);

  // 🔹 PersonelUserInfo cookie'sini oku
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const personelCookie = getClientCookie("PersonelUserInfo");
      if (personelCookie) {
        // Cookie doğrudan personel objesi veya { personel: {...} }
        const parsed = JSON.parse(personelCookie);
        const p = parsed?.personel ?? parsed;
        setPersonel(p);
      }
    } catch (err) {
      console.error("PersonelUserInfo parse error:", err);
    }
  }, []);

  // ESC ile kapatma
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Modal açılınca notları çek
  useEffect(() => {
    if (!isOpen || !isEmriId) return;

    const loadNotes = async () => {
      try {
        setLoadingNotes(true);
        setNotesError("");

        // 🔹 DOĞRU API: GET api/NotEkle/{isEmriId}/notlar
        const data = await getDataAsync(`NotEkle/${isEmriId}/notlar`);
        setNotes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Notlar alınırken hata:", err);
        setNotesError(err?.message || "Notlar alınırken bir hata oluştu.");
      } finally {
        setLoadingNotes(false);
      }
    };

    loadNotes();
  }, [isOpen, isEmriId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!newNote.trim()) {
      setSubmitError("Not metni boş olamaz.");
      return;
    }

    if (!personel?.id) {
      setSubmitError("Personel bilgisi bulunamadı (cookie okunamadı).");
      return;
    }

    try {
      setSubmitLoading(true);

      const payload = {
        personelId: personel.id,
        metin: newNote.trim(),
      };

      // 🔹 DOĞRU API: POST api/NotEkle/{isEmriId}/notlar
      const created = await postDataAsync(
        `NotEkle/${isEmriId}/notlar`,
        payload
      );

      // Backend ihtimalleri:
      // 1) { message, not: { ... } }
      // 2) { id, metin, olusturmaTarihiUtc, ... }
      if (created?.not) {
        setNotes((prev) => [created.not, ...prev]);
      } else if (created?.id) {
        setNotes((prev) => [created, ...prev]);
      } else {
        // En kötü ihtimalle local olarak ekle
        setNotes((prev) => [
          {
            id: `temp-${Date.now()}`,
            metin: newNote.trim(),
            olusturmaTarihiUtc: new Date().toISOString(),
            personel: {
              ad: personel.ad,
              soyad: personel.soyad,
            },
          },
          ...prev,
        ]);
      }

      setNewNote("");
    } catch (err) {
      console.error("Not eklenirken hata:", err);
      setSubmitError(err?.message || "Not eklenirken bir hata oluştu.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCloseAndReload = () => {
    onClose?.();
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black p-2"
      onClick={onClose}
    >
      {/* İçerik – tıklamayı durdur */}
      <div
        className="relative flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              İş Emri Notları
            </div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {isEmriKod
                ? `${isEmriKod} (ID: ${isEmriId})`
                : `İş Emri ID: ${isEmriId}`}
            </div>
            {personel && (
              <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                Notu ekleyen:{" "}
                <span className="font-semibold">
                  {personel.ad} {personel.soyad}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleCloseAndReload}
            className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Kapat
          </button>
        </div>

        {/* BODY – scroll alanı */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          {/* Yeni not ekleme */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Yeni Not Ekle
            </div>
            <textarea
              rows={4}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-50"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Bu iş emriyle ilgili notunuzu yazın..."
            />
            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                {submitError}
              </div>
            )}
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={submitLoading}
                className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
              >
                {submitLoading ? "Kaydediliyor..." : "Notu Kaydet"}
              </button>
            </div>
          </form>

          {/* Notlar listesi */}
          <div className="mt-2 border-t border-dashed border-zinc-200 pt-3 text-xs dark:border-zinc-800">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-semibold text-zinc-700 dark:text-zinc-300">
                Tüm Notlar
              </div>
              {loadingNotes && (
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Yükleniyor...
                </div>
              )}
            </div>

            {notesError && (
              <div className="mb-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                {notesError}
              </div>
            )}

            {notes.length === 0 && !loadingNotes && !notesError && (
              <div className="rounded-xl border border-dashed border-zinc-200 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                Bu iş emri için henüz not eklenmemiş.
              </div>
            )}

            {notes.length > 0 && (
              <div className="space-y-2">
                {notes.map((n) => {
                  // Backend'e göre iki ihtimal:
                  // 1) n.personel { ad, soyad }
                  // 2) n.adSoyad (tek string)
                  const fullNameFromPersonel = `${n?.personel?.ad ?? ""} ${
                    n?.personel?.soyad ?? ""
                  }`.trim();
                  const fullNameFromAdSoyad = (n?.adSoyad || "").trim();
                  const fullName =
                    fullNameFromPersonel || fullNameFromAdSoyad || "";

                  return (
                    <div
                      key={n.id}
                      className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-700 ring-1 ring-zinc-100 dark:bg-zinc-950/40 dark:text-zinc-200 dark:ring-zinc-800"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white dark:bg-zinc-50 dark:text-black">
                            {fullName
                              ? fullName
                                  .split(" ")
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .map((p) => p[0])
                                  .join("")
                                  .toUpperCase()
                              : "?"}
                          </span>
                          <span className="font-semibold">
                            {fullName || "Bilinmeyen Personel"}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {formatTR(n.olusturmaTarihiUtc)}
                        </span>
                      </div>
                      <div className="text-zinc-600 dark:text-zinc-300">
                        {n.metin}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
