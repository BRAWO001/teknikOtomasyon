// components/Denetim/DenetimDosyaPanel.jsx
import { useRef } from "react";
const turler = { 10: "Fotoğraf", 20: "Belge" };
export default function DenetimDosyaPanel({
  value = [],
  onChange,
  disabled = false,
}) {
  const fotoRef = useRef(null);
  const belgeRef = useRef(null);
  const addFiles = (event, tur) => {
    const selected = Array.from(event.target.files || []);
    const items = selected.map((file) => ({
      localId: `${Date.now()}-${Math.random()}`,
      file,
      tur,
      url: null,
    }));
    onChange?.([...value, ...items]);
    event.target.value = "";
  };
  const remove = (localId) =>
    onChange?.(value.filter((x) => x.localId !== localId));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={disabled}
          type="button"
          className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-5 text-center text-xs font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
          onClick={() => fotoRef.current?.click()}
        >
          <span className="mb-2 block text-2xl">▧</span>Fotoğraf Ekle
        </button>
        <button
          disabled={disabled}
          type="button"
          className="rounded-xl border-2 border-dashed border-sky-300 bg-sky-50 p-5 text-center text-xs font-bold text-sky-800 hover:bg-sky-100 disabled:opacity-50 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200"
          onClick={() => belgeRef.current?.click()}
        >
          <span className="mb-2 block text-2xl">▤</span>Belge Ekle
        </button>
      </div>
      <input
        ref={fotoRef}
        hidden
        multiple
        type="file"
        accept="image/*"
        onChange={(e) => addFiles(e, 10)}
      />
      <input
        ref={belgeRef}
        hidden
        multiple
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,application/pdf"
        onChange={(e) => addFiles(e, 20)}
      />
      {value.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 p-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
          Henüz dosya seçilmedi.
        </div>
      ) : (
        <div className="max-h-[300px] space-y-2 overflow-auto">
          {value.map((x) => (
            <div
              key={x.localId}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2 text-xs dark:border-zinc-700"
            >
              <span className="rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
                {turler[x.tur]}
              </span>
              <span className="min-w-0 flex-1 truncate" title={x.file.name}>
                {x.file.name}
              </span>
              <span className="shrink-0 text-[10px] text-zinc-500">
                {(x.file.size / 1024 / 1024).toFixed(1)} MB
              </span>
              <button
                disabled={disabled}
                className="text-red-600 disabled:opacity-40"
                onClick={() => remove(x.localId)}
              >
                Sil
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] leading-relaxed text-zinc-500">
        {value.length} dosya seçildi. 
      </p>
    </div>
  );
}
