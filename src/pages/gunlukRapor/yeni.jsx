import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function asArray(v) {
  return Array.isArray(v) ? v : [];
}

function toDateInputValue(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function formatDateTR(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("tr-TR");
}

function getOnaycilarFromAnyShape(raw) {
  if (Array.isArray(raw)) return raw;

  const dataNode = raw?.data ?? raw?.Data;
  const direct1 = asArray(raw?.onaycilar);
  const direct2 = asArray(raw?.Onaycilar);
  const nested1 = asArray(dataNode?.onaycilar);
  const nested2 = asArray(dataNode?.Onaycilar);

  if (direct1.length) return direct1;
  if (direct2.length) return direct2;
  if (nested1.length) return nested1;
  if (nested2.length) return nested2;
  return [];
}

function normalizeOnayciList(arr) {
  if (!Array.isArray(arr)) return [];

  return arr
    .map((x) => {
      const personel = x?.personel ?? x?.Personel ?? null;

      const personelId =
        pick(x, "personelId", "PersonelId") ??
        pick(personel, "id", "Id") ??
        pick(x, "id", "Id");

      const ad =
        pick(x, "ad", "Ad") ??
        pick(personel, "ad", "Ad") ??
        "";

      const soyad =
        pick(x, "soyad", "Soyad") ??
        pick(personel, "soyad", "Soyad") ??
        "";

      return {
        id: pick(x, "id", "Id") ?? personelId ?? null,
        personelId: personelId ?? null,
        ad: ad ?? "",
        soyad: soyad ?? "",
      };
    })
    .filter((x) => Number(x.personelId) > 0)
    .filter(
      (x, index, self) =>
        self.findIndex((y) => Number(y.personelId) === Number(x.personelId)) ===
        index
    );
}

function SectionCard({ title, children, right }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
        {right ? <div>{right}</div> : null}
      </div>
      {children}
    </section>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="text-[12px] font-medium text-zinc-900 dark:text-zinc-100">
        {value || "-"}
      </div>
    </div>
  );
}

function TinyButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 items-center justify-center rounded-lg px-3 text-[11px] font-medium transition active:scale-[0.98] disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

function TextArea({ value, onChange, placeholder, rows = 2 }) {
  return (
    <textarea
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-[12px] outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
    />
  );
}

const RAPOR_KONU_OPTIONS = [
  "Havuz",
  "Peyzaj",
  "Teknik",
  "Tadilat",
  "Satınalma",
  "Temizlik",
  "Güvenlik",
  "İnsan Kaynakları",
];

const TALEP_ONERI_OPTIONS = ["Dilek", "Şikayet", "Öneri", "Bilgilendirme"];

