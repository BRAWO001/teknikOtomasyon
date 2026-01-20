// components/satinalma/UrunCard.jsx
export default function UrunCard({ urun, formRow, onChange }) {
  const id = urun.id ?? urun.Id;

  const malzemeAdi = urun.malzemeAdi ?? urun.MalzemeAdi;
  const marka = urun.marka ?? urun.Marka ?? "-";
  const adet = urun.adet ?? urun.Adet;
  const birim = urun.birim ?? urun.Birim ?? "-";
  const kullanimAmaci = urun.kullanimAmaci ?? urun.KullanimAmaci ?? "-";
  const ornekLink = urun.ornekUrunLinki ?? urun.OrnekUrunLinki;

  return (
    <div className="rounded-xl border border-blue-700 bg-gradient-to-b from-blue to-blue-50 p-4 shadow-sm">
      {/* Üst başlık */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[16px] font-extrabold leading-snug text-slate-900 break-words">
            {malzemeAdi}
          </div>

          <div className="mt-1.5 text-[12px] text-slate-600">
            <span className="font-bold text-slate-700">Marka:</span> {marka}
            <span className="mx-2 text-slate-300">•</span>
            <span className="font-bold text-slate-700">Adet:</span> {adet} {birim}
          </div>
        </div>

        {/* Link */}
        <div className="shrink-0">
          {ornekLink ? (
            <a
              href={ornekLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[12px] font-bold text-blue-700 hover:bg-blue-100"
            >
              Örnek Link
            </a>
          ) : (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-bold text-slate-500">
              Link yok
            </span>
          )}
        </div>
      </div>

      {/* Kullanım amacı */}
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-100 p-3 text-[13px] leading-relaxed text-slate-900 break-words">
        <div className="text-[12px] font-extrabold text-slate-700">
          Kullanım Amacı
        </div>
        <div className="mt-1">{kullanimAmaci}</div>
      </div>

      {/* Form alanları */}
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Birim Fiyat */}
        <div>
          <div className="mb-1 text-[12px] font-extrabold text-slate-700">
            Birim Fiyat
          </div>
          <input
            type="number"
            step="0.01"
            value={formRow.birimFiyat}
            onChange={(e) => onChange(id, "birimFiyat", e.target.value)}
            placeholder="0,00"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-right text-[14px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* Para Birimi */}
        <div>
          <div className="mb-1 text-[12px] font-extrabold text-slate-700">
            Para Birimi
          </div>
          <select
            value={formRow.paraBirimi}
            onChange={(e) => onChange(id, "paraBirimi", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[14px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="TRY">TRY</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>

        {/* KDV */}
        <div>
          <div className="mb-1 text-[12px] font-extrabold text-slate-700">
            KDV (%)
          </div>
          <input
            type="number"
            min="0"
            step="1"
            value={formRow.kdvOraniYuzde}
            onChange={(e) => onChange(id, "kdvOraniYuzde", e.target.value)}
            placeholder="20"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[14px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* Not (tam genişlik) */}
        <div className="sm:col-span-2 lg:col-span-3">
          <div className="mb-1 text-[12px] font-extrabold text-slate-700">
            Not
          </div>
          <input
            type="text"
            value={formRow.not}
            onChange={(e) => onChange(id, "not", e.target.value)}
            placeholder="İsteğe bağlı not"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[14px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>
    </div>
  );
}
