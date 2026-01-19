import { useEffect, useMemo, useState } from "react";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import SurecDurumuGuncelleModals from "@/components/isEmriDetay/SurecDurumuGuncelleModals";

export default function IsEmriDetaySurecDurumlari({ record, onUpdated }) {
  const pick = (obj, camel, pascal) => obj?.[camel] ?? obj?.[pascal] ?? null;

  const [personel, setPersonel] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeAlan, setActiveAlan] = useState(null); // "PROJE" | "OP_TEK" | "OP_GEN"
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

  // ✅ Rol çözümü (cookie formatı farklıysa da yakalar)
  const rolKod = useMemo(() => {
    if (!personel) return null;

    const rk1 = personel?.rolKod ?? personel?.RolKod ?? null;
    if (rk1 != null && !isNaN(Number(rk1))) return Number(rk1);

    const rk2 = personel?.rol ?? personel?.Rol ?? null;
    if (rk2 != null && !isNaN(Number(rk2))) return Number(rk2);

    const s = (rk2 ?? "").toString().toLowerCase();

    if (s.includes("proje") && s.includes("yonet")) return 40;

    if (
      (s.includes("teknik") && s.includes("mudur")) ||
      s.includes("operasyon") ||
      s.includes("genel")
    ) {
      return 90;
    }

    return null;
  }, [personel]);

  // Yetki:
  const canEditProje = rolKod === 40;
  const canEditOp = rolKod === 90;

  const fmt = (v) => {
    const s = (v ?? "").toString().trim();
    return s ? s : null;
  };

  const toneClasses = (tone) => {
    if (tone === "emerald")
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200";
    if (tone === "sky")
      return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200";
    if (tone === "amber")
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200";
    return "border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-200";
  };

  // Record değerleri
  const projeDurum = fmt(
    pick(record, "projeYoneticiSurecDurumu", "ProjeYoneticiSurecDurumu")
  );
  const projeNot = fmt(
    pick(record, "projeYoneticiSurecNotu", "ProjeYoneticiSurecNotu")
  );

  const opTekDurum = fmt(
    pick(
      record,
      "operasyonTeknikMudurSurecDurumu",
      "OperasyonTeknikMudurSurecDurumu"
    )
  );
  const opTekNot = fmt(
    pick(
      record,
      "operasyonTeknikMudurSurecNotu",
      "OperasyonTeknikMudurSurecNotu"
    )
  );

  const opGenDurum = fmt(
    pick(
      record,
      "operasyonGenelMudurSurecDurumu",
      "OperasyonGenelMudurSurecDurumu"
    )
  );
  const opGenNot = fmt(
    pick(
      record,
      "operasyonGenelMudurSurecNotu",
      "OperasyonGenelMudurSurecNotu"
    )
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

  // modal initial values
  const initialDurum =
    activeAlan === "PROJE"
      ? projeDurum
      : activeAlan === "OP_TEK"
      ? opTekDurum
      : activeAlan === "OP_GEN"
      ? opGenDurum
      : null;

  const initialNot =
    activeAlan === "PROJE"
      ? projeNot
      : activeAlan === "OP_TEK"
      ? opTekNot
      : activeAlan === "OP_GEN"
      ? opGenNot
      : null;

  return (
    <>
      <section className="mt-3 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 print:border-0 print:bg-transparent print:p-0">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
              Süreç Durumları
            </h3>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
              (Proje / Operasyon takip notları)
            </div>
          </div>

          {/* ✅ Global buton kaldırıldı */}
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
            {rolKod ? `Rol: ${rolKod}` : "Rol okunamadı"}
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          {/* PROJE */}
          <div className={`rounded-xl border p-2 ${toneClasses("emerald")}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold">Proje Yöneticisi</div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 ring-1 ring-black/5 dark:bg-black/20 dark:text-zinc-200 dark:ring-white/10">
                  {projeDurum ?? "Henüz girilmedi"}
                </span>

                {canEditProje && (
                  <button
                    type="button"
                    onClick={() => openModal("PROJE", "Proje Yöneticisi")}
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

          {/* OP TEK */}
          <div className={`rounded-xl border p-2 ${toneClasses("sky")}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold">
                Operasyon Teknik Müdür
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 ring-1 ring-black/5 dark:bg-black/20 dark:text-zinc-200 dark:ring-white/10">
                  {opTekDurum ?? "Henüz girilmedi"}
                </span>

                {canEditOp && (
                  <button
                    type="button"
                    onClick={() => openModal("OP_TEK", "Operasyon Teknik Müdür")}
                    className="rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                  >
                    Güncelle
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2 rounded-lg bg-white/60 p-2 text-[11px] text-zinc-700 ring-1 ring-black/5 dark:bg-black/20 dark:text-zinc-200 dark:ring-white/10">
              
              <div className="whitespace-pre-wrap">{opTekNot ?? "Not yok."}</div>
            </div>
          </div>

          {/* OP GEN */}
          <div className={`rounded-xl border p-2 ${toneClasses("amber")}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold">
                Operasyon Genel Müdür
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 ring-1 ring-black/5 dark:bg-black/20 dark:text-zinc-200 dark:ring-white/10">
                  {opGenDurum ?? "Henüz girilmedi"}
                </span>

                {canEditOp && (
                  <button
                    type="button"
                    onClick={() => openModal("OP_GEN", "Operasyon Genel Müdür")}
                    className="rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                  >
                    Güncelle
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2 rounded-lg bg-white/60 p-2 text-[11px] text-zinc-700 ring-1 ring-black/5 dark:bg-black/20 dark:text-zinc-200 dark:ring-white/10">
              
              <div className="whitespace-pre-wrap">{opGenNot ?? "Not yok."}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ MODAL BURADA AÇILIR */}
      <SurecDurumuGuncelleModals
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
