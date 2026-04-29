import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
}

function asArray(v) {
  return Array.isArray(v) ? v : [];
}

function formatDateTR(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("tr-TR", {
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

function normalizePersonel(raw) {
  if (!raw) return null;
  const p = raw?.personel ?? raw;

  return {
    id: pick(p, "id", "Id") ?? null,
    ad: pick(p, "ad", "Ad") ?? "",
    soyad: pick(p, "soyad", "Soyad") ?? "",
    rol: pick(p, "rol", "Rol", "rolKod", "RolKod") ?? null,
  };
}

function normalizeResponse(res) {
  const items = Array.isArray(res?.items)
    ? res.items
    : Array.isArray(res?.Items)
    ? res.Items
    : Array.isArray(res)
    ? res
    : [];

  return {
    page: Number(pick(res, "page", "Page") ?? 1),
    pageSize: Number(pick(res, "pageSize", "PageSize") ?? 25),
    totalPages: Number(pick(res, "totalPages", "TotalPages") ?? 1),
    totalCount: Number(pick(res, "totalCount", "TotalCount") ?? items.length),
    items: items.map((x) => ({
      id: pick(x, "id", "Id") ?? null,
      personelId: pick(x, "personelId", "PersonelId") ?? null,
      tarih: pick(x, "tarih", "Tarih") ?? null,
      personelAdSoyad: pick(x, "personelAdSoyad", "PersonelAdSoyad") ?? "",
      gorevi: pick(x, "gorevi", "Gorevi") ?? "",
      bagliOlduguBirimProje:
        pick(x, "bagliOlduguBirimProje", "BagliOlduguBirimProje") ?? "",
      duzenlemeDurumu:
        pick(x, "duzenlemeDurumu", "DuzenlemeDurumu") === true,
      konuSayisi: Number(pick(x, "konuSayisi", "KonuSayisi") ?? 0),
      talepOneriSayisi: Number(
        pick(x, "talepOneriSayisi", "TalepOneriSayisi") ?? 0
      ),
      yorumSayisi: Number(pick(x, "yorumSayisi", "YorumSayisi") ?? 0),
      yoneticiSayisi: Number(pick(x, "yoneticiSayisi", "YoneticiSayisi") ?? 0),
      konularIlk3: pick(x, "konularIlk3", "KonularIlk3") ?? [],
      talepOnerilerIlk3:
        pick(x, "talepOnerilerIlk3", "TalepOnerilerIlk3") ?? [],
      yoneticilerIlk4: pick(x, "yoneticilerIlk4", "YoneticilerIlk4") ?? [],
    })),
  };
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
        pick(x, "ad", "Ad") ?? pick(personel, "ad", "Ad") ?? "";

      const soyad =
        pick(x, "soyad", "Soyad") ?? pick(personel, "soyad", "Soyad") ?? "";

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

function DurumPill({ ok }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/25 dark:text-emerald-200"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/25 dark:text-red-200"
      }`}
    >
      {ok ? "Açık" : "Kapalı"}
    </span>
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

const FIXED_ONAYCI_IDS = [4, 20, 90, 118];

export default function GunlukRaporlarimPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);
  const [items, setItems] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    pageSize: 25,
    totalPages: 1,
    totalCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [onayciCandidates, setOnayciCandidates] = useState([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editingRaporId, setEditingRaporId] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [editSelectedKonular, setEditSelectedKonular] = useState([]);
  const [editKonuDetaylari, setEditKonuDetaylari] = useState({});

  const [editSelectedTalepOneriler, setEditSelectedTalepOneriler] = useState([]);
  const [editTalepDetaylari, setEditTalepDetaylari] = useState({});
  const [editSelectedOnayciIds, setEditSelectedOnayciIds] = useState([]);

  const fullName = useMemo(() => {
    if (!personel) return "";
    return `${personel.ad || ""} ${personel.soyad || ""}`.trim();
  }, [personel]);

  useEffect(() => {
    const raw = getClientCookie("PersonelUserInfo");

    if (!raw) {
      router.push("/");
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const p = normalizePersonel(parsed);

      if (!p?.id) {
        router.push("/");
        return;
      }

      setPersonel(p);
    } catch (e) {
      console.error("PersonelUserInfo parse error:", e);
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const fetchOnaycilar = async () => {
      if (!personel?.id) return;

      try {
        let lookupsRes = null;
        let directOnayRes = null;

        try {
          lookupsRes = await getDataAsync(
            `Personeller/satinalma-yeni/lookups?personelId=${personel.id}`
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

        setOnayciCandidates(normalizeOnayciList(finalRaw));
      } catch (e) {
        console.error("Onaycılar alınamadı:", e);
      }
    };

    fetchOnaycilar();

    return () => {
      cancelled = true;
    };
  }, [personel?.id]);

  const endpoint = useMemo(() => {
    if (!personel?.id) return "";

    const qs = new URLSearchParams();
    qs.set("page", String(pageInfo.page || 1));
    qs.set("pageSize", String(pageInfo.pageSize || 25));

    if (startDate) qs.set("startDate", startDate);
    if (endDate) qs.set("endDate", endDate);
    if (search.trim()) qs.set("search", search.trim());

    return `gunlukRapor/raporlarim/${personel.id}?${qs.toString()}`;
  }, [
    personel?.id,
    pageInfo.page,
    pageInfo.pageSize,
    startDate,
    endDate,
    search,
  ]);

  const loadList = useCallback(async () => {
    if (!endpoint) return;

    try {
      setLoading(true);
      setErr("");

      const res = await getDataAsync(endpoint);
      const normalized = normalizeResponse(res);

      setItems(normalized.items);
      setPageInfo((prev) => ({
        ...prev,
        page: normalized.page,
        pageSize: normalized.pageSize,
        totalPages: normalized.totalPages,
        totalCount: normalized.totalCount,
      }));
    } catch (e) {
      console.error("GUNLUK RAPORLARIM LIST ERROR:", e);
      setItems([]);
      const status = e?.response?.status;
      setErr(status ? `Liste alınamadı (HTTP ${status}).` : "Liste alınamadı.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (!endpoint) return;
    loadList();
  }, [endpoint, loadList]);

  function resetFilters() {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setPageInfo((prev) => ({ ...prev, page: 1 }));
  }

  function changePage(nextPage) {
    if (nextPage < 1 || nextPage > pageInfo.totalPages) return;
    setPageInfo((prev) => ({ ...prev, page: nextPage }));
  }

  async function openEditModal(id) {
    if (!id) return;

    try {
      setEditOpen(true);
      setEditingRaporId(id);
      setEditLoading(true);
      setEditError("");

      const res = await getDataAsync(`gunlukRapor/${id}`);

      const konular = res?.konular ?? res?.Konular ?? [];
      const talepOneriler = res?.talepOneriler ?? res?.TalepOneriler ?? [];
      const yoneticiler = res?.yoneticiler ?? res?.Yoneticiler ?? [];

      const konuObj = {};
      const konuNames = [];

      konular.forEach((k) => {
        const konu = pick(k, "gunlukRaporKonu", "GunlukRaporKonu") || "";
        const aciklama =
          pick(k, "gunlukRaporKonuAciklama", "GunlukRaporKonuAciklama") || "";

        if (!konu) return;

        if (!konuObj[konu]) {
          konuObj[konu] = [];
          konuNames.push(konu);
        }

        konuObj[konu].push({ aciklama });
      });

      const talepObj = {};
      const talepNames = [];

      talepOneriler.forEach((t) => {
        const konu =
          pick(t, "gunlukRaporTalepOneriKonu", "GunlukRaporTalepOneriKonu") ||
          "";

        const aciklama =
          pick(
            t,
            "gunlukRaporTalepOneriKonuAciklama",
            "GunlukRaporTalepOneriKonuAciklama"
          ) || "";

        if (!konu) return;

        if (!talepObj[konu]) {
          talepObj[konu] = [];
          talepNames.push(konu);
        }

        talepObj[konu].push({ aciklama });
      });

      const yoneticiIds = yoneticiler
        .map((y) => pick(y, "secilenYoneticiId", "SecilenYoneticiId"))
        .map(Number)
        .filter(Boolean);

      setEditSelectedKonular(konuNames);
      setEditKonuDetaylari(konuObj);

      setEditSelectedTalepOneriler(talepNames);
      setEditTalepDetaylari(talepObj);

      setEditSelectedOnayciIds(
        Array.from(new Set([...yoneticiIds, ...FIXED_ONAYCI_IDS]))
      );
    } catch (e) {
      console.error(e);
      setEditError("Rapor bilgisi alınamadı.");
    } finally {
      setEditLoading(false);
    }
  }

  function closeEditModal() {
    setEditOpen(false);
    setEditingRaporId(null);
    setEditError("");
  }

  function toggleEditKonu(value) {
    setEditSelectedKonular((prev) => {
      const exists = prev.includes(value);

      if (exists) {
        const next = prev.filter((x) => x !== value);
        setEditKonuDetaylari((old) => {
          const copy = { ...old };
          delete copy[value];
          return copy;
        });
        return next;
      }

      setEditKonuDetaylari((old) => ({
        ...old,
        [value]: [{ aciklama: "" }],
      }));

      return [...prev, value];
    });
  }

  function updateEditKonuMadde(konu, index, value) {
    setEditKonuDetaylari((prev) => ({
      ...prev,
      [konu]: (prev[konu] || []).map((item, i) =>
        i === index ? { ...item, aciklama: value } : item
      ),
    }));
  }

  function addEditKonuMadde(konu) {
    setEditKonuDetaylari((prev) => ({
      ...prev,
      [konu]: [...(prev[konu] || []), { aciklama: "" }],
    }));
  }

  function removeEditKonuMadde(konu, index) {
    setEditKonuDetaylari((prev) => {
      const list = [...(prev[konu] || [])];
      if (list.length <= 1) return prev;

      return {
        ...prev,
        [konu]: list.filter((_, i) => i !== index),
      };
    });
  }

  function toggleEditTalepOneri(value) {
    setEditSelectedTalepOneriler((prev) => {
      const exists = prev.includes(value);

      if (exists) {
        const next = prev.filter((x) => x !== value);
        setEditTalepDetaylari((old) => {
          const copy = { ...old };
          delete copy[value];
          return copy;
        });
        return next;
      }

      setEditTalepDetaylari((old) => ({
        ...old,
        [value]: [{ aciklama: "" }],
      }));

      return [...prev, value];
    });
  }

  function updateEditTalepMadde(konu, index, value) {
    setEditTalepDetaylari((prev) => ({
      ...prev,
      [konu]: (prev[konu] || []).map((item, i) =>
        i === index ? { ...item, aciklama: value } : item
      ),
    }));
  }

  function addEditTalepMadde(konu) {
    setEditTalepDetaylari((prev) => ({
      ...prev,
      [konu]: [...(prev[konu] || []), { aciklama: "" }],
    }));
  }

  function removeEditTalepMadde(konu, index) {
    setEditTalepDetaylari((prev) => {
      const list = [...(prev[konu] || [])];
      if (list.length <= 1) return prev;

      return {
        ...prev,
        [konu]: list.filter((_, i) => i !== index),
      };
    });
  }

  function toggleEditOnayci(id) {
    const numId = Number(id);

    if (FIXED_ONAYCI_IDS.includes(numId)) return;

    setEditSelectedOnayciIds((prev) => {
      const exists = prev.some((x) => Number(x) === numId);
      if (exists) return prev.filter((x) => Number(x) !== numId);
      return [...prev, numId];
    });
  }

  async function handleEditSubmit(e) {
    e.preventDefault();

    if (!editingRaporId) return;

    setEditSaving(true);
    setEditError("");

    const konular = editSelectedKonular.flatMap((konu) =>
      (editKonuDetaylari[konu] || [])
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

    const talepOneriler = editSelectedTalepOneriler.flatMap((konu) =>
      (editTalepDetaylari[konu] || [])
        .map((item) => ({
          gunlukRaporTalepOneriKonu: konu,
          gunlukRaporTalepOneriKonuAciklama: String(
            item.aciklama || ""
          ).trim(),
        }))
        .filter(
          (x) =>
            String(x.gunlukRaporTalepOneriKonu || "").trim() ||
            String(x.gunlukRaporTalepOneriKonuAciklama || "").trim()
        )
    );

    if (konular.length === 0 && talepOneriler.length === 0) {
      setEditError("En az bir konu veya talep/öneri olmalıdır.");
      setEditSaving(false);
      return;
    }

    const payload = {
      personelId: Number(personel?.id),
      tarih: new Date().toISOString(),
      personelAdSoyad: fullName,
      gorevi: "",
      bagliOlduguBirimProje: "",
      konular,
      talepOneriler,
      secilenYoneticiIdler: Array.from(
        new Set(
          [...editSelectedOnayciIds, ...FIXED_ONAYCI_IDS]
            .map(Number)
            .filter(Boolean)
        )
      ),
    };

    try {
      await postDataAsync(`gunlukRapor/${editingRaporId}/guncelle`, payload);

      closeEditModal();
      await loadList();
    } catch (e) {
      console.error(e);
      setEditError(
        e?.response?.data || e?.message || "Güncelleme sırasında hata oluştu."
      );
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <div className="p-3 space-y-3">
      <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Günlük Raporlarım
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Kendi oluşturduğun günlük raporların listesi
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => router.push("/gunlukRapor/yeni")}
              className="rounded-md bg-emerald-600 px-3 py-2 text-[12px] font-semibold text-white hover:bg-emerald-700"
            >
              Yeni Rapor
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-md bg-blue-600 px-3 py-2 text-[12px] font-semibold text-white hover:bg-blue-700"
            >
              Ana Sayfa
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-[12px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              Filtreleri Sıfırla
            </button>

            <button
              type="button"
              onClick={loadList}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Yenile
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-6">
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-[11px] text-zinc-500">Başlangıç Tarihi</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPageInfo((prev) => ({ ...prev, page: 1 }));
              }}
              className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-[12px] outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-[11px] text-zinc-500">Bitiş Tarihi</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPageInfo((prev) => ({ ...prev, page: 1 }));
              }}
              className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-[12px] outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-[11px] text-zinc-500">Arama</label>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageInfo((prev) => ({ ...prev, page: 1 }));
              }}
              placeholder="Rapor no / konu / açıklama / talep"
              className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-[12px] outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
        </div>

        {err ? (
          <div className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {err}
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
            Raporlarım
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Toplam: {pageInfo.totalCount}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1250px] w-full border-collapse text-[12px]">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                {[
                  "Rapor No",
                  "Tarih",
                  "Konu",
                  "Talep / Öneri",
                  "Yorum",
                  "Yönetici",
                  "Düzenleme",
                  "İşlem",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left font-semibold text-zinc-700 dark:text-zinc-200 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {items.map((r, i) => (
                <tr
                  key={r.id ?? i}
                  onClick={() => router.push(`/gunlukRapor/${r.id}`)}
                  className="cursor-pointer border-t border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                  title="Detaya git"
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                      #{safeText(r.id)}
                    </span>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatDateTR(r.tarih)}
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                      {Number(r.konuSayisi) || 0}
                    </span>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                      {Number(r.talepOneriSayisi) || 0}
                    </span>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      {Number(r.yorumSayisi) || 0}
                    </span>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      {Number(r.yoneticiSayisi) || 0}
                    </span>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    <DurumPill ok={!!r.duzenlemeDurumu} />
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      type="button"
                      disabled={!r.duzenlemeDurumu}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(r.id);
                      }}
                      className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-40"
                    >
                      Düzenle
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && !items.length && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-10 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-10 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    Yükleniyor...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <button
            type="button"
            disabled={pageInfo.page <= 1}
            onClick={() => changePage(pageInfo.page - 1)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-[12px] font-semibold disabled:opacity-40"
          >
            Önceki
          </button>

          <div className="text-[11px] text-zinc-500">
            Sayfa {pageInfo.page} / {pageInfo.totalPages}
          </div>

          <button
            type="button"
            disabled={pageInfo.page >= pageInfo.totalPages}
            onClick={() => changePage(pageInfo.page + 1)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-[12px] font-semibold disabled:opacity-40"
          >
            Sonraki
          </button>
        </div>
      </div>

      {editOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-semibold text-amber-600">
                  Günlük Rapor
                </div>
                <div className="text-[14px] font-semibold">Rapor Düzenle</div>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg border border-zinc-300 px-3 py-1 text-[11px] font-semibold dark:border-zinc-700"
              >
                Kapat
              </button>
            </div>

            {editError ? (
              <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-2 py-2 text-[11px] text-rose-700">
                {editError}
              </div>
            ) : null}

            {editLoading ? (
              <div className="py-8 text-center text-[12px] text-zinc-500">
                Rapor hazırlanıyor...
              </div>
            ) : (
              <form onSubmit={handleEditSubmit} className="flex flex-col gap-2">
                <SectionCard
                  title="Rapor İletilecek Yöneticiler"
                  right={
                    <div className="text-[10px] text-zinc-500">
                      {editSelectedOnayciIds.length} seçili
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
                        const isFixed = FIXED_ONAYCI_IDS.includes(
                          Number(m.personelId)
                        );

                        const checked =
                          isFixed ||
                          editSelectedOnayciIds.some(
                            (x) => Number(x) === Number(m.personelId)
                          );

                        return (
                          <label
                            key={`edit-${m.id}-${m.personelId}`}
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
                              onChange={() => toggleEditOnayci(m.personelId)}
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
                    <div className="text-[10px] text-zinc-500">
                      {editSelectedKonular.length} seçili
                    </div>
                  }
                >
                  <div className="grid grid-cols-2 gap-1">
                    {RAPOR_KONU_OPTIONS.map((item) => {
                      const checked = editSelectedKonular.includes(item);

                      return (
                        <label
                          key={`edit-konu-${item}`}
                          className={`flex items-center gap-2 rounded-lg border px-2 py-1 text-[12px] ${
                            checked
                              ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
                              : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleEditKonu(item)}
                            className="h-4 w-4"
                          />

                          <span className="truncate">{item}</span>
                        </label>
                      );
                    })}
                  </div>
                </SectionCard>

                {editSelectedKonular.map((konu) => (
                  <SectionCard
                    key={`edit-selected-${konu}`}
                    title={`${konu} Detayları`}
                    right={
                      <button
                        type="button"
                        onClick={() => addEditKonuMadde(konu)}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white"
                      >
                        + Madde
                      </button>
                    }
                  >
                    <div className="flex flex-col gap-2">
                      {(editKonuDetaylari[konu] || []).map((item, index) => (
                        <div
                          key={`edit-konu-${konu}-${index}`}
                          className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-950"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="text-[11px] font-semibold">
                              Başlık: {konu}
                            </div>

                            <button
                              type="button"
                              onClick={() => removeEditKonuMadde(konu, index)}
                              className="rounded-lg bg-rose-600 px-3 py-1 text-[11px] font-semibold text-white"
                            >
                              Sil
                            </button>
                          </div>

                          <textarea
                            value={item.aciklama}
                            onChange={(e) =>
                              updateEditKonuMadde(konu, index, e.target.value)
                            }
                            rows={3}
                            placeholder={`${konu} açıklaması`}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-[12px] outline-none dark:border-zinc-800 dark:bg-zinc-900"
                          />
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                ))}

                <SectionCard
                  title="Dilek / Şikayet / Öneri"
                  right={
                    <div className="text-[10px] text-zinc-500">
                      {editSelectedTalepOneriler.length} seçili
                    </div>
                  }
                >
                  <div className="grid grid-cols-2 gap-1">
                    {TALEP_ONERI_OPTIONS.map((item) => {
                      const checked = editSelectedTalepOneriler.includes(item);

                      return (
                        <label
                          key={`edit-talep-${item}`}
                          className={`flex items-center gap-2 rounded-lg border px-2 py-1 text-[12px] ${
                            checked
                              ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
                              : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleEditTalepOneri(item)}
                            className="h-4 w-4"
                          />

                          <span className="truncate">{item}</span>
                        </label>
                      );
                    })}
                  </div>
                </SectionCard>

                {editSelectedTalepOneriler.map((konu) => (
                  <SectionCard
                    key={`edit-talep-selected-${konu}`}
                    title={`${konu} Detayları`}
                    right={
                      <button
                        type="button"
                        onClick={() => addEditTalepMadde(konu)}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white"
                      >
                        + Madde
                      </button>
                    }
                  >
                    <div className="flex flex-col gap-2">
                      {(editTalepDetaylari[konu] || []).map((item, index) => (
                        <div
                          key={`edit-talep-${konu}-${index}`}
                          className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-950"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="text-[11px] font-semibold">
                              Başlık: {konu}
                            </div>

                            <button
                              type="button"
                              onClick={() => removeEditTalepMadde(konu, index)}
                              className="rounded-lg bg-rose-600 px-3 py-1 text-[11px] font-semibold text-white"
                            >
                              Sil
                            </button>
                          </div>

                          <textarea
                            value={item.aciklama}
                            onChange={(e) =>
                              updateEditTalepMadde(konu, index, e.target.value)
                            }
                            rows={10}
                            placeholder={`${konu} açıklaması`}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-[12px] outline-none dark:border-zinc-800 dark:bg-zinc-900"
                          />
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                ))}

                <button
                  type="submit"
                  disabled={editSaving}
                  className="mt-2 h-9 rounded-lg bg-emerald-600 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {editSaving ? "Güncelleniyor..." : "Güncelle"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}