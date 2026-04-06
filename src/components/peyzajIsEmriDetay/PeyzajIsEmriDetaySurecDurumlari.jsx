import { useEffect, useMemo, useState } from "react";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import PeyzajSurecDurumuGuncelleModals from "@/components/peyzajIsEmriDetay/PeyzajSurecDurumuGuncelleModals";

export default function PeyzajIsEmriDetaySurecDurumlari({ record, onUpdated }) {
  const pick = (obj, camel, pascal) => obj?.[camel] ?? obj?.[pascal] ?? null;

  const [personel, setPersonel] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeAlan, setActiveAlan] = useState(null); // "PROJE" | "PEYZAJ"
  const [activeTitle, setActiveTitle] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const c = getClientCookie("PersonelUserInfo");
      if (!c) return;
      const parsed = JSON.parse(c);
      setPersonel(parsed?.personel ?? parsed);
    } catch (e) {
      console.error("PersonelUserInfo parse error:", e);
      setPersonel(null);
    }
  }, []);

  const rolKod = useMemo(() => {
    if (!personel) return null;

    const rk1 = personel?.rolKod ?? personel?.RolKod ?? null;
    if (rk1 != null && !isNaN(Number(rk1))) return Number(rk1);

    const rk2 = personel?.rol ?? personel?.Rol ?? null;
    if (rk2 != null && !isNaN(Number(rk2))) return Number(rk2);

    const s = (rk2 ?? "").toString().toLowerCase();

    if (s.includes("proje") && s.includes("yonet")) return 40;
    if (s.includes("peyzaj")) return 50;
    if (s.includes("bahce")) return 50;

    return null;
  }, [personel]);

  const canEditProje = rolKod === 40;
  const canEditPeyzaj = rolKod === 50 || rolKod === 90;

  const fmt = (v) => {
    const s = (v ?? "").toString().trim();
    return s ? s : null;
  };

  const toneClasses = (tone) => {
    if (tone === "emerald")
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200";
    if (tone === "sky")
      return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200";
    return "border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-200";
  };

  const projeDurum = fmt(
    pick(record, "projeSorSurecDurumu", "ProjeSorSurecDurumu")
  );
  const projeNot = fmt(
    pick(record, "projeSorSurNot", "ProjeSorSurNot")
  );

  const peyzajDurum = fmt(
    pick(record, "peyzajSorSurecDurumu", "PeyzajSorSurecDurumu")
  );
  const peyzajNot = fmt(
    pick(record, "peyzajSorSurNot", "PeyzajSorSurNot")
  );

  const openModal = (alan, title) => {
    setActiveAlan(alan);
    setActiveTitle(title);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveAlan(null);
    setActiveTitle("");
  };

  const initialDurum =
    activeAlan === "PROJE"
      ? projeDurum
      : activeAlan === "PEYZAJ"
      ? peyzajDurum
      : null;

  const initialNot =
    activeAlan === "PROJE"
      ? projeNot
      : activeAlan === "PEYZAJ"
      ? peyzajNot
      : null;

  return (
    <>
      <section className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
              Süreç Durumları
            </h3>
            
          </div>

          <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
            {rolKod ? `Rol: ${rolKod}` : "Rol okunamadı"}
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <div className={`rounded-xl border p-2 ${toneClasses("emerald")}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold">Proje Sorumlusu</div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 ring-1 ring-black/5 dark:bg-black/20 dark:text-zinc-200 dark:ring-white/10">
                  {projeDurum ?? "Henüz girilmedi"}
                </span>

                {canEditProje && (
                  <button
                    type="button"
                    onClick={() => openModal("PROJE", "Proje Sorumlusu")}
                    className="rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                  >
                    Güncelle
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2 rounded-lg bg-white/60 p-2 text-[11px] text-zinc-700 ring-1 ring-black/5 dark:bg-black/20 dark:text-zinc-200 dark:ring-white/10">
              <div className="whitespace-pre-wrap">{projeNot ?? "Not yok."}</div>
            </div>
          </div>

          <div className={`rounded-xl border p-2 ${toneClasses("sky")}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold">Peyzaj / Havuz Sorumlusu</div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 ring-1 ring-black/5 dark:bg-black/20 dark:text-zinc-200 dark:ring-white/10">
                  {peyzajDurum ?? "Henüz girilmedi"}
                </span>

                {canEditPeyzaj && (
                  <button
                    type="button"
                    onClick={() => openModal("PEYZAJ", "Peyzaj Sorumlusu")}
                    className="rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                  >
                    Güncelle
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2 rounded-lg bg-white/60 p-2 text-[11px] text-zinc-700 ring-1 ring-black/5 dark:bg-black/20 dark:text-zinc-200 dark:ring-white/10">
              <div className="whitespace-pre-wrap">{peyzajNot ?? "Not yok."}</div>
            </div>
          </div>
        </div>
      </section>

      <PeyzajSurecDurumuGuncelleModals
        isOpen={modalOpen}
        onClose={closeModal}
        isEmriId={record?.id ?? record?.Id}
        alan={activeAlan}
        alanTitle={activeTitle}
        initialDurum={initialDurum}
        initialNot={initialNot}
        onSaved={async () => {
          if (onUpdated) await onUpdated();
        }}
      />
    </>
  );
}

