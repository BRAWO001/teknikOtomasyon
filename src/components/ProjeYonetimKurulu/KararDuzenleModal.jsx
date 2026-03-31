



import { useEffect, useMemo, useRef, useState } from "react";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

const sectionClass =
  "rounded-3xl border border-zinc-200 bg-zinc-50/80 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50";

function normalizeLine(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

function updateKatilanlarInHtml(html, katilanlarText) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html || "", "text/html");

    const divs = [...doc.querySelectorAll("div")];
    const hedef = divs.find((el) => {
      const b = el.querySelector("b");
      return (
        b &&
        normalizeLine(b.textContent).toUpperCase() ===
          "TOPLANTIYA KATILANLAR:"
      );
    });

    if (hedef) {
      hedef.innerHTML = `<b>TOPLANTIYA KATILANLAR:</b> ${String(
        katilanlarText || ""
      )}`;
    }

    return doc.body.innerHTML;
  } catch {
    return html || "";
  }
}

function extractOlItemsFromHtml(html) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html || "", "text/html");
    return [...doc.querySelectorAll("ol li")]
      .map((li) => normalizeLine(li.textContent))
      .filter(Boolean);
  } catch {
    return [];
  }
}

export default function KararDuzenleModal({
  open,
  onClose,
  data,
  personel,
  onSaved,
}) {
  const editorRef = useRef(null);

  const [uyeler, setUyeler] = useState([]);
  const [uyelerLoading, setUyelerLoading] = useState(false);
  const [selectedPersonelIds, setSelectedPersonelIds] = useState([]);

  const [editorHtml, setEditorHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const isRol90 = useMemo(() => Number(personel?.rol) === 90, [personel]);
  const isRol40 = useMemo(() => Number(personel?.rol) === 40, [personel]);
  const isRol11 = useMemo(() => Number(personel?.rol) === 11, [personel]);

  const canOpenEdit = useMemo(() => {
    if (!data) return false;

    if (isRol90 || isRol40) return true;

    if (isRol11 && data?.duzenlemeDurumu) {
      return (data?.onerenKisiler || []).some(
        (x) => Number(x.personelId) === Number(personel?.id)
      );
    }

    return false;
  }, [data, isRol90, isRol40, isRol11, personel?.id]);

  useEffect(() => {
    if (!open || !data) return;

    setEditorHtml(data?.kararAciklamasi || "");
    setMsg("");

    const mevcutIds = Array.isArray(data?.onerenKisiler)
      ? data.onerenKisiler
          .map((x) => Number(x.personelId))
          .filter((x) => Number.isFinite(x) && x > 0)
      : [];

    setSelectedPersonelIds(mevcutIds);
  }, [open, data]);

  useEffect(() => {
    if (!open || !data?.siteId) return;

    let cancelled = false;

    const loadUyeler = async () => {
      try {
        setUyelerLoading(true);
        const list = await getDataAsync(
          `ProjeYonetimKurulu/site/${data.siteId}/uyeler`
        );
        if (!cancelled) {
          setUyeler(Array.isArray(list) ? list : list ? [list] : []);
        }
      } catch {
        if (!cancelled) setUyeler([]);
      } finally {
        if (!cancelled) setUyelerLoading(false);
      }
    };

    loadUyeler();

    return () => {
      cancelled = true;
    };
  }, [open, data?.siteId]);

  useEffect(() => {
    if (!open) return;
    if (editorRef.current && editorRef.current.innerHTML !== editorHtml) {
      editorRef.current.innerHTML = editorHtml || "";
    }
  }, [open, editorHtml]);

  const formatUye = (u) => {
    const p = u?.personel;
    if (!p) return `Personel #${u?.personelId}`;
    return `${p.ad ?? ""} ${p.soyad ?? ""}`.trim();
  };

  const katilanlarText = useMemo(() => {
    const secilenler = uyeler.filter((u) =>
      selectedPersonelIds.includes(Number(u.personelId))
    );
    return secilenler.map((x) => formatUye(x)).filter(Boolean).join(", ");
  }, [uyeler, selectedPersonelIds]);

  const toggleSelect = (pid) => {
    const id = Number(pid);
    if (!id) return;

    setSelectedPersonelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (!open) return;
    if (!editorRef.current) return;

    const currentHtml = editorRef.current.innerHTML || "";
    if (!currentHtml) return;

    const nextHtml = updateKatilanlarInHtml(currentHtml, katilanlarText);
    if (nextHtml !== currentHtml) {
      editorRef.current.innerHTML = nextHtml;
      setEditorHtml(nextHtml);
    }
  }, [katilanlarText, open]);

  const runCmd = (cmd, value = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    setEditorHtml(editorRef.current?.innerHTML || "");
  };

  const insertParagraphAtCursor = () => {
    editorRef.current?.focus();
    document.execCommand("insertParagraph", false, null);
    setEditorHtml(editorRef.current?.innerHTML || "");
  };

  const handleEditorKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertParagraph", false, null);
      setEditorHtml(editorRef.current?.innerHTML || "");
    }
  };

  const validate = () => {
    if (!canOpenEdit) return "Bu kaydı düzenleme yetkin yok.";

    const currentHtml = editorRef.current?.innerHTML || editorHtml || "";
    const plainText = normalizeLine(currentHtml.replace(/<[^>]*>/g, " "));
    if (!plainText) return "Karar içeriği boş olamaz.";

    const items = extractOlItemsFromHtml(currentHtml);
    if (!items.length) return "En az 1 karar maddesi olmalı.";

    if (!selectedPersonelIds.length) return "En az 1 üye seçmelisin.";

    return "";
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      setMsg(err);
      return;
    }

    try {
      setSaving(true);
      setMsg("");

      let finalHtml = editorRef.current?.innerHTML || editorHtml || "";
      finalHtml = updateKatilanlarInHtml(finalHtml, katilanlarText);

      const payload = {
        kararId: Number(data.id),
        siteId: Number(data.siteId),
        kararKonusu: String(data?.kararKonusu ?? "").trim(),
        kararAciklamasi: finalHtml,
        onerenPersonelIdler: selectedPersonelIds,
      };

      const res = await postDataAsync(
        `ProjeYonetimKurulu/karar/${data.id}/update`,
        payload
      );

      onSaved?.(res);
      onClose?.();
    } catch (e) {
      console.error("KARAR UPDATE ERROR:", e);
      setMsg("Karar güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-3 backdrop-blur-[2px]">
      <div className="max-h-[94vh] w-full max-w-7xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
          <div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Karar Düzenle
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Kapat
          </button>
        </div>

        <div className="max-h-[calc(94vh-88px)] overflow-y-auto px-6 py-6">
          {msg ? (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
              {msg}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_0.9fr]">
            <div className="space-y-5">
              <div className={sectionClass}>
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => runCmd("bold")}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    title="Kalın"
                  >
                    B
                  </button>

                  <button
                    type="button"
                    onClick={() => runCmd("italic")}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm italic hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    title="İtalik"
                  >
                    I
                  </button>

                  <button
                    type="button"
                    onClick={() => runCmd("underline")}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm underline hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    title="Altı çizili"
                  >
                    U
                  </button>

                  <button
                    type="button"
                    onClick={() => runCmd("insertOrderedList")}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    title="Numaralı liste"
                  >
                    1. Liste
                  </button>

                  <button
                    type="button"
                    onClick={() => runCmd("insertUnorderedList")}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    title="Noktalı liste"
                  >
                    • Liste
                  </button>

                  <button
                    type="button"
                    onClick={insertParagraphAtCursor}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    title="Paragraf"
                  >
                    Paragraf
                  </button>
                </div>

                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => setEditorHtml(e.currentTarget.innerHTML)}
                  onKeyDown={handleEditorKeyDown}
                  className="min-h-[520px] rounded-2xl border border-zinc-200 bg-white p-5 text-[14px] leading-7 text-zinc-800 outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                  style={{ whiteSpace: "normal" }}
                />
              </div>
            </div>

            <div className="space-y-5">
              <div className={sectionClass}>
                <div className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Üyeler
                </div>

                {uyelerLoading ? (
                  <div className="rounded-xl border border-zinc-200 bg-white px-4 py-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    Üyeler yükleniyor...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {uyeler.map((u) => {
                      const pid = Number(u.personelId);
                      const checked = selectedPersonelIds.includes(pid);

                      return (
                        <label
                          key={u.id ?? pid}
                          className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 ${
                            checked
                              ? "border-zinc-400 bg-white shadow-sm dark:border-zinc-600 dark:bg-zinc-950"
                              : "border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-950"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelect(pid)}
                            className="mt-1 h-4 w-4"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {formatUye(u)}
                            </div>
                            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                              Personel Id: {pid}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Seçili Üyeler
                  </div>
                  <div className="text-sm leading-6 text-zinc-800 dark:text-zinc-100">
                    {katilanlarText || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-zinc-200 pt-5 sm:flex-row sm:items-center sm:justify-end dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl border border-zinc-200 px-5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Vazgeç
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-11 rounded-xl bg-zinc-900 px-6 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {saving ? "Kaydediliyor..." : "Güncelle ve Kaydet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}