export default function GunlukRaporYeniPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);
  const [loadingBoot, setLoadingBoot] = useState(true);
  const [saving, setSaving] = useState(false);

  const [onayciCandidates, setOnayciCandidates] = useState([]);
  const [selectedOnayciIds, setSelectedOnayciIds] = useState([20]);

  const [tarih] = useState(() => toDateInputValue(new Date()));

  const [selectedKonular, setSelectedKonular] = useState([]);
  const [konuDetaylari, setKonuDetaylari] = useState({});

  const [selectedTalepOneriler, setSelectedTalepOneriler] = useState([]);
  const [talepDetaylari, setTalepDetaylari] = useState({});

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const personelId = useMemo(() => {
    if (!personel) return null;
    return (
      personel?.id ??
      personel?.Id ??
      personel?.personel?.id ??
      personel?.personel?.Id ??
      null
    );
  }, [personel]);

  const fullName = useMemo(() => {
    const p = personel?.personel ?? personel ?? {};
    const ad = p?.ad ?? p?.Ad ?? "";
    const soyad = p?.soyad ?? p?.Soyad ?? "";
    return `${ad} ${soyad}`.trim();
  }, [personel]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const personelCookie = getClientCookie("PersonelUserInfo");
      if (!personelCookie) {
        router.replace("/");
        return;
      }

      const parsed = JSON.parse(personelCookie);
      setPersonel(parsed);
    } catch (err) {
      console.error("PersonelUserInfo parse error:", err);
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const fetchOnaycilar = async () => {
      if (!personelId) return;

      setLoadingBoot(true);
      setError("");

      try {
        let lookupsRes = null;
        let directOnayRes = null;

        try {
          lookupsRes = await getDataAsync(
            `Personeller/satinalma-yeni/lookups?personelId=${personelId}`
          );
        } catch (e) {
          console.warn("lookups endpoint hata:", e);
        }

        try {
          directOnayRes = await getDataAsync("Personeller/satinalma/onaycilar");
        } catch (e) {
          console.warn("onaycilar endpoint hata:", e);
        }

        if (cancelled) return;

        const directList = getOnaycilarFromAnyShape(directOnayRes);
        const fallbackList = getOnaycilarFromAnyShape(lookupsRes);
        const finalRaw = directList.length ? directList : fallbackList;
        const normalized = normalizeOnayciList(finalRaw);

        setOnayciCandidates(normalized);

        const has20 = normalized.some((x) => Number(x.personelId) === 20);
        if (has20) {
          setSelectedOnayciIds((prev) => {
            const set = new Set(prev.map(Number));
            set.add(20);
            return Array.from(set);
          });
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(err?.message || "Onaycı personeller yüklenirken hata oluştu.");
        }
      } finally {
        if (!cancelled) setLoadingBoot(false);
      }
    };

    fetchOnaycilar();

    return () => {
      cancelled = true;
    };
  }, [personelId]);

  function toggleOnayci(id) {
    const numId = Number(id);
    if (numId === 20   ) return;

    setSelectedOnayciIds((prev) => {
      const exists = prev.some((x) => Number(x) === numId);
      if (exists) return prev.filter((x) => Number(x) !== numId);
      return [...prev, numId];
    }); 
  }

  function toggleKonu(value) {
    setSelectedKonular((prev) => {
      const exists = prev.includes(value);

      if (exists) {
        const next = prev.filter((x) => x !== value);
        setKonuDetaylari((old) => {
          const copy = { ...old };
          delete copy[value];
          return copy;
        });
        return next;
      }

      setKonuDetaylari((old) => ({
        ...old,
        [value]: [{ aciklama: "" }],
      }));

      return [...prev, value];
    });
  }

  function toggleTalepOneri(value) {
    setSelectedTalepOneriler((prev) => {
      const exists = prev.includes(value);

      if (exists) {
        const next = prev.filter((x) => x !== value);
        setTalepDetaylari((old) => {
          const copy = { ...old };
          delete copy[value];
          return copy;
        });
        return next;
      }

      setTalepDetaylari((old) => ({
        ...old,
        [value]: [{ aciklama: "" }],
      }));

      return [...prev, value];
    });
  }

  function addKonuMadde(konu) {
    setKonuDetaylari((prev) => ({
      ...prev,
      [konu]: [...(prev[konu] || []), { aciklama: "" }],
    }));
  }

  function updateKonuMadde(konu, index, value) {
    setKonuDetaylari((prev) => ({
      ...prev,
      [konu]: (prev[konu] || []).map((item, i) =>
        i === index ? { ...item, aciklama: value } : item
      ),
    }));
  }

  function removeKonuMadde(konu, index) {
    setKonuDetaylari((prev) => {
      const list = [...(prev[konu] || [])];
      if (list.length <= 1) return prev;

      return {
        ...prev,
        [konu]: list.filter((_, i) => i !== index),
      };
    });
  }

  function addTalepMadde(konu) {
    setTalepDetaylari((prev) => ({
      ...prev,
      [konu]: [...(prev[konu] || []), { aciklama: "" }],
    }));
  }

  function updateTalepMadde(konu, index, value) {
    setTalepDetaylari((prev) => ({
      ...prev,
      [konu]: (prev[konu] || []).map((item, i) =>
        i === index ? { ...item, aciklama: value } : item
      ),
    }));
  }

  function removeTalepMadde(konu, index) {
    setTalepDetaylari((prev) => {
      const list = [...(prev[konu] || [])];
      if (list.length <= 1) return prev;

      return {
        ...prev,
        [konu]: list.filter((_, i) => i !== index),
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!personelId) {
      setError("Personel bilgisi bulunamadı.");
      return;
    }

    const konular = selectedKonular.flatMap((konu) =>
      (konuDetaylari[konu] || [])
        .map((item) => ({
          gunlukRaporKonu: konu,
          gunlukRaporKonuAciklama: String(item.aciklama || "").trim(),
        }))
        .filter(
          (x) =>
            String(x.gunlukRaporKonu || "").trim() ||
            String(x.gunlukRaporKonuAciklama || "").trim()
        )
    );

    const talepOneriler = selectedTalepOneriler.flatMap((konu) =>
      (talepDetaylari[konu] || [])
        .map((item) => ({
          gunlukRaporTalepOneriKonu: konu,
          gunlukRaporTalepOneriKonuAciklama: String(item.aciklama || "").trim(),
        }))
        .filter(
          (x) =>
            String(x.gunlukRaporTalepOneriKonu || "").trim() ||
            String(x.gunlukRaporTalepOneriKonuAciklama || "").trim()
        )
    );

    if (konular.length === 0 && talepOneriler.length === 0) {
      setError("En az bir konu veya talep/öneri girmelisin.");
      return;
    }

    const payload = {
      personelId: Number(personelId),
      tarih: new Date(`${tarih}T12:00:00`).toISOString(),
      personelAdSoyad: fullName,
      gorevi: "",
      bagliOlduguBirimProje: "",
      konular,
      talepOneriler,
      secilenYoneticiIdler: Array.from(
        new Set(
          [...selectedOnayciIds, 4, 20, 90].map(Number).filter(Boolean),
        ),
      ),
    };

    try {
      setSaving(true);

      const res = await postDataAsync("gunlukRapor", payload);
      const createdId = pick(res, "id", "Id");

      setSuccessMsg("Günlük rapor gönderildi.");

      if (createdId) {
        setTimeout(() => {
          router.push(`/gunlukRapor/${createdId}`);
        }, 500);
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data || err?.message || "Kayıt sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-2 py-2 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex w-full max-w-md flex-col gap-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold text-emerald-600">
                Günlük Rapor
              </div>
              <div className="text-[13px] font-semibold">Yeni Kayıt</div>
            </div>

            <TinyButton
              onClick={() => router.back()}
              className="border border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            >
              Geri
            </TinyButton>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-2 text-[11px] text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        ) : null}

        {successMsg ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-[11px] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            {successMsg}
          </div>
        ) : null}

        {loadingBoot ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-3 text-center text-[12px] text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Hazırlanıyor...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <SectionCard title="Bilgiler">
              <div className="grid grid-cols-2 gap-2">
                <MiniInfo label="Personel" value={fullName} />
                <MiniInfo label="Tarih" value={formatDateTR(tarih)} />
              </div>
            </SectionCard>

            <SectionCard
              title="Rapor İletilecek Yöneticiler"
              right={
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {selectedOnayciIds.length} seçili
                </div>
              }
            >
              {onayciCandidates.length === 0 ? (
                <div className="text-[11px] text-zinc-500">
                  Onaycı bulunamadı.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  {onayciCandidates.map((m) => {
                    const fixedIds = [4, 20, 90];

                    const isFixed = fixedIds.includes(Number(m.personelId));

                    const checked =
                      isFixed ||
                      selectedOnayciIds.some(
                        (x) => Number(x) === Number(m.personelId),
                      );

                    return (
                      <label
                        key={`${m.id}-${m.personelId}`}
                        className={`flex items-center gap-2 rounded-lg border px-2 py-1 text-[12px] ${
                          checked
                            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
                            : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isFixed}
                          onChange={() => toggleOnayci(m.personelId)}
                          className="h-4 w-4"
                        />
                        <span className="truncate">
                          {`${m.ad || ""} ${m.soyad || ""}`.trim() || "-"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </SectionCard>
            <SectionCard
              title="Hazır Konular"
              right={
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {selectedKonular.length} seçili
                </div>
              }
            >
              <div className="grid grid-cols-2 gap-1">
                {RAPOR_KONU_OPTIONS.map((item) => {
                  const checked = selectedKonular.includes(item);
                  return (
                    <label
                      key={item}
                      className={`flex items-center gap-2 rounded-lg border px-2 py-1 text-[12px] ${
                        checked
                          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
                          : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleKonu(item)}
                        className="h-4 w-4"
                      />
                      <span className="truncate">{item}</span>
                    </label>
                  );
                })}
              </div>
            </SectionCard>

            {selectedKonular.map((konu) => (
              <SectionCard
                key={konu}
                title={`${konu} Detayları`}
                right={
                  <TinyButton
                    onClick={() => addKonuMadde(konu)}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    + Madde
                  </TinyButton>
                }
              >
                <div className="flex flex-col gap-2">
                  {(konuDetaylari[konu] || []).map((item, index) => (
                    <div
                      key={`${konu}-${index}`}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                          Başlık: {konu}
                        </div>

                        <TinyButton
                          onClick={() => removeKonuMadde(konu, index)}
                          className="bg-rose-600 text-white hover:bg-rose-700"
                        >
                          Sil
                        </TinyButton>
                      </div>

                      <TextArea
                        value={item.aciklama}
                        onChange={(e) =>
                          updateKonuMadde(konu, index, e.target.value)
                        }
                        placeholder={`${konu} açıklaması`}
                        rows={3}
                      />
                    </div>
                  ))}
                </div>
              </SectionCard>
            ))}

            <SectionCard
              title="Dilek / Şikayet / Öneri"
              right={
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {selectedTalepOneriler.length} seçili
                </div>
              }
            >
              <div className="grid grid-cols-2 gap-1">
                {TALEP_ONERI_OPTIONS.map((item) => {
                  const checked = selectedTalepOneriler.includes(item);
                  return (
                    <label
                      key={item}
                      className={`flex items-center gap-2 rounded-lg border px-2 py-1 text-[12px] ${
                        checked
                          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
                          : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTalepOneri(item)}
                        className="h-4 w-4"
                      />
                      <span className="truncate">{item}</span>
                    </label>
                  );
                })}
              </div>
            </SectionCard>

            {selectedTalepOneriler.map((konu) => (
              <SectionCard
                key={konu}
                title={`${konu} Detayları`}
                right={
                  <TinyButton
                    onClick={() => addTalepMadde(konu)}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    + Madde
                  </TinyButton>
                }
              >
                <div className="flex flex-col gap-2">
                  {(talepDetaylari[konu] || []).map((item, index) => (
                    <div
                      key={`${konu}-${index}`}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                          Başlık: {konu}
                        </div>

                        <TinyButton
                          onClick={() => removeTalepMadde(konu, index)}
                          className="bg-rose-600 text-white hover:bg-rose-700"
                        >
                          Sil
                        </TinyButton>
                      </div>

                      <TextArea
                        value={item.aciklama}
                        onChange={(e) =>
                          updateTalepMadde(konu, index, e.target.value)
                        }
                        placeholder={`${konu} açıklaması`}
                        rows={3}
                      />
                    </div>
                  ))}
                </div>
              </SectionCard>
            ))}

            <div className="pb-3">
              <TinyButton
                type="submit"
                disabled={saving}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {saving ? "Gönderiliyor..." : "Gönder"}
              </TinyButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}