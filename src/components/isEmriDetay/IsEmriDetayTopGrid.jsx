export default function IsEmriDetayTopGrid({
  site,
  apt,
  ev,
  konum,
  evSahibi,
  kiraci,
  aciklama,
  aciklama_2,
}) {
  return (
    <section className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {/* Konum / adres */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Konum / Adres
        </div>

        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {site?.ad && (
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                {site.ad}
              </span>
            )}

            {apt?.ad && (
              <>
                <span className="text-zinc-400">•</span>
                <span className="font-medium">{apt.ad}</span>
              </>
            )}

            {ev?.kapiNo && (
              <>
                <span className="text-zinc-400">•</span>
                <span>
                  Kapı: <span className="font-semibold">{ev.kapiNo}</span>
                </span>
              </>
            )}

            {ev?.pkNo && (
              <>
                <span className="text-zinc-400">•</span>
                <span>
                  PK: <span className="font-semibold">{ev.pkNo}</span>
                </span>
              </>
            )}
          </div>

          {konum?.adresMetni && (
            <div className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">
              {konum.adresMetni}
            </div>
          )}

          {(konum?.enlem || konum?.boylam) && (
            <div className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
              Koordinat: {konum?.enlem ?? "-"} / {konum?.boylam ?? "-"}
            </div>
          )}
        </div>
      </div>

      {/* Ev Sahibi / Kiracı */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
        <div className="mb-1 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Kişiler
          </div>
        </div>

        <div className="space-y-1">
          <div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Ev Sahibi
            </div>
            {evSahibi ? (
              <div className="font-medium">
                {evSahibi.adSoyad}{" "}
                {evSahibi.telefon && (
                  <span className="text-[10px] text-zinc-500">
                    — {evSahibi.telefon}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Tanımlı değil.
              </div>
            )}
          </div>

          <div className="pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-700">
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Kiracı
            </div>
            {kiraci ? (
              <div className="font-medium">
                {kiraci.adSoyad}{" "}
                {kiraci.telefon && (
                  <span className="text-[10px] text-zinc-500">
                    — {kiraci.telefon}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Tanımlı değil.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Açıklama */}
      {(aciklama || aciklama_2) && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Açıklama
          </div>

          {aciklama && (
            <div className="text-[11px] leading-snug">{aciklama}</div>
          )}

          {aciklama_2 && (
            <div className="mt-1 text-[11px] leading-snug text-zinc-600 dark:text-zinc-300">
              {aciklama_2}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